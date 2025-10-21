import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import {
  BlockchainTransaction,
  TransactionLog,
  ParsedEvent,
  TransactionEventType,
  TransactionFilter,
  TransactionSearchResult,
  TransactionMetadata,
  TransactionStatus
} from '../types/transaction';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EVENT_SIGNATURES = {
  BatchCreated: ethers.id('BatchCreated(uint256,string,address)'),
  CollectorDataAdded: ethers.id('CollectorDataAdded(uint256,address)'),
  TesterDataAdded: ethers.id('TesterDataAdded(uint256,address)'),
  ProcessorDataAdded: ethers.id('ProcessorDataAdded(uint256,address)'),
  ManufacturerDataAdded: ethers.id('ManufacturerDataAdded(uint256,address)'),
  BatchCompleted: ethers.id('BatchCompleted(uint256,address)')
};

const transactionCache = new Map<string, BlockchainTransaction>();

export async function fetchBlockchainLogs(
  provider: ethers.BrowserProvider,
  filter: TransactionFilter = {}
): Promise<TransactionLog[]> {
  try {
    const topics: (string | string[])[] = [];

    if (filter.eventType) {
      topics.push(EVENT_SIGNATURES[filter.eventType]);
    }

    if (filter.batchId) {
      const paddedBatchId = ethers.zeroPadValue(
        ethers.toBeHex(BigInt(filter.batchId)),
        32
      );
      topics.push(paddedBatchId);
    }

    const logs = await provider.getLogs({
      address: contractAddress,
      topics,
      fromBlock: filter.startBlock || 0,
      toBlock: filter.endBlock || 'latest'
    });

    return logs as TransactionLog[];
  } catch (error) {
    console.error('Error fetching blockchain logs:', error);
    throw error;
  }
}

export function parseEventLog(log: TransactionLog): ParsedEvent | null {
  try {
    const eventSignature = log.topics[0];
    let eventType: TransactionEventType | null = null;

    for (const [type, signature] of Object.entries(EVENT_SIGNATURES)) {
      if (signature === eventSignature) {
        eventType = type as TransactionEventType;
        break;
      }
    }

    if (!eventType) {
      return null;
    }

    const batchId = ethers.toNumber(log.topics[1]);
    const actor = ethers.getAddress('0x' + log.topics[2].slice(26));

    let batchNumber: string | undefined;
    if (eventType === 'BatchCreated' && log.data !== '0x') {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(['string'], log.data);
        batchNumber = decoded[0];
      } catch (e) {
        console.warn('Could not decode batch number:', e);
      }
    }

    return {
      eventType,
      batchId: batchId.toString(),
      actor,
      batchNumber,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error parsing event log:', error);
    return null;
  }
}

export function extractTransactionMetadata(parsedEvent: ParsedEvent): TransactionMetadata {
  const phaseMap: Record<string, string> = {
    CollectorDataAdded: 'Collection',
    TesterDataAdded: 'Testing',
    ProcessorDataAdded: 'Processing',
    ManufacturerDataAdded: 'Manufacturing'
  };

  const descriptionMap: Record<TransactionEventType, string> = {
    BatchCreated: 'New batch created',
    CollectorDataAdded: 'Collection data recorded',
    TesterDataAdded: 'Testing data recorded',
    ProcessorDataAdded: 'Processing data recorded',
    ManufacturerDataAdded: 'Manufacturing data recorded',
    BatchCompleted: 'Batch completed'
  };

  return {
    batchId: parsedEvent.batchId,
    batchNumber: parsedEvent.batchNumber,
    phase: phaseMap[parsedEvent.eventType],
    actor: parsedEvent.actor,
    eventType: parsedEvent.eventType,
    description: descriptionMap[parsedEvent.eventType]
  };
}

export async function calculateGasMetrics(
  provider: ethers.BrowserProvider,
  transactionHash: string
): Promise<{ gasUsed: string; gasPrice: string; totalCost: string }> {
  try {
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const transaction = await provider.getTransaction(transactionHash);

    if (!receipt || !transaction) {
      return { gasUsed: '0', gasPrice: '0', totalCost: '0' };
    }

    const gasUsed = receipt.gasUsed.toString();
    const gasPrice = transaction.gasPrice?.toString() || '0';
    const totalCost = (receipt.gasUsed * (transaction.gasPrice || BigInt(0))).toString();

    return { gasUsed, gasPrice, totalCost };
  } catch (error) {
    console.error('Error calculating gas metrics:', error);
    return { gasUsed: '0', gasPrice: '0', totalCost: '0' };
  }
}

export async function getTransactionStatus(
  provider: ethers.BrowserProvider,
  transactionHash: string
): Promise<TransactionStatus> {
  try {
    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (!receipt) {
      return 'pending';
    }

    return receipt.status === 1 ? 'confirmed' : 'failed';
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return 'pending';
  }
}

