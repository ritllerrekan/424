export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionEventType =
  | 'BatchCreated'
  | 'CollectorDataAdded'
  | 'TesterDataAdded'
  | 'ProcessorDataAdded'
  | 'ManufacturerDataAdded'
  | 'BatchCompleted';

export interface TransactionMetadata {
  batchId?: string;
  batchNumber?: string;
  phase?: string;
  actor?: string;
  eventType: TransactionEventType;
  description: string;
}

export interface BlockchainTransaction {
  id: string;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: TransactionStatus;
  eventType: TransactionEventType;
  metadata: TransactionMetadata;
  createdAt: string;
}

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

export interface ParsedEvent {
  eventType: TransactionEventType;
  batchId: string;
  actor: string;
  batchNumber?: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface TransactionFilter {
  eventType?: TransactionEventType;
  fromAddress?: string;
  toAddress?: string;
  batchId?: string;
  startBlock?: number;
  endBlock?: number;
  startDate?: Date;
  endDate?: Date;
  status?: TransactionStatus;
}

export interface TransactionSearchResult {
  transactions: BlockchainTransaction[];
  totalCount: number;
  hasMore: boolean;
}
