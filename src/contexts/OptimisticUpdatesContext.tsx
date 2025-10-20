import React, { createContext, useContext, useState, useCallback } from 'react';

interface OptimisticUpdate {
  id: string;
  type: 'batch' | 'transaction' | 'profile';
  entityId: string;
  updates: any;
  timestamp: number;
  rollback?: any;
}

interface OptimisticUpdatesContextType {
  updates: Map<string, OptimisticUpdate>;
  addOptimisticUpdate: (
    type: OptimisticUpdate['type'],
    entityId: string,
    updates: any,
    rollback?: any
  ) => string;
  confirmUpdate: (id: string) => void;
  rollbackUpdate: (id: string) => any;
  clearAllUpdates: () => void;
  getOptimisticData: <T>(entityId: string, baseData: T) => T;
  hasOptimisticUpdate: (entityId: string) => boolean;
}

const OptimisticUpdatesContext = createContext<OptimisticUpdatesContextType | undefined>(
  undefined
);

export const OptimisticUpdatesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [updates, setUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());

  const addOptimisticUpdate = useCallback(
    (
      type: OptimisticUpdate['type'],
      entityId: string,
      updates: any,
      rollback?: any
    ): string => {
      const id = `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticUpdate: OptimisticUpdate = {
        id,
        type,
        entityId,
        updates,
        rollback,
        timestamp: Date.now(),
      };

      setUpdates(prev => new Map(prev).set(id, optimisticUpdate));

      setTimeout(() => {
        setUpdates(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }, 30000);

      return id;
    },
    []
  );

  const confirmUpdate = useCallback((id: string) => {
    setUpdates(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const rollbackUpdate = useCallback((id: string): any => {
    const update = updates.get(id);
    if (!update) return null;

    setUpdates(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    return update.rollback;
  }, [updates]);

  const clearAllUpdates = useCallback(() => {
    setUpdates(new Map());
  }, []);

  const getOptimisticData = useCallback(
    <T,>(entityId: string, baseData: T): T => {
      const relevantUpdates = Array.from(updates.values())
        .filter(update => update.entityId === entityId)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (relevantUpdates.length === 0) return baseData;

      return relevantUpdates.reduce((acc, update) => {
        return { ...acc, ...update.updates };
      }, baseData);
    },
    [updates]
  );

  const hasOptimisticUpdate = useCallback(
    (entityId: string): boolean => {
      return Array.from(updates.values()).some(update => update.entityId === entityId);
    },
    [updates]
  );

  return (
    <OptimisticUpdatesContext.Provider
      value={{
        updates,
        addOptimisticUpdate,
        confirmUpdate,
        rollbackUpdate,
        clearAllUpdates,
        getOptimisticData,
        hasOptimisticUpdate,
      }}
    >
      {children}
    </OptimisticUpdatesContext.Provider>
  );
};

export const useOptimisticUpdates = () => {
  const context = useContext(OptimisticUpdatesContext);
  if (!context) {
    throw new Error('useOptimisticUpdates must be used within OptimisticUpdatesProvider');
  }
  return context;
};
