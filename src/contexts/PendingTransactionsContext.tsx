import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PendingTransaction {
  id: string;
  hash?: string;
  type: 'collect' | 'test' | 'process' | 'manufacture' | 'update' | 'transfer';
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  timestamp: number;
  batchId?: string;
  description: string;
  error?: string;
  confirmations?: number;
}

interface PendingTransactionsContextType {
  transactions: PendingTransaction[];
  addTransaction: (transaction: Omit<PendingTransaction, 'id' | 'timestamp'>) => string;
  updateTransaction: (id: string, updates: Partial<PendingTransaction>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
  getPendingCount: () => number;
  getTransactionById: (id: string) => PendingTransaction | undefined;
  getTransactionsByBatch: (batchId: string) => PendingTransaction[];
}

const PENDING_TX_KEY = 'pending_transactions';
const MAX_STORED_TX = 100;

const PendingTransactionsContext = createContext<PendingTransactionsContextType | undefined>(
  undefined
);

export const PendingTransactionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<PendingTransaction[]>(() => {
    const stored = localStorage.getItem(PENDING_TX_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse pending transactions:', error);
      }
    }
    return [];
  });

  useEffect(() => {
    const toStore = transactions.slice(0, MAX_STORED_TX);
    localStorage.setItem(PENDING_TX_KEY, JSON.stringify(toStore));
  }, [transactions]);

  const addTransaction = (
    transaction: Omit<PendingTransaction, 'id' | 'timestamp'>
  ): string => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTransaction: PendingTransaction = {
      ...transaction,
      id,
      timestamp: Date.now(),
      status: transaction.status || 'pending',
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return id;
  };

  const updateTransaction = (id: string, updates: Partial<PendingTransaction>) => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const getPendingCount = () => {
    return transactions.filter(tx => tx.status === 'pending' || tx.status === 'processing')
      .length;
  };

  const getTransactionById = (id: string) => {
    return transactions.find(tx => tx.id === id);
  };

  const getTransactionsByBatch = (batchId: string) => {
    return transactions.filter(tx => tx.batchId === batchId);
  };

  return (
    <PendingTransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        removeTransaction,
        clearTransactions,
        getPendingCount,
        getTransactionById,
        getTransactionsByBatch,
      }}
    >
      {children}
    </PendingTransactionsContext.Provider>
  );
};

export const usePendingTransactions = () => {
  const context = useContext(PendingTransactionsContext);
  if (!context) {
    throw new Error('usePendingTransactions must be used within PendingTransactionsProvider');
  }
  return context;
};
