import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  createSmartAccountClient,
} from '@biconomy/account';
import { ethers } from 'ethers';

export interface SmartAccountConfig {
  signer: ethers.Signer;
  chainId: number;
  bundlerUrl: string;
  paymasterUrl?: string;
}

export interface TransactionQueueItem {
  id: string;
  to: string;
  data: string;
  value: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
  error?: string;
}

export async function createSmartAccount(
  config: SmartAccountConfig
): Promise<BiconomySmartAccountV2> {
  const smartAccount = await createSmartAccountClient({
    signer: config.signer,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.paymasterUrl,
    chainId: config.chainId,
  });

  return smartAccount;
}

export async function executeTransaction(
  smartAccount: BiconomySmartAccountV2,
  transaction: {
    to: string;
    data: string;
    value: string;
  }
): Promise<string> {
  try {
    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: ethers.parseEther(transaction.value || '0'),
    };

    const userOpResponse = await smartAccount.sendTransaction(tx, {
      paymasterServiceData: { mode: 'SPONSORED' },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log('Transaction Hash:', transactionHash);

    const userOpReceipt = await userOpResponse.wait();

    if (userOpReceipt.success === 'true') {
      console.log('Transaction successful:', userOpReceipt);
      return transactionHash;
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('Transaction execution error:', error);
    throw error;
  }
}

export async function batchExecuteTransactions(
  smartAccount: BiconomySmartAccountV2,
  transactions: Array<{
    to: string;
    data: string;
    value?: string;
  }>
): Promise<string> {
  try {
    const txs = transactions.map(tx => ({
      to: tx.to,
      data: tx.data,
      value: ethers.parseEther(tx.value || '0'),
    }));

    const userOpResponse = await smartAccount.sendTransaction(txs, {
      paymasterServiceData: { mode: 'SPONSORED' },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log('Batch Transaction Hash:', transactionHash);

    const userOpReceipt = await userOpResponse.wait();

    if (userOpReceipt.success === 'true') {
      console.log('Batch transaction successful:', userOpReceipt);
      return transactionHash;
    } else {
      throw new Error('Batch transaction failed');
    }
  } catch (error) {
    console.error('Batch transaction execution error:', error);
    throw error;
  }
}

export async function estimateUserOperationGas(
  smartAccount: BiconomySmartAccountV2,
  transaction: {
    to: string;
    data: string;
    value: string;
  }
): Promise<bigint> {
  try {
    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: ethers.parseEther(transaction.value || '0'),
    };

    const partialUserOp = await smartAccount.buildUserOp([tx]);

    return BigInt(partialUserOp.callGasLimit?.toString() || '0');
  } catch (error) {
    console.error('Gas estimation error:', error);
    throw error;
  }
}

export function validateAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function encodeContractCall(
  contractInterface: ethers.Interface,
  functionName: string,
  args: any[]
): string {
  return contractInterface.encodeFunctionData(functionName, args);
}

export async function checkSmartAccountDeployment(
  provider: ethers.Provider,
  address: string
): Promise<boolean> {
  const code = await provider.getCode(address);
  return code !== '0x';
}

export class TransactionQueueManager {
  private queue: TransactionQueueItem[] = [];
  private smartAccount: BiconomySmartAccountV2;

  constructor(smartAccount: BiconomySmartAccountV2) {
    this.smartAccount = smartAccount;
  }

  add(transaction: Omit<TransactionQueueItem, 'id' | 'status' | 'timestamp'>): string {
    const item: TransactionQueueItem = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      timestamp: Date.now(),
    };
    this.queue.push(item);
    return item.id;
  }

  remove(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  clear(): void {
    this.queue = [];
  }

  getQueue(): TransactionQueueItem[] {
    return [...this.queue];
  }

  getPending(): TransactionQueueItem[] {
    return this.queue.filter(item => item.status === 'pending');
  }

  async processAll(): Promise<void> {
    const pending = this.getPending();
    if (pending.length === 0) return;

    pending.forEach(item => {
      item.status = 'processing';
    });

    try {
      const transactions = pending.map(item => ({
        to: item.to,
        data: item.data,
        value: item.value,
      }));

      const txHash = await batchExecuteTransactions(this.smartAccount, transactions);

      pending.forEach(item => {
        item.status = 'completed';
        item.txHash = txHash;
      });

      setTimeout(() => {
        pending.forEach(item => this.remove(item.id));
      }, 5000);
    } catch (error) {
      pending.forEach(item => {
        item.status = 'failed';
        item.error = error instanceof Error ? error.message : 'Transaction failed';
      });
      throw error;
    }
  }
}

export async function sponsorTransaction(
  smartAccount: BiconomySmartAccountV2,
  transaction: {
    to: string;
    data: string;
    value?: string;
  }
): Promise<string> {
  return executeTransaction(smartAccount, {
    to: transaction.to,
    data: transaction.data,
    value: transaction.value || '0',
  });
}

export async function getSmartAccountNonce(
  smartAccount: BiconomySmartAccountV2
): Promise<bigint> {
  try {
    const nonce = await smartAccount.getNonce();
    return BigInt(nonce);
  } catch (error) {
    console.error('Failed to get nonce:', error);
    throw error;
  }
}
