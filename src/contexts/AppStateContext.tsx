import React, { createContext, useContext } from 'react';
import { UIPreferencesProvider, useUIPreferences } from './UIPreferencesContext';
import { IPFSCacheProvider, useIPFSCache } from './IPFSCacheContext';
import { PendingTransactionsProvider, usePendingTransactions } from './PendingTransactionsContext';
import { RecentBatchesProvider, useRecentBatches } from './RecentBatchesContext';
import { OptimisticUpdatesProvider, useOptimisticUpdates } from './OptimisticUpdatesContext';

interface AppStateContextType {
  clearAllState: () => void;
  exportState: () => string;
  importState: (data: string) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const AppStateManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resetPreferences } = useUIPreferences();
  const { clearCache } = useIPFSCache();
  const { clearTransactions } = usePendingTransactions();
  const { clearRecentBatches } = useRecentBatches();
  const { clearAllUpdates } = useOptimisticUpdates();

  const clearAllState = () => {
    resetPreferences();
    clearCache();
    clearTransactions();
    clearRecentBatches();
    clearAllUpdates();
    localStorage.clear();
  };

  const exportState = (): string => {
    const state = {
      uiPreferences: localStorage.getItem('ui_preferences'),
      ipfsCache: localStorage.getItem('ipfs_cache'),
      pendingTransactions: localStorage.getItem('pending_transactions'),
      recentBatches: localStorage.getItem('recent_batches'),
      timestamp: Date.now(),
    };
    return JSON.stringify(state);
  };

  const importState = (data: string) => {
    try {
      const state = JSON.parse(data);
      if (state.uiPreferences) localStorage.setItem('ui_preferences', state.uiPreferences);
      if (state.ipfsCache) localStorage.setItem('ipfs_cache', state.ipfsCache);
      if (state.pendingTransactions)
        localStorage.setItem('pending_transactions', state.pendingTransactions);
      if (state.recentBatches) localStorage.setItem('recent_batches', state.recentBatches);
      window.location.reload();
    } catch (error) {
      console.error('Failed to import state:', error);
      throw new Error('Invalid state data');
    }
  };

  return (
    <AppStateContext.Provider value={{ clearAllState, exportState, importState }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIPreferencesProvider>
      <IPFSCacheProvider>
        <PendingTransactionsProvider>
          <RecentBatchesProvider>
            <OptimisticUpdatesProvider>
              <AppStateManager>{children}</AppStateManager>
            </OptimisticUpdatesProvider>
          </RecentBatchesProvider>
        </PendingTransactionsProvider>
      </IPFSCacheProvider>
    </UIPreferencesProvider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export {
  useUIPreferences,
  useIPFSCache,
  usePendingTransactions,
  useRecentBatches,
  useOptimisticUpdates,
};
