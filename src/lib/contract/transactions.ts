import { ethers } from 'ethers';

export enum TransactionStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

export interface Transaction {
  hash: string;
  status: TransactionStatus;
  from: string;
  to?: string;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  confirmations: number;
  error?: string;
  type?: string;
  metadata?: any;
}

export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: number;
  logs: readonly ethers.Log[];
}

export type TransactionUpdateCallback = (transaction: Transaction) => void;

export class TransactionTracker {
  private provider: ethers.Provider;
  private transactions: Map<string, Transaction> = new Map();
  private callbacks: Map<string, TransactionUpdateCallback[]> = new Map();
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  async trackTransaction(
    hash: string,
    metadata?: any
  ): Promise<Transaction> {
    const existingTx = this.transactions.get(hash);
    if (existingTx) {
      return existingTx;
    }

    let tx: ethers.TransactionResponse | null;
    try {
      tx = await this.provider.getTransaction(hash);
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${(error as Error).message}`);
    }

    if (!tx) {
      throw new Error(`Transaction not found: ${hash}`);
    }

    const transaction: Transaction = {
      hash,
      status: TransactionStatus.Pending,
      from: tx.from,
      to: tx.to || undefined,
      confirmations: 0,
      type: tx.type?.toString(),
      metadata,
    };

    this.transactions.set(hash, transaction);
    this.startPolling(hash);

    return transaction;
  }

  private startPolling(hash: string): void {
    if (this.pollIntervals.has(hash)) {
      return;
    }

    const interval = setInterval(async () => {
      await this.updateTransaction(hash);
    }, 3000);

    this.pollIntervals.set(hash, interval);
  }

  private stopPolling(hash: string): void {
    const interval = this.pollIntervals.get(hash);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(hash);
    }
  }

  private async updateTransaction(hash: string): Promise<void> {
    const transaction = this.transactions.get(hash);
    if (!transaction) {
      this.stopPolling(hash);
      return;
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(hash);

      if (!receipt) {
        return;
      }

      const block = await this.provider.getBlock(receipt.blockNumber);

      transaction.status =
        receipt.status === 1
          ? TransactionStatus.Confirmed
          : TransactionStatus.Failed;
      transaction.blockNumber = receipt.blockNumber;
      transaction.blockHash = receipt.blockHash;
      transaction.gasUsed = receipt.gasUsed;
      transaction.effectiveGasPrice = receipt.gasPrice;
      transaction.timestamp = block?.timestamp;
      transaction.confirmations = await this.getConfirmations(
        receipt.blockNumber
      );

      if (receipt.status === 0) {
        transaction.error = 'Transaction failed';
      }

      this.transactions.set(hash, transaction);
      this.notifyCallbacks(hash, transaction);

      if (transaction.confirmations >= 12) {
        this.stopPolling(hash);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      transaction.status = TransactionStatus.Failed;
      transaction.error = (error as Error).message;
      this.transactions.set(hash, transaction);
      this.notifyCallbacks(hash, transaction);
      this.stopPolling(hash);
    }
  }

  private async getConfirmations(blockNumber: number): Promise<number> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      return Math.max(0, currentBlock - blockNumber + 1);
    } catch (error) {
      console.warn('Failed to get confirmations:', error);
      return 0;
    }
  }

  private notifyCallbacks(hash: string, transaction: Transaction): void {
    const callbacks = this.callbacks.get(hash);
    if (callbacks) {
      callbacks.forEach((callback) => callback(transaction));
    }
  }

  onTransactionUpdate(
    hash: string,
    callback: TransactionUpdateCallback
  ): () => void {
    const callbacks = this.callbacks.get(hash) || [];
    callbacks.push(callback);
    this.callbacks.set(hash, callbacks);

    const transaction = this.transactions.get(hash);
    if (transaction) {
      callback(transaction);
    }

    return () => {
      const updatedCallbacks = this.callbacks.get(hash) || [];
      const index = updatedCallbacks.indexOf(callback);
      if (index > -1) {
        updatedCallbacks.splice(index, 1);
        this.callbacks.set(hash, updatedCallbacks);
      }
    };
  }

  getTransaction(hash: string): Transaction | undefined {
    return this.transactions.get(hash);
  }

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }

  getPendingTransactions(): Transaction[] {
    return this.getAllTransactions().filter(
      (tx) => tx.status === TransactionStatus.Pending
    );
  }

  getConfirmedTransactions(): Transaction[] {
    return this.getAllTransactions().filter(
      (tx) => tx.status === TransactionStatus.Confirmed
    );
  }

  getFailedTransactions(): Transaction[] {
    return this.getAllTransactions().filter(
      (tx) => tx.status === TransactionStatus.Failed
    );
  }

  async waitForConfirmation(
    hash: string,
    requiredConfirmations: number = 1
  ): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.onTransactionUpdate(hash, (transaction) => {
        if (transaction.status === TransactionStatus.Failed) {
          unsubscribe();
          reject(new Error(transaction.error || 'Transaction failed'));
        }

        if (
          transaction.status === TransactionStatus.Confirmed &&
          transaction.confirmations >= requiredConfirmations
        ) {
          unsubscribe();
          resolve(transaction);
        }
      });

      setTimeout(() => {
        unsubscribe();
        reject(new Error('Transaction confirmation timeout'));
      }, 300000);
    });
  }

  removeTransaction(hash: string): void {
    this.stopPolling(hash);
    this.transactions.delete(hash);
    this.callbacks.delete(hash);
  }

  clear(): void {
    this.pollIntervals.forEach((interval) => clearInterval(interval));
    this.pollIntervals.clear();
    this.transactions.clear();
    this.callbacks.clear();
  }
}

export async function getTransactionStatus(
  provider: ethers.Provider,
  hash: string
): Promise<Transaction> {
  const tx = await provider.getTransaction(hash);

  if (!tx) {
    throw new Error(`Transaction not found: ${hash}`);
  }

  const receipt = await provider.getTransactionReceipt(hash);

  if (!receipt) {
    return {
      hash,
      status: TransactionStatus.Pending,
      from: tx.from,
      to: tx.to || undefined,
      confirmations: 0,
    };
  }

  const block = await provider.getBlock(receipt.blockNumber);
  const currentBlock = await provider.getBlockNumber();
  const confirmations = Math.max(0, currentBlock - receipt.blockNumber + 1);

  return {
    hash,
    status:
      receipt.status === 1
        ? TransactionStatus.Confirmed
        : TransactionStatus.Failed,
    from: tx.from,
    to: tx.to || undefined,
    blockNumber: receipt.blockNumber,
    blockHash: receipt.blockHash,
    timestamp: block?.timestamp,
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.gasPrice,
    confirmations,
    error: receipt.status === 0 ? 'Transaction failed' : undefined,
  };
}

export async function waitForTransaction(
  provider: ethers.Provider,
  hash: string,
  confirmations: number = 1,
  timeout: number = 300000
): Promise<TransactionReceipt> {
  const tx = await provider.getTransaction(hash);

  if (!tx) {
    throw new Error(`Transaction not found: ${hash}`);
  }

  const receipt = await tx.wait(confirmations, timeout);

  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }

  return {
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockHash: receipt.blockHash,
    from: receipt.from,
    to: receipt.to || '',
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.gasPrice,
    status: receipt.status || 0,
    logs: receipt.logs,
  };
}
