import React, { createContext, useContext, useState, useEffect } from 'react';

interface RecentBatch {
  batchId: string;
  timestamp: number;
  name?: string;
  type: 'collector' | 'tester' | 'processor' | 'manufacturer';
}

interface RecentBatchesContextType {
  recentBatches: RecentBatch[];
  addRecentBatch: (batchId: string, type: RecentBatch['type'], name?: string) => void;
  clearRecentBatches: () => void;
  removeRecentBatch: (batchId: string) => void;
  getRecentBatch: (batchId: string) => RecentBatch | undefined;
}

const RECENT_BATCHES_KEY = 'recent_batches';
const MAX_RECENT_BATCHES = 20;

const RecentBatchesContext = createContext<RecentBatchesContextType | undefined>(undefined);

export const RecentBatchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>(() => {
    const stored = localStorage.getItem(RECENT_BATCHES_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse recent batches:', error);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(RECENT_BATCHES_KEY, JSON.stringify(recentBatches));
  }, [recentBatches]);

  const addRecentBatch = (batchId: string, type: RecentBatch['type'], name?: string) => {
    setRecentBatches(prev => {
      const filtered = prev.filter(batch => batch.batchId !== batchId);

      const newBatch: RecentBatch = {
        batchId,
        type,
        name,
        timestamp: Date.now(),
      };

      const updated = [newBatch, ...filtered];

      return updated.slice(0, MAX_RECENT_BATCHES);
    });
  };

  const clearRecentBatches = () => {
    setRecentBatches([]);
  };

  const removeRecentBatch = (batchId: string) => {
    setRecentBatches(prev => prev.filter(batch => batch.batchId !== batchId));
  };

  const getRecentBatch = (batchId: string) => {
    return recentBatches.find(batch => batch.batchId === batchId);
  };

  return (
    <RecentBatchesContext.Provider
      value={{
        recentBatches,
        addRecentBatch,
        clearRecentBatches,
        removeRecentBatch,
        getRecentBatch,
      }}
    >
      {children}
    </RecentBatchesContext.Provider>
  );
};

export const useRecentBatches = () => {
  const context = useContext(RecentBatchesContext);
  if (!context) {
    throw new Error('useRecentBatches must be used within RecentBatchesProvider');
  }
  return context;
};
