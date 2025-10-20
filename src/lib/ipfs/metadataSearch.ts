import { AnyMetadata, MetadataSearchQuery } from './schemas';
import { ParsedMetadata, MetadataParser } from './metadataParser';

export interface SearchResult {
  metadata: AnyMetadata;
  cid: string;
  relevanceScore: number;
  matchedFields: string[];
}

export interface SearchOptions {
  sortBy?: 'relevance' | 'date' | 'batchId';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class MetadataSearch {
  private static indexedMetadata: Map<string, ParsedMetadata> = new Map();

  static indexMetadata(parsed: ParsedMetadata): void {
    this.indexedMetadata.set(parsed.cid, parsed);
  }

  static indexBatch(parsedBatch: ParsedMetadata[]): void {
    parsedBatch.forEach((parsed) => this.indexMetadata(parsed));
  }

  static clearIndex(): void {
    this.indexedMetadata.clear();
  }

  static search(
    query: MetadataSearchQuery,
    options: SearchOptions = {}
  ): SearchResult[] {
    const results: SearchResult[] = [];

    this.indexedMetadata.forEach((parsed) => {
      const matchResult = this.matchQuery(parsed.metadata, query, parsed.cid);
      if (matchResult.matches) {
        results.push({
          metadata: parsed.metadata,
          cid: parsed.cid,
          relevanceScore: matchResult.score,
          matchedFields: matchResult.matchedFields,
        });
      }
    });

    return this.sortAndPaginate(results, options);
  }

  private static matchQuery(
    metadata: AnyMetadata,
    query: MetadataSearchQuery,
    cid: string
  ): { matches: boolean; score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: string[] = [];

    if (query.schemaType) {
      if (metadata.schemaType === query.schemaType) {
        score += 10;
        matchedFields.push('schemaType');
      } else {
        return { matches: false, score: 0, matchedFields: [] };
      }
    }

    if (query.batchId) {
      const batchId = (metadata as any).batchId;
      if (batchId && batchId.toString().includes(query.batchId.toString())) {
        score += 20;
        matchedFields.push('batchId');
      } else {
        return { matches: false, score: 0, matchedFields: [] };
      }
    }

    if (query.address) {
      const addressFields = [
        'collectorAddress',
        'testerAddress',
        'processorAddress',
        'manufacturerAddress',
        'createdBy',
      ];

      const addressMatch = addressFields.some((field) => {
        const value = (metadata as any)[field];
        if (value && value.toLowerCase() === query.address?.toLowerCase()) {
          matchedFields.push(field);
          return true;
        }
        return false;
      });

      if (addressMatch) {
        score += 15;
      } else if (query.address) {
        return { matches: false, score: 0, matchedFields: [] };
      }
    }

    if (query.dateRange) {
      const createdAt = new Date(metadata.createdAt);
      const startDate = new Date(query.dateRange.startDate);
      const endDate = new Date(query.dateRange.endDate);

      if (createdAt >= startDate && createdAt <= endDate) {
        score += 5;
        matchedFields.push('dateRange');
      } else {
        return { matches: false, score: 0, matchedFields: [] };
      }
    }

    if (query.version) {
      if (metadata.version === query.version) {
        score += 3;
        matchedFields.push('version');
      }
    }

    return {
      matches: matchedFields.length > 0 || Object.keys(query).length === 0,
      score,
      matchedFields,
    };
  }

  private static sortAndPaginate(
    results: SearchResult[],
    options: SearchOptions
  ): SearchResult[] {
    const { sortBy = 'relevance', sortOrder = 'desc', limit, offset = 0 } = options;

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'date':
          comparison =
            new Date(a.metadata.createdAt).getTime() -
            new Date(b.metadata.createdAt).getTime();
          break;
        case 'batchId':
          const batchIdA = (a.metadata as any).batchId || '';
          const batchIdB = (b.metadata as any).batchId || '';
          comparison = batchIdA.toString().localeCompare(batchIdB.toString());
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const start = offset;
    const end = limit ? start + limit : results.length;
    return results.slice(start, end);
  }

  static searchBySchemaType(schemaType: string, options?: SearchOptions): SearchResult[] {
    return this.search({ schemaType }, options);
  }

  static searchByBatchId(batchId: string, options?: SearchOptions): SearchResult[] {
    return this.search({ batchId }, options);
  }

  static searchByAddress(address: string, options?: SearchOptions): SearchResult[] {
    return this.search({ address }, options);
  }

  static searchByDateRange(
    startDate: string,
    endDate: string,
    options?: SearchOptions
  ): SearchResult[] {
    return this.search({ dateRange: { startDate, endDate } }, options);
  }

  static async buildIndexFromCIDs(cids: string[]): Promise<void> {
    const parsedBatch = await MetadataParser.parseBatch(cids, true);
    const validMetadata = parsedBatch.filter((p) => p.isValid && !p.isCorrupted);
    this.indexBatch(validMetadata);
  }

  static getIndexSize(): number {
    return this.indexedMetadata.size;
  }

  static getIndexedCIDs(): string[] {
    return Array.from(this.indexedMetadata.keys());
  }

  static fullTextSearch(searchTerm: string, options?: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerSearchTerm = searchTerm.toLowerCase();

    this.indexedMetadata.forEach((parsed) => {
      const metadataString = JSON.stringify(parsed.metadata).toLowerCase();
      if (metadataString.includes(lowerSearchTerm)) {
        const occurrences = (metadataString.match(new RegExp(lowerSearchTerm, 'g')) || [])
          .length;
        results.push({
          metadata: parsed.metadata,
          cid: parsed.cid,
          relevanceScore: occurrences * 5,
          matchedFields: ['fullText'],
        });
      }
    });

    return this.sortAndPaginate(results, options);
  }

  static advancedSearch(
    predicate: (metadata: AnyMetadata) => boolean,
    options?: SearchOptions
  ): SearchResult[] {
    const results: SearchResult[] = [];

    this.indexedMetadata.forEach((parsed) => {
      if (predicate(parsed.metadata)) {
        results.push({
          metadata: parsed.metadata,
          cid: parsed.cid,
          relevanceScore: 10,
          matchedFields: ['custom'],
        });
      }
    });

    return this.sortAndPaginate(results, options);
  }

  static getStatistics(): {
    totalMetadata: number;
    bySchemaType: Record<string, number>;
    validMetadata: number;
    invalidMetadata: number;
  } {
    const bySchemaType: Record<string, number> = {};
    let validCount = 0;

    this.indexedMetadata.forEach((parsed) => {
      const type = parsed.metadata.schemaType || 'unknown';
      bySchemaType[type] = (bySchemaType[type] || 0) + 1;

      if (parsed.isValid) {
        validCount++;
      }
    });

    return {
      totalMetadata: this.indexedMetadata.size,
      bySchemaType,
      validMetadata: validCount,
      invalidMetadata: this.indexedMetadata.size - validCount,
    };
  }
}

export function createSearchIndex(parsedMetadata: ParsedMetadata[]): void {
  MetadataSearch.clearIndex();
  MetadataSearch.indexBatch(parsedMetadata);
}

export function searchMetadata(
  query: MetadataSearchQuery,
  options?: SearchOptions
): SearchResult[] {
  return MetadataSearch.search(query, options);
}
