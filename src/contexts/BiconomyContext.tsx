import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3Auth } from './Web3AuthContext';

interface TransactionItem {
  to: string;
  data: string;
  description?: string;
}

interface BiconomyContextType {
  smartAccount: any;
  smartAccountAddress: string;
  loading: boolean;
  sendTransaction: (to: string, data: string) => Promise<string>;
  sendBatchTransactions: (transactions: TransactionItem[]) => Promise<string>;
  addToQueue: (transaction: TransactionItem) => void;
  processQueue: () => Promise<string | null>;
  transactionQueue: TransactionItem[];
  clearQueue: () => void;
}

const BiconomyContext = createContext<BiconomyContextType | undefined>(undefined);

export function BiconomyProvider({ children }: { children: ReactNode }) {
  const { provider, walletAddress } = useWeb3Auth();
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [transactionQueue, setTransactionQueue] = useState<TransactionItem[]>([]);

  useEffect(() => {
    if (provider && walletAddress) {
      initBiconomy();
    }
  }, [provider, walletAddress]);

  const initBiconomy = async () => {
    setSmartAccountAddress(walletAddress);
    setSmartAccount({});
  };

  const sendTransaction = async (to: string, data: string): Promise<string> => {
    if (!provider) {
      throw new Error('No provider available');
    }

    setLoading(true);
    try {
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: walletAddress, to, data }],
      });
      return txHash as string;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendBatchTransactions = async (transactions: TransactionItem[]): Promise<string> => {
    if (transactions.length === 0) {
      throw new Error('No transactions to send');
    }

    if (transactions.length === 1) {
      return sendTransaction(transactions[0].to, transactions[0].data);
    }

    for (const tx of transactions) {
      await sendTransaction(tx.to, tx.data);
    }

    return 'batch-completed';
  };

  const addToQueue = (transaction: TransactionItem) => {
    setTransactionQueue((prev) => [...prev, transaction]);
  };

  const processQueue = async (): Promise<string | null> => {
    if (transactionQueue.length === 0) {
      return null;
    }

    const result = await sendBatchTransactions(transactionQueue);
    setTransactionQueue([]);
    return result;
  };

  const clearQueue = () => {
    setTransactionQueue([]);
  };

  return (
    <BiconomyContext.Provider
      value={{
        smartAccount,
        smartAccountAddress,
        loading,
        sendTransaction,
        sendBatchTransactions,
        addToQueue,
        processQueue,
        transactionQueue,
        clearQueue,
      }}
    >
      {children}
    </BiconomyContext.Provider>
  );
}

export function useBiconomy() {
  const context = useContext(BiconomyContext);
  if (context === undefined) {
    throw new Error('useBiconomy must be used within a BiconomyProvider');
  }
  return context;
}
