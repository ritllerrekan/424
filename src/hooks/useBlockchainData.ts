import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { EnrichedBatch } from '../lib/contract/reader';
import { getAllBatches, getBatchesByPhase, getBatchesByStatus } from '../lib/contract/reader';
import { Phase, Status } from '../lib/contract/types';
import { batchCache } from '../lib/blockchain/cache';
import { retryWithBackoff, handleBlockchainError } from '../lib/blockchain/errorHandler';

interface UseBlockchainDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheEnabled?: boolean;
}

interface UseBlockchainDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: number | null;
}

export function useBlockchainData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: UseBlockchainDataOptions = {}
): UseBlockchainDataResult<T> {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    cacheEnabled = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (cacheEnabled) {
        const cached = batchCache.get(cacheKey);
        if (cached) {
          setData(cached as T);
          setLastUpdated(Date.now());
          setLoading(false);
          return;
        }
      }

      const result = await retryWithBackoff(fetchFn);

      if (cacheEnabled) {
        batchCache.set(cacheKey, result);
      }

      setData(result);
      setLastUpdated(Date.now());
    } catch (err) {
      const blockchainError = handleBlockchainError(err);
      setError(blockchainError.message);
      console.error('Blockchain data fetch error:', blockchainError);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, cacheEnabled]);

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
    lastUpdated,
  };
}

export function useAllBatches(
  provider: ethers.Provider | null,
  options?: UseBlockchainDataOptions
) {
  const fetchFn = useCallback(async () => {
    if (!provider) throw new Error('Provider not available');
    return getAllBatches(provider);
  }, [provider]);

  return useBlockchainData<EnrichedBatch[]>(
    fetchFn,
    'all-batches',
    options
  );
}

export function useBatchesByPhase(
  provider: ethers.Provider | null,
  phase: Phase,
  options?: UseBlockchainDataOptions
) {
  const fetchFn = useCallback(async () => {
    if (!provider) throw new Error('Provider not available');
    return getBatchesByPhase(provider, phase);
  }, [provider, phase]);

  return useBlockchainData<EnrichedBatch[]>(
    fetchFn,
    `batches-phase-${phase}`,
    options
  );
}

export function useBatchesByStatus(
  provider: ethers.Provider | null,
  status: Status,
  options?: UseBlockchainDataOptions
) {
  const fetchFn = useCallback(async () => {
    if (!provider) throw new Error('Provider not available');
    return getBatchesByStatus(provider, status);
  }, [provider, status]);

  return useBlockchainData<EnrichedBatch[]>(
    fetchFn,
    `batches-status-${status}`,
    options
  );
}
