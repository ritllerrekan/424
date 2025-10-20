import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getAllEvents, ContractEvent } from '../lib/contract/events';
import { transactionCache } from '../lib/blockchain/cache';
import { retryWithBackoff, handleBlockchainError } from '../lib/blockchain/errorHandler';
import { paginateArray, PaginatedResult } from '../lib/blockchain/pagination';
import { formatEventForDisplay } from '../lib/blockchain/decoder';

export interface TransactionHistoryItem {
  event: ContractEvent;
  displayInfo: {
    title: string;
    description: string;
    type: string;
  };
}

interface UseTransactionHistoryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
  filterByAddress?: string;
}

interface UseTransactionHistoryResult {
  transactions: TransactionHistoryItem[];
  paginatedTransactions: PaginatedResult<TransactionHistoryItem> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  currentPage: number;
  lastUpdated: number | null;
}

export function useTransactionHistory(
  provider: ethers.Provider | null,
  options: UseTransactionHistoryOptions = {}
): UseTransactionHistoryResult {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    pageSize = 20,
    filterByAddress,
  } = options;

  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResult<TransactionHistoryItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchTransactionHistory = useCallback(async () => {
    if (!provider) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `tx-history-${filterByAddress || 'all'}`;
      const cached = transactionCache.get(cacheKey);

      if (cached) {
        const items = cached as TransactionHistoryItem[];
        setTransactions(items);
        const paginated = paginateArray(items, { page: currentPage, pageSize });
        setPaginatedTransactions(paginated);
        setLastUpdated(Date.now());
        setLoading(false);
        return;
      }

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      const events = await retryWithBackoff(() =>
        getAllEvents(provider, fromBlock, 'latest')
      );

      let filteredEvents = events;
      if (filterByAddress) {
        filteredEvents = events.filter((event) => {
          const addressLower = filterByAddress.toLowerCase();
          if ('creator' in event) {
            return event.creator.toLowerCase() === addressLower;
          }
          if ('completedBy' in event) {
            return event.completedBy.toLowerCase() === addressLower;
          }
          if ('collector' in event) {
            return event.collector.toLowerCase() === addressLower;
          }
          if ('tester' in event) {
            return event.tester.toLowerCase() === addressLower;
          }
          if ('processor' in event) {
            return event.processor.toLowerCase() === addressLower;
          }
          if ('manufacturer' in event) {
            return event.manufacturer.toLowerCase() === addressLower;
          }
          return false;
        });
      }

      const items: TransactionHistoryItem[] = filteredEvents.map((event) => ({
        event,
        displayInfo: formatEventForDisplay(event),
      }));

      items.sort((a, b) => b.event.blockNumber - a.event.blockNumber);

      transactionCache.set(cacheKey, items);
      setTransactions(items);

      const paginated = paginateArray(items, { page: currentPage, pageSize });
      setPaginatedTransactions(paginated);
      setLastUpdated(Date.now());
    } catch (err) {
      const blockchainError = handleBlockchainError(err);
      setError(blockchainError.message);
      console.error('Transaction history fetch error:', blockchainError);
    } finally {
      setLoading(false);
    }
  }, [provider, filterByAddress, currentPage, pageSize]);

  useEffect(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTransactionHistory();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTransactionHistory]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    const paginated = paginateArray(transactions, { page, pageSize });
    setPaginatedTransactions(paginated);
  }, [transactions, pageSize]);

  const nextPage = useCallback(() => {
    if (paginatedTransactions?.pagination.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [paginatedTransactions, currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (paginatedTransactions?.pagination.hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [paginatedTransactions, currentPage, goToPage]);

  return {
    transactions,
    paginatedTransactions,
    loading,
    error,
    refetch: fetchTransactionHistory,
    goToPage,
    nextPage,
    previousPage,
    currentPage,
    lastUpdated,
  };
}

export function useUserTransactionHistory(
  provider: ethers.Provider | null,
  userAddress: string | null,
  options?: Omit<UseTransactionHistoryOptions, 'filterByAddress'>
) {
  return useTransactionHistory(provider, {
    ...options,
    filterByAddress: userAddress || undefined,
  });
}
