import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account';
import { ethers } from 'ethers';
import { useWeb3Auth } from './Web3AuthContext';
import {
  createSmartAccount,
  executeTransaction,
  batchExecuteTransactions,
  TransactionQueueItem,
  SmartAccountConfig
} from '../lib/biconomy';

interface BiconomyContextType {
  smartAccount: BiconomySmartAccountV2 | null;
  smartAccountAddress: string | null;
  isDeployed: boolean;
  loading: boolean;
  error: string | null;
  transactionQueue: TransactionQueueItem[];
  sendTransaction: (to: string, data: string, value?: string) => Promise<string>;
  sendBatchTransactions: (transactions: Array<{ to: string; data: string; value?: string }>) => Promise<string>;
  addToQueue: (transaction: { to: string; data: string; value?: string; description: string }) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  removeFromQueue: (id: string) => void;
  getBalance: () => Promise<string>;
}

const BiconomyContext = createContext<BiconomyContextType | undefined>(undefined);

export const useBiconomy = () => {
  const context = useContext(BiconomyContext);
  if (!context) {
    throw new Error('useBiconomy must be used within BiconomyProvider');
  }
  return context;
};

export const BiconomyProvider = ({ children }: { children: ReactNode }) => {
  const { provider, walletAddress } = useWeb3Auth();
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionQueue, setTransactionQueue] = useState<TransactionQueueItem[]>([]);

  useEffect(() => {
    if (provider && walletAddress) {
      initializeBiconomy();
    } else {
      setSmartAccount(null);
      setSmartAccountAddress(null);
      setIsDeployed(false);
    }
  }, [provider, walletAddress]);

  const initializeBiconomy = async () => {
    setLoading(true);
    setError(null);

    try {
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();

      const config: SmartAccountConfig = {
        signer,
        chainId: 80002,
        bundlerUrl: `https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
        paymasterUrl: `https://paymaster.biconomy.io/api/v1/80002/Tpk8nuCUd.70bd3a7f-a368-4e6a-887e-771c3b48c4bb`,
      };

      const account = await createSmartAccount(config);
      const address = await account.getAccountAddress();

      setSmartAccount(account);
      setSmartAccountAddress(address);

      const code = await ethersProvider.getCode(address);
      setIsDeployed(code !== '0x');

      console.log('Biconomy Smart Account initialized:', address);
      console.log('Account deployed:', code !== '0x');
    } catch (err) {
      console.error('Biconomy initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Biconomy');
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async (to: string, data: string, value: string = '0'): Promise<string> => {
    if (!smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      setLoading(true);
      setError(null);

      const txHash = await executeTransaction(smartAccount, {
        to,
        data,
        value,
      });

      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendBatchTransactions = async (
    transactions: Array<{ to: string; data: string; value?: string }>
  ): Promise<string> => {
    if (!smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      setLoading(true);
      setError(null);

      const txHash = await batchExecuteTransactions(smartAccount, transactions);

      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch transaction failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = (transaction: {
    to: string;
    data: string;
    value?: string;
    description: string
  }) => {
    const queueItem: TransactionQueueItem = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value || '0',
      description: transaction.description,
      status: 'pending',
      timestamp: Date.now(),
    };

    setTransactionQueue(prev => [...prev, queueItem]);
  };

  const processQueue = async () => {
    if (transactionQueue.length === 0) {
      throw new Error('Transaction queue is empty');
    }

    const pendingTxs = transactionQueue.filter(tx => tx.status === 'pending');
    if (pendingTxs.length === 0) {
      throw new Error('No pending transactions in queue');
    }

    try {
      setLoading(true);
      setError(null);

      setTransactionQueue(prev =>
        prev.map(tx => (tx.status === 'pending' ? { ...tx, status: 'processing' as const } : tx))
      );

      const transactions = pendingTxs.map(tx => ({
        to: tx.to,
        data: tx.data,
        value: tx.value,
      }));

      const txHash = await sendBatchTransactions(transactions);

      setTransactionQueue(prev =>
        prev.map(tx =>
          tx.status === 'processing'
            ? { ...tx, status: 'completed' as const, txHash }
            : tx
        )
      );

      setTimeout(() => {
        setTransactionQueue(prev => prev.filter(tx => tx.status !== 'completed'));
      }, 5000);
    } catch (err) {
      setTransactionQueue(prev =>
        prev.map(tx =>
          tx.status === 'processing'
            ? {
                ...tx,
                status: 'failed' as const,
                error: err instanceof Error ? err.message : 'Transaction failed',
              }
            : tx
        )
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = () => {
    setTransactionQueue([]);
  };

  const removeFromQueue = (id: string) => {
    setTransactionQueue(prev => prev.filter(tx => tx.id !== id));
  };

  const getBalance = async (): Promise<string> => {
    if (!smartAccount || !smartAccountAddress) {
      throw new Error('Smart account not initialized');
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const balance = await ethersProvider.getBalance(smartAccountAddress);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Failed to get balance:', err);
      throw err;
    }
  };

  return (
    <BiconomyContext.Provider
      value={{
        smartAccount,
        smartAccountAddress,
        isDeployed,
        loading,
        error,
        transactionQueue,
        sendTransaction,
        sendBatchTransactions,
        addToQueue,
        processQueue,
        clearQueue,
        removeFromQueue,
        getBalance,
      }}
    >
      {children}
    </BiconomyContext.Provider>
  );
};