export async function processAndCacheTransaction(
  provider: ethers.BrowserProvider,
  parsedEvent: ParsedEvent,
  userId: string
): Promise<BlockchainTransaction> {
  const transactionHash = parsedEvent.transactionHash;

  if (transactionCache.has(transactionHash)) {
    return transactionCache.get(transactionHash)!;
  }

  const transaction = await provider.getTransaction(transactionHash);
  const block = await provider.getBlock(parsedEvent.blockNumber);
  const gasMetrics = await calculateGasMetrics(provider, transactionHash);
  const status = await getTransactionStatus(provider, transactionHash);
  const metadata = extractTransactionMetadata(parsedEvent);

  const blockchainTx: BlockchainTransaction = {
    id: `${transactionHash}-${parsedEvent.batchId}`,
    transactionHash,
    blockNumber: parsedEvent.blockNumber,
    blockTimestamp: block?.timestamp || Date.now(),
    from: transaction?.from || parsedEvent.actor,
    to: transaction?.to || contractAddress,
    value: transaction?.value.toString() || '0',
    gasUsed: gasMetrics.gasUsed,
    gasPrice: gasMetrics.gasPrice,
    status,
    eventType: parsedEvent.eventType,
    metadata,
    createdAt: new Date().toISOString()
  };

  transactionCache.set(transactionHash, blockchainTx);

  await cacheTransactionInDatabase(blockchainTx, userId);

  return blockchainTx;
}

export async function cacheTransactionInDatabase(
  transaction: BlockchainTransaction,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase.from('transaction_cache').upsert({
      id: transaction.id,
      transaction_hash: transaction.transactionHash,
      block_number: transaction.blockNumber,
      block_timestamp: transaction.blockTimestamp,
      from_address: transaction.from,
      to_address: transaction.to,
      value: transaction.value,
      gas_used: transaction.gasUsed,
      gas_price: transaction.gasPrice,
      status: transaction.status,
      event_type: transaction.eventType,
      batch_id: transaction.metadata.batchId,
      batch_number: transaction.metadata.batchNumber,
      phase: transaction.metadata.phase,
      actor: transaction.metadata.actor,
      description: transaction.metadata.description,
      user_id: userId,
      metadata: transaction.metadata
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error caching transaction in database:', error);
  }
}

export async function fetchTransactionsFromCache(
  userId: string,
  filter: TransactionFilter = {},
  limit: number = 50,
  offset: number = 0
): Promise<TransactionSearchResult> {
  try {
    let query = supabase
      .from('transaction_cache')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filter.eventType) {
      query = query.eq('event_type', filter.eventType);
    }

    if (filter.batchId) {
      query = query.eq('batch_id', filter.batchId);
    }

    if (filter.fromAddress) {
      query = query.eq('from_address', filter.fromAddress);
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.startDate) {
      query = query.gte('block_timestamp', Math.floor(filter.startDate.getTime() / 1000));
    }

    if (filter.endDate) {
      query = query.lte('block_timestamp', Math.floor(filter.endDate.getTime() / 1000));
    }

    const { data, error, count } = await query
      .order('block_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const transactions: BlockchainTransaction[] = (data || []).map((row) => ({
      id: row.id,
      transactionHash: row.transaction_hash,
      blockNumber: row.block_number,
      blockTimestamp: row.block_timestamp,
      from: row.from_address,
      to: row.to_address,
      value: row.value,
      gasUsed: row.gas_used,
      gasPrice: row.gas_price,
      status: row.status,
      eventType: row.event_type,
      metadata: {
        batchId: row.batch_id,
        batchNumber: row.batch_number,
        phase: row.phase,
        actor: row.actor,
        eventType: row.event_type,
        description: row.description
      },
      createdAt: row.created_at
    }));

    return {
      transactions,
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit
    };
  } catch (error) {
    console.error('Error fetching transactions from cache:', error);
    return { transactions: [], totalCount: 0, hasMore: false };
  }
}

export async function syncTransactionsForUser(
  provider: ethers.BrowserProvider,
  userId: string,
  userAddress: string
): Promise<BlockchainTransaction[]> {
  try {
    const logs = await fetchBlockchainLogs(provider);
    const transactions: BlockchainTransaction[] = [];

    for (const log of logs) {
      const parsedEvent = parseEventLog(log);
      if (parsedEvent && parsedEvent.actor.toLowerCase() === userAddress.toLowerCase()) {
        const transaction = await processAndCacheTransaction(provider, parsedEvent, userId);
        transactions.push(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return [];
  }
}

export async function searchTransactions(
  userId: string,
  searchTerm: string,
  filter: TransactionFilter = {}
): Promise<BlockchainTransaction[]> {
  try {
    let query = supabase
      .from('transaction_cache')
      .select('*')
      .eq('user_id', userId);

    if (searchTerm) {
      query = query.or(
        `batch_id.ilike.%${searchTerm}%,` +
        `batch_number.ilike.%${searchTerm}%,` +
        `transaction_hash.ilike.%${searchTerm}%,` +
        `description.ilike.%${searchTerm}%`
      );
    }

    if (filter.eventType) {
      query = query.eq('event_type', filter.eventType);
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query
      .order('block_timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      transactionHash: row.transaction_hash,
      blockNumber: row.block_number,
      blockTimestamp: row.block_timestamp,
      from: row.from_address,
      to: row.to_address,
      value: row.value,
      gasUsed: row.gas_used,
      gasPrice: row.gas_price,
      status: row.status,
      eventType: row.event_type,
      metadata: {
        batchId: row.batch_id,
        batchNumber: row.batch_number,
        phase: row.phase,
        actor: row.actor,
        eventType: row.event_type,
        description: row.description
      },
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error searching transactions:', error);
    return [];
  }
}

export function clearTransactionCache(): void {
  transactionCache.clear();
}

export function formatGasPrice(gasPrice: string): string {
  try {
    const gwei = ethers.formatUnits(gasPrice, 'gwei');
    return `${parseFloat(gwei).toFixed(2)} Gwei`;
  } catch {
    return '0 Gwei';
  }
}

export function formatEther(value: string): string {
  try {
    return ethers.formatEther(value);
  } catch {
    return '0';
  }
}
