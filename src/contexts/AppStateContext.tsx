import { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  currentView: 'landing' | 'login' | 'dashboard' | 'tracker';
  selectedBatchId: string | null;
}

interface AppStateContextType {
  appState: AppState;
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedBatchId: (batchId: string | null) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'landing',
    selectedBatchId: null,
  });

  const setCurrentView = (view: AppState['currentView']) => {
    setAppState((prev) => ({ ...prev, currentView: view }));
  };

  const setSelectedBatchId = (batchId: string | null) => {
    setAppState((prev) => ({ ...prev, selectedBatchId: batchId }));
  };

  return (
    <AppStateContext.Provider
      value={{
        appState,
        setCurrentView,
        setSelectedBatchId,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
