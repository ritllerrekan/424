import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  getEnrichedBatch,
  getEnrichedFullChain,
  getEnrichedCollectorData,
  getEnrichedTesterData,
  getEnrichedProcessorData,
  getEnrichedManufacturerData,
  EnrichedBatch,
  EnrichedFullChainData,
} from '../lib/contract/reader';
import { batchCache } from '../lib/blockchain/cache';
import { retryWithBackoff, handleBlockchainError } from '../lib/blockchain/errorHandler';

interface UseBatchDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseBatchDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBatchData(
  provider: ethers.Provider | null,
  batchId: number | null,
  options: UseBatchDataOptions = {}
): UseBatchDataResult<EnrichedBatch> {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [data, setData] = useState<EnrichedBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!provider || batchId === null) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `batch-${batchId}`;
      const cached = batchCache.get(cacheKey);

      if (cached) {
        setData(cached as EnrichedBatch);
        setLoading(false);
        return;
      }

      const batch = await retryWithBackoff(() =>
        getEnrichedBatch(provider, batchId)
      );

      batchCache.set(cacheKey, batch);
      setData(batch);
    } catch (err) {
      const blockchainError = handleBlockchainError(err);
      setError(blockchainError.message);
      console.error('Batch data fetch error:', blockchainError);
    } finally {
      setLoading(false);
    }
  }, [provider, batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useFullChainData(
  provider: ethers.Provider | null,
  batchId: number | null,
  options: UseBatchDataOptions = {}
): UseBatchDataResult<EnrichedFullChainData> {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [data, setData] = useState<EnrichedFullChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!provider || batchId === null) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `full-chain-${batchId}`;
      const cached = batchCache.get(cacheKey);

      if (cached) {
        setData(cached as EnrichedFullChainData);
        setLoading(false);
        return;
      }

      const fullChain = await retryWithBackoff(() =>
        getEnrichedFullChain(provider, batchId)
      );

      batchCache.set(cacheKey, fullChain);
      setData(fullChain);
    } catch (err) {
      const blockchainError = handleBlockchainError(err);
      setError(blockchainError.message);
      console.error('Full chain data fetch error:', blockchainError);
    } finally {
      setLoading(false);
    }
  }, [provider, batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useCollectorData(
  provider: ethers.Provider | null,
  batchId: number | null
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || batchId === null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await retryWithBackoff(() =>
          getEnrichedCollectorData(provider, batchId)
        );

        setData(result);
      } catch (err) {
        const blockchainError = handleBlockchainError(err);
        setError(blockchainError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider, batchId]);

  return { data, loading, error };
}

export function useTesterData(
  provider: ethers.Provider | null,
  batchId: number | null
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || batchId === null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await retryWithBackoff(() =>
          getEnrichedTesterData(provider, batchId)
        );

        setData(result);
      } catch (err) {
        const blockchainError = handleBlockchainError(err);
        setError(blockchainError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider, batchId]);

  return { data, loading, error };
}

export function useProcessorData(
  provider: ethers.Provider | null,
  batchId: number | null
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || batchId === null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await retryWithBackoff(() =>
          getEnrichedProcessorData(provider, batchId)
        );

        setData(result);
      } catch (err) {
        const blockchainError = handleBlockchainError(err);
        setError(blockchainError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider, batchId]);

  return { data, loading, error };
}

export function useManufacturerData(
  provider: ethers.Provider | null,
  batchId: number | null
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || batchId === null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await retryWithBackoff(() =>
          getEnrichedManufacturerData(provider, batchId)
        );

        setData(result);
      } catch (err) {
        const blockchainError = handleBlockchainError(err);
        setError(blockchainError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider, batchId]);

  return { data, loading, error };
}
