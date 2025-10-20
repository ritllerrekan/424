import { useEffect, useCallback, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { ContractEventListener, ContractEvent } from '../lib/contract/events';
import { batchCache, eventCache } from '../lib/blockchain/cache';
import { handleBlockchainError } from '../lib/blockchain/errorHandler';

export type EventCallback = (event: ContractEvent) => void;

interface UseRealtimeEventsOptions {
  onNewEvent?: EventCallback;
  maxEvents?: number;
  autoSubscribe?: boolean;
}

interface UseRealtimeEventsResult {
  events: ContractEvent[];
  isListening: boolean;
  error: string | null;
  subscribe: () => void;
  unsubscribe: () => void;
  clearEvents: () => void;
  latestEvent: ContractEvent | null;
}

export function useRealtimeEvents(
  provider: ethers.Provider | null,
  options: UseRealtimeEventsOptions = {}
): UseRealtimeEventsResult {
  const {
    onNewEvent,
    maxEvents = 50,
    autoSubscribe = true,
  } = options;

  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestEvent, setLatestEvent] = useState<ContractEvent | null>(null);

  const eventListenerRef = useRef<ContractEventListener | null>(null);
  const unsubscribeFnsRef = useRef<Array<() => void>>([]);

  const handleNewEvent = useCallback((event: ContractEvent) => {
    setEvents((prev) => {
      const updated = [event, ...prev];
      return updated.slice(0, maxEvents);
    });

    setLatestEvent(event);

    eventCache.set(`event-${event.transactionHash}`, event);

    batchCache.invalidate(/^batches-/);

    if (onNewEvent) {
      onNewEvent(event);
    }
  }, [onNewEvent, maxEvents]);

  const subscribe = useCallback(() => {
    if (!provider || isListening) return;

    try {
      setError(null);
      const listener = new ContractEventListener(provider);
      eventListenerRef.current = listener;

      const batchCreatedUnsub = listener.onBatchCreated(handleNewEvent);
      const batchCompletedUnsub = listener.onBatchCompleted(handleNewEvent);
      const collectorDataUnsub = listener.onCollectorDataAdded(handleNewEvent);
      const testerDataUnsub = listener.onTesterDataAdded(handleNewEvent);
      const processorDataUnsub = listener.onProcessorDataAdded(handleNewEvent);
      const manufacturerDataUnsub = listener.onManufacturerDataAdded(handleNewEvent);

      unsubscribeFnsRef.current = [
        batchCreatedUnsub,
        batchCompletedUnsub,
        collectorDataUnsub,
        testerDataUnsub,
        processorDataUnsub,
        manufacturerDataUnsub,
      ];

      setIsListening(true);
      console.log('Subscribed to realtime blockchain events');
    } catch (err) {
      const blockchainError = handleBlockchainError(err);
      setError(blockchainError.message);
      console.error('Failed to subscribe to events:', blockchainError);
    }
  }, [provider, isListening, handleNewEvent]);

  const unsubscribe = useCallback(() => {
    if (!isListening) return;

    unsubscribeFnsRef.current.forEach((unsub) => unsub());
    unsubscribeFnsRef.current = [];

    if (eventListenerRef.current) {
      eventListenerRef.current.removeAllListeners();
      eventListenerRef.current = null;
    }

    setIsListening(false);
    console.log('Unsubscribed from realtime blockchain events');
  }, [isListening]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, []);

  useEffect(() => {
    if (autoSubscribe && provider && !isListening) {
      subscribe();
    }

    return () => {
      if (isListening) {
        unsubscribe();
      }
    };
  }, [autoSubscribe, provider, isListening, subscribe, unsubscribe]);

  return {
    events,
    isListening,
    error,
    subscribe,
    unsubscribe,
    clearEvents,
    latestEvent,
  };
}

export function useBlockListener(
  provider: ethers.Provider | null,
  onNewBlock?: (blockNumber: number) => void
) {
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!provider) return;

    const handleBlock = (blockNumber: number) => {
      setCurrentBlock(blockNumber);
      if (onNewBlock) {
        onNewBlock(blockNumber);
      }
    };

    provider.on('block', handleBlock);
    setIsListening(true);

    provider.getBlockNumber().then(setCurrentBlock).catch(console.error);

    return () => {
      provider.off('block', handleBlock);
      setIsListening(false);
    };
  }, [provider, onNewBlock]);

  return {
    currentBlock,
    isListening,
  };
}

export function useEventSubscription(
  provider: ethers.Provider | null,
  eventName: 'BatchCreated' | 'BatchCompleted' | 'CollectorDataAdded' | 'TesterDataAdded' | 'ProcessorDataAdded' | 'ManufacturerDataAdded',
  callback: EventCallback
) {
  const listenerRef = useRef<ContractEventListener | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!provider) return;

    const listener = new ContractEventListener(provider);
    listenerRef.current = listener;

    const subscriptionMap = {
      BatchCreated: listener.onBatchCreated.bind(listener),
      BatchCompleted: listener.onBatchCompleted.bind(listener),
      CollectorDataAdded: listener.onCollectorDataAdded.bind(listener),
      TesterDataAdded: listener.onTesterDataAdded.bind(listener),
      ProcessorDataAdded: listener.onProcessorDataAdded.bind(listener),
      ManufacturerDataAdded: listener.onManufacturerDataAdded.bind(listener),
    };

    const subscribeFn = subscriptionMap[eventName];
    unsubscribeRef.current = subscribeFn(callback as any);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      listener.removeAllListeners();
    };
  }, [provider, eventName, callback]);
}
