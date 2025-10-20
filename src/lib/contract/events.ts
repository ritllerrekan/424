import { ethers } from 'ethers';
import { getContractInstance } from './instance';

export interface BatchCreatedEvent {
  batchId: bigint;
  batchNumber: string;
  creator: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface BatchCompletedEvent {
  batchId: bigint;
  completedBy: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface CollectorDataAddedEvent {
  batchId: bigint;
  collector: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface TesterDataAddedEvent {
  batchId: bigint;
  tester: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface ProcessorDataAddedEvent {
  batchId: bigint;
  processor: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface ManufacturerDataAddedEvent {
  batchId: bigint;
  manufacturer: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export type ContractEvent =
  | BatchCreatedEvent
  | BatchCompletedEvent
  | CollectorDataAddedEvent
  | TesterDataAddedEvent
  | ProcessorDataAddedEvent
  | ManufacturerDataAddedEvent;

export type EventCallback<T extends ContractEvent> = (event: T) => void;

export class ContractEventListener {
  private contract: ethers.Contract;
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.contract = getContractInstance(provider);
  }

  private async enrichEventWithTimestamp(
    event: ethers.EventLog
  ): Promise<number | undefined> {
    try {
      const block = await this.provider.getBlock(event.blockNumber);
      return block?.timestamp;
    } catch (error) {
      console.warn('Failed to fetch block timestamp:', error);
      return undefined;
    }
  }

  onBatchCreated(callback: EventCallback<BatchCreatedEvent>): () => void {
    const listener = async (...args: any[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      const timestamp = await this.enrichEventWithTimestamp(event);

      callback({
        batchId: args[0],
        batchNumber: args[1],
        creator: args[2],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp,
      });
    };

    this.contract.on('BatchCreated', listener);

    const unsubscribe = () => {
      this.contract.off('BatchCreated', listener);
    };

    return unsubscribe;
  }

  onBatchCompleted(callback: EventCallback<BatchCompletedEvent>): () => void {
    const listener = async (...args: any[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      const timestamp = await this.enrichEventWithTimestamp(event);

      callback({
        batchId: args[0],
        completedBy: args[1],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp,
      });
    };

    this.contract.on('BatchCompleted', listener);

    const unsubscribe = () => {
      this.contract.off('BatchCompleted', listener);
    };

    return unsubscribe;
  }

  onCollectorDataAdded(
    callback: EventCallback<CollectorDataAddedEvent>
  ): () => void {
    const listener = async (...args: any[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      const timestamp = await this.enrichEventWithTimestamp(event);

      callback({
        batchId: args[0],
        collector: args[1],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp,
      });
    };

    this.contract.on('CollectorDataAdded', listener);

    const unsubscribe = () => {
      this.contract.off('CollectorDataAdded', listener);
    };

    return unsubscribe;
  }

  onTesterDataAdded(
    callback: EventCallback<TesterDataAddedEvent>
  ): () => void {
    const listener = async (...args: any[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      const timestamp = await this.enrichEventWithTimestamp(event);

      callback({
        batchId: args[0],
        tester: args[1],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp,
      });
    };

    this.contract.on('TesterDataAdded', listener);

    const unsubscribe = () => {
      this.contract.off('TesterDataAdded', listener);
    };

    return unsubscribe;
  }

  onProcessorDataAdded(
    callback: EventCallback<ProcessorDataAddedEvent>
  ): () => void {
    const listener = async (...args: any[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      const timestamp = await this.enrichEventWithTimestamp(event);

      callback({
        batchId: args[0],
        processor: args[1],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp,
      });
    };

    this.contract.on('ProcessorDataAdded', listener);

    const unsubscribe = () => {
      this.contract.off('ProcessorDataAdded', listener);
    };

    return unsubscribe;
  }

  onManufacturerDataAdded(
    callback: EventCallback<ManufacturerDataAddedEvent>
  ): () => void {
    const listener = async (...args: any[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      const timestamp = await this.enrichEventWithTimestamp(event);

      callback({
        batchId: args[0],
        manufacturer: args[1],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp,
      });
    };

    this.contract.on('ManufacturerDataAdded', listener);

    const unsubscribe = () => {
      this.contract.off('ManufacturerDataAdded', listener);
    };

    return unsubscribe;
  }

  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}

export async function queryPastEvents(
  provider: ethers.Provider,
  eventName:
    | 'BatchCreated'
    | 'BatchCompleted'
    | 'CollectorDataAdded'
    | 'TesterDataAdded'
    | 'ProcessorDataAdded'
    | 'ManufacturerDataAdded',
  fromBlock: number = 0,
  toBlock: number | 'latest' = 'latest'
): Promise<ContractEvent[]> {
  const contract = getContractInstance(provider);

  const filter = contract.filters[eventName]();
  const events = await contract.queryFilter(filter, fromBlock, toBlock);

  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      const log = event as ethers.EventLog;
      let timestamp: number | undefined;

      try {
        const block = await provider.getBlock(log.blockNumber);
        timestamp = block?.timestamp;
      } catch (error) {
        console.warn('Failed to fetch block timestamp:', error);
      }

      const args = log.args;

      switch (eventName) {
        case 'BatchCreated':
          return {
            batchId: args[0],
            batchNumber: args[1],
            creator: args[2],
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp,
          } as BatchCreatedEvent;

        case 'BatchCompleted':
          return {
            batchId: args[0],
            completedBy: args[1],
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp,
          } as BatchCompletedEvent;

        case 'CollectorDataAdded':
          return {
            batchId: args[0],
            collector: args[1],
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp,
          } as CollectorDataAddedEvent;

        case 'TesterDataAdded':
          return {
            batchId: args[0],
            tester: args[1],
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp,
          } as TesterDataAddedEvent;

        case 'ProcessorDataAdded':
          return {
            batchId: args[0],
            processor: args[1],
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp,
          } as ProcessorDataAddedEvent;

        case 'ManufacturerDataAdded':
          return {
            batchId: args[0],
            manufacturer: args[1],
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp,
          } as ManufacturerDataAddedEvent;

        default:
          throw new Error(`Unknown event: ${eventName}`);
      }
    })
  );

  return enrichedEvents;
}

export async function getAllEvents(
  provider: ethers.Provider,
  fromBlock: number = 0,
  toBlock: number | 'latest' = 'latest'
): Promise<ContractEvent[]> {
  const eventNames = [
    'BatchCreated',
    'BatchCompleted',
    'CollectorDataAdded',
    'TesterDataAdded',
    'ProcessorDataAdded',
    'ManufacturerDataAdded',
  ] as const;

  const allEventsPromises = eventNames.map((eventName) =>
    queryPastEvents(provider, eventName, fromBlock, toBlock)
  );

  const allEventsArrays = await Promise.all(allEventsPromises);
  const allEvents = allEventsArrays.flat();

  allEvents.sort((a, b) => a.blockNumber - b.blockNumber);

  return allEvents;
}
