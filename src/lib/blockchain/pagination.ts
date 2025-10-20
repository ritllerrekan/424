export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalItems?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function paginateArray<T>(
  items: T[],
  config: PaginationConfig
): PaginatedResult<T> {
  const { page, pageSize } = config;
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const data = items.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export interface BlockRangeConfig {
  fromBlock: number;
  toBlock: number | 'latest';
  chunkSize: number;
}

export function* generateBlockRanges(config: BlockRangeConfig): Generator<{
  fromBlock: number;
  toBlock: number | 'latest';
}> {
  const { fromBlock, toBlock, chunkSize } = config;

  if (toBlock === 'latest') {
    yield { fromBlock, toBlock: 'latest' };
    return;
  }

  let currentFrom = fromBlock;

  while (currentFrom <= toBlock) {
    const currentTo = Math.min(currentFrom + chunkSize - 1, toBlock);

    yield {
      fromBlock: currentFrom,
      toBlock: currentTo,
    };

    currentFrom = currentTo + 1;
  }
}

export async function paginateBlockchainQuery<T>(
  queryFn: (fromBlock: number, toBlock: number | 'latest') => Promise<T[]>,
  config: BlockRangeConfig,
  onProgress?: (progress: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  const ranges = Array.from(generateBlockRanges(config));

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];

    try {
      const data = await queryFn(range.fromBlock, range.toBlock);
      results.push(...data);

      if (onProgress) {
        onProgress(i + 1, ranges.length);
      }
    } catch (error) {
      console.error(`Failed to query blocks ${range.fromBlock}-${range.toBlock}:`, error);
      throw error;
    }
  }

  return results;
}

export function createPaginationHelper<T>(items: T[], pageSize: number = 10) {
  let currentPage = 1;

  const helper = {
    getCurrentPage: () => currentPage,

    getPage: (page: number): PaginatedResult<T> => {
      currentPage = Math.max(1, Math.min(page, Math.ceil(items.length / pageSize)));
      return paginateArray(items, { page: currentPage, pageSize });
    },

    nextPage: (): PaginatedResult<T> => {
      return helper.getPage(currentPage + 1);
    },

    previousPage: (): PaginatedResult<T> => {
      return helper.getPage(currentPage - 1);
    },

    firstPage: (): PaginatedResult<T> => {
      return helper.getPage(1);
    },

    lastPage: (): PaginatedResult<T> => {
      const totalPages = Math.ceil(items.length / pageSize);
      return helper.getPage(totalPages);
    },
  };

  return helper;
}
