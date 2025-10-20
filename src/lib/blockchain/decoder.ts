import { ethers } from 'ethers';
import { ContractEvent } from '../contract/events';

export interface DecodedTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp?: number;
  method?: string;
  params?: Record<string, any>;
  status: 'success' | 'failed';
  gasUsed?: string;
}

export interface DecodedEventLog {
  eventName: string;
  params: Record<string, any>;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
}

export function decodeEventLog(
  log: ethers.EventLog
): DecodedEventLog | null {
  try {
    const fragment = log.fragment;
    if (!fragment) {
      return null;
    }

    const params: Record<string, any> = {};

    fragment.inputs.forEach((input, index) => {
      const value = log.args[index];
      params[input.name] = formatParamValue(value, input.type);
    });

    return {
      eventName: fragment.name,
      params,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.index,
    };
  } catch (error) {
    console.warn('Failed to decode event log:', error);
    return null;
  }
}

export function decodeTransactionData(
  data: string,
  contractInterface: ethers.Interface
): { method: string; params: Record<string, any> } | null {
  try {
    const decoded = contractInterface.parseTransaction({ data });
    if (!decoded) {
      return null;
    }

    const params: Record<string, any> = {};

    decoded.fragment.inputs.forEach((input, index) => {
      const value = decoded.args[index];
      params[input.name] = formatParamValue(value, input.type);
    });

    return {
      method: decoded.name,
      params,
    };
  } catch (error) {
    console.warn('Failed to decode transaction data:', error);
    return null;
  }
}

function formatParamValue(value: any, type: string): any {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return typeof value === 'bigint' ? value.toString() : value;
  }

  if (type === 'address') {
    return value;
  }

  if (type === 'bool') {
    return Boolean(value);
  }

  if (type === 'bytes' || type.startsWith('bytes')) {
    return value;
  }

  if (type === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatParamValue(item, type.replace('[]', '')));
  }

  return value;
}

export async function enrichTransactionWithReceipt(
  provider: ethers.Provider,
  txHash: string
): Promise<Partial<DecodedTransaction>> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return {};
    }

    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.warn('Failed to fetch transaction receipt:', error);
    return {};
  }
}

export async function getTransactionTimestamp(
  provider: ethers.Provider,
  blockNumber: number
): Promise<number | undefined> {
  try {
    const block = await provider.getBlock(blockNumber);
    return block?.timestamp;
  } catch (error) {
    console.warn('Failed to fetch block timestamp:', error);
    return undefined;
  }
}

export function categorizeEvent(event: ContractEvent): string {
  if ('batchNumber' in event) {
    return 'batch-created';
  }
  if ('completedBy' in event) {
    return 'batch-completed';
  }
  if ('collector' in event) {
    return 'collector-data';
  }
  if ('tester' in event) {
    return 'tester-data';
  }
  if ('processor' in event) {
    return 'processor-data';
  }
  if ('manufacturer' in event) {
    return 'manufacturer-data';
  }
  return 'unknown';
}

export function formatEventForDisplay(event: ContractEvent): {
  title: string;
  description: string;
  type: string;
} {
  const category = categorizeEvent(event);

  switch (category) {
    case 'batch-created':
      return {
        title: 'Batch Created',
        description: `New batch created`,
        type: 'success',
      };
    case 'batch-completed':
      return {
        title: 'Batch Completed',
        description: `Batch completed successfully`,
        type: 'success',
      };
    case 'collector-data':
      return {
        title: 'Collector Data Added',
        description: `Collector added data to batch`,
        type: 'info',
      };
    case 'tester-data':
      return {
        title: 'Tester Data Added',
        description: `Tester added data to batch`,
        type: 'info',
      };
    case 'processor-data':
      return {
        title: 'Processor Data Added',
        description: `Processor added data to batch`,
        type: 'info',
      };
    case 'manufacturer-data':
      return {
        title: 'Manufacturer Data Added',
        description: `Manufacturer added data to batch`,
        type: 'info',
      };
    default:
      return {
        title: 'Unknown Event',
        description: 'Event details unavailable',
        type: 'default',
      };
  }
}
