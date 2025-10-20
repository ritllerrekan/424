import { uploadJSON } from './pinata';
import { MetadataBuilder } from './metadataBuilder';
import { MetadataValidator, ValidationResult } from './metadataValidator';
import { MetadataVersionManager, VersionedMetadata } from './metadataVersioning';
import { MetadataParser, ParsedMetadata } from './metadataParser';
import { MetadataSearch, SearchResult, SearchOptions } from './metadataSearch';
import {
  AnyMetadata,
  MetadataSearchQuery,
  CollectorBatchMetadata,
  TesterBatchMetadata,
  ProcessorBatchMetadata,
  ManufacturerBatchMetadata,
  WasteMetricsMetadata,
  QualityReportMetadata,
} from './schemas';

export interface UploadMetadataResult {
  cid: string;
  metadata: AnyMetadata;
  validation: ValidationResult;
  timestamp: string;
}

export class MetadataManager {
  static async uploadMetadata(
    metadata: AnyMetadata,
    options?: {
      validate?: boolean;
      name?: string;
      keyvalues?: Record<string, string>;
    }
  ): Promise<UploadMetadataResult> {
    const { validate = true, name, keyvalues = {} } = options || {};

    let validation: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (validate) {
      validation = MetadataValidator.validate(metadata);
      if (!validation.isValid) {
        throw new Error(
          `Metadata validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
        );
      }
    }

    const metadataName = name || `${metadata.schemaType}-${Date.now()}`;
    const result = await uploadJSON(metadata, {
      name: metadataName,
      keyvalues: {
        schemaType: metadata.schemaType,
        version: metadata.version,
        ...keyvalues,
      },
    });

    return {
      cid: result.cid,
      metadata,
      validation,
      timestamp: result.timestamp,
    };
  }

  static async uploadVersionedMetadata(
    metadata: AnyMetadata,
    existingVersioned?: VersionedMetadata,
    updatedBy?: string,
    changeLog?: string,
    options?: {
      validate?: boolean;
      name?: string;
      keyvalues?: Record<string, string>;
    }
  ): Promise<{ result: UploadMetadataResult; versioned: VersionedMetadata }> {
    const uploadResult = await this.uploadMetadata(metadata, options);

    let versioned: VersionedMetadata;
    if (existingVersioned) {
      versioned = MetadataVersionManager.addVersion(
        existingVersioned,
        metadata,
        uploadResult.cid,
        updatedBy,
        changeLog
      );
    } else {
      versioned = MetadataVersionManager.createVersionedMetadata(
        metadata,
        uploadResult.cid,
        updatedBy,
        changeLog
      );
    }

    return { result: uploadResult, versioned };
  }

  static async retrieveMetadata(
    cid: string,
    useCache = true
  ): Promise<ParsedMetadata> {
    return MetadataParser.parseFromCID(cid, useCache);
  }

  static async retrieveBatch(
    cids: string[],
    useCache = true
  ): Promise<ParsedMetadata[]> {
    return MetadataParser.parseBatch(cids, useCache);
  }

  static validateMetadata(metadata: AnyMetadata): ValidationResult {
    return MetadataValidator.validate(metadata);
  }

  static async searchMetadata(
    query: MetadataSearchQuery,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    return MetadataSearch.search(query, options);
  }

  static async buildSearchIndex(cids: string[]): Promise<void> {
    await MetadataSearch.buildIndexFromCIDs(cids);
  }

  static getSearchStatistics() {
    return MetadataSearch.getStatistics();
  }

  static fullTextSearch(searchTerm: string, options?: SearchOptions): SearchResult[] {
    return MetadataSearch.fullTextSearch(searchTerm, options);
  }
}

export {
  MetadataBuilder,
  MetadataValidator,
  MetadataVersionManager,
  MetadataParser,
  MetadataSearch,
};

export type {
  AnyMetadata,
  CollectorBatchMetadata,
  TesterBatchMetadata,
  ProcessorBatchMetadata,
  ManufacturerBatchMetadata,
  WasteMetricsMetadata,
  QualityReportMetadata,
  MetadataSearchQuery,
  ValidationResult,
  ParsedMetadata,
  SearchResult,
  SearchOptions,
  VersionedMetadata,
};
