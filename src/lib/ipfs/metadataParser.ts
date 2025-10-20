import { AnyMetadata } from './schemas';
import { MetadataValidator } from './metadataValidator';
import { retrieveContent } from './pinata';
import { getCachedContent, setCachedContent } from './cache';

export interface ParsedMetadata {
  metadata: AnyMetadata;
  cid: string;
  isValid: boolean;
  isCorrupted: boolean;
  errors: string[];
  warnings: string[];
  parsedAt: string;
}

export class MetadataParser {
  static async parseFromCID(cid: string, useCache = true): Promise<ParsedMetadata> {
    try {
      let rawData: any;

      if (useCache) {
        const cached = getCachedContent(cid);
        if (cached) {
          rawData = cached;
        }
      }

      if (!rawData) {
        rawData = await retrieveContent(cid);
        if (useCache) {
          setCachedContent(cid, rawData);
        }
      }

      return this.parseRawMetadata(rawData, cid);
    } catch (error) {
      return {
        metadata: {} as AnyMetadata,
        cid,
        isValid: false,
        isCorrupted: true,
        errors: [`Failed to retrieve or parse metadata: ${(error as Error).message}`],
        warnings: [],
        parsedAt: new Date().toISOString(),
      };
    }
  }

  static parseRawMetadata(rawData: any, cid: string): ParsedMetadata {
    const parsedAt = new Date().toISOString();

    if (!rawData || typeof rawData !== 'object') {
      return {
        metadata: {} as AnyMetadata,
        cid,
        isValid: false,
        isCorrupted: true,
        errors: ['Invalid metadata format: not an object'],
        warnings: [],
        parsedAt,
      };
    }

    if (!rawData.schemaType) {
      return {
        metadata: rawData as AnyMetadata,
        cid,
        isValid: false,
        isCorrupted: false,
        errors: ['Missing schemaType field'],
        warnings: [],
        parsedAt,
      };
    }

    const validationResult = MetadataValidator.validate(rawData as AnyMetadata);

    return {
      metadata: rawData as AnyMetadata,
      cid,
      isValid: validationResult.isValid,
      isCorrupted: false,
      errors: validationResult.errors.filter((e) => e.severity === 'error').map((e) => e.message),
      warnings: validationResult.warnings.map((w) => w.message),
      parsedAt,
    };
  }

  static async parseBatch(cids: string[], useCache = true): Promise<ParsedMetadata[]> {
    const parsePromises = cids.map((cid) => this.parseFromCID(cid, useCache));
    return Promise.all(parsePromises);
  }

  static extractSummary(parsed: ParsedMetadata): {
    schemaType: string;
    batchId?: string;
    timestamp?: string;
    isValid: boolean;
  } {
    return {
      schemaType: parsed.metadata.schemaType || 'unknown',
      batchId: (parsed.metadata as any).batchId,
      timestamp: parsed.metadata.createdAt,
      isValid: parsed.isValid,
    };
  }

  static filterBySchemaType(
    parsedMetadata: ParsedMetadata[],
    schemaType: string
  ): ParsedMetadata[] {
    return parsedMetadata.filter((p) => p.metadata.schemaType === schemaType);
  }

  static filterValidMetadata(parsedMetadata: ParsedMetadata[]): ParsedMetadata[] {
    return parsedMetadata.filter((p) => p.isValid && !p.isCorrupted);
  }

  static filterCorruptedMetadata(parsedMetadata: ParsedMetadata[]): ParsedMetadata[] {
    return parsedMetadata.filter((p) => p.isCorrupted);
  }

  static async handleCorruptedData(
    cid: string,
    fallbackStrategy: 'skip' | 'default' | 'retry' = 'skip'
  ): Promise<ParsedMetadata | null> {
    switch (fallbackStrategy) {
      case 'retry':
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return await this.parseFromCID(cid, false);
        } catch {
          return null;
        }

      case 'default':
        return {
          metadata: {
            version: '1.0.0',
            schemaType: 'unknown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isValid: false,
          } as AnyMetadata,
          cid,
          isValid: false,
          isCorrupted: true,
          errors: ['Using default metadata due to corruption'],
          warnings: [],
          parsedAt: new Date().toISOString(),
        };

      case 'skip':
      default:
        return null;
    }
  }

  static sanitizeMetadata(metadata: AnyMetadata): AnyMetadata {
    const sanitized = { ...metadata };

    if (typeof sanitized.version !== 'string') {
      sanitized.version = '1.0.0';
    }

    if (typeof sanitized.schemaType !== 'string') {
      sanitized.schemaType = 'unknown';
    }

    if (typeof sanitized.createdAt !== 'string') {
      sanitized.createdAt = new Date().toISOString();
    }

    if (typeof sanitized.updatedAt !== 'string') {
      sanitized.updatedAt = new Date().toISOString();
    }

    if (typeof sanitized.isValid !== 'boolean') {
      sanitized.isValid = false;
    }

    return sanitized;
  }
}

export async function parseMissingIPFSData(
  cid: string
): Promise<ParsedMetadata | null> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const parsed = await MetadataParser.parseFromCID(cid, false);
      if (!parsed.isCorrupted) {
        return parsed;
      }
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`Failed to parse IPFS data after ${maxRetries} attempts:`, error);
        return null;
      }
    }
  }

  return null;
}
