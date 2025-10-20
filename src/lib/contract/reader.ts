import { ethers } from 'ethers';
import { getContractInstance } from './instance';
import {
  Batch,
  CollectorData,
  TesterData,
  ProcessorData,
  ManufacturerData,
  Phase,
  Status,
} from './types';
import { retrieveBatchMetadata } from '../ipfs/batch';

export interface EnrichedBatch extends Batch {
  id: number;
  metadata?: any;
}

export interface EnrichedCollectorData extends CollectorData {
  metadata?: any;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface EnrichedTesterData extends TesterData {
  metadata?: any;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface EnrichedProcessorData extends ProcessorData {
  metadata?: any;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface EnrichedManufacturerData extends ManufacturerData {
  metadata?: any;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface EnrichedFullChainData {
  batch: EnrichedBatch;
  collector: EnrichedCollectorData;
  tester: EnrichedTesterData;
  processor: EnrichedProcessorData;
  manufacturer: EnrichedManufacturerData;
}

function convertFromContractInt256(value: bigint): number {
  return Number(value) / 1e6;
}

async function fetchIPFSMetadata(ipfsHash: string): Promise<any | null> {
  if (!ipfsHash || ipfsHash === '') return null;

  try {
    return await retrieveBatchMetadata(ipfsHash);
  } catch (error) {
    console.warn('Failed to fetch IPFS metadata:', error);
    return null;
  }
}

export async function getEnrichedBatch(
  provider: ethers.Provider,
  batchId: number
): Promise<EnrichedBatch> {
  const contract = getContractInstance(provider);
  const batch = await contract.getBatch(batchId);

  return {
    id: batchId,
    batchNumber: batch.batchNumber,
    currentPhase: batch.currentPhase,
    status: batch.status,
    createdBy: batch.createdBy,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };
}

export async function getEnrichedCollectorData(
  provider: ethers.Provider,
  batchId: number
): Promise<EnrichedCollectorData> {
  const contract = getContractInstance(provider);
  const data = await contract.getCollectorData(batchId);

  const metadata = await fetchIPFSMetadata(data.qrCodeData);

  return {
    ...data,
    metadata,
    gpsCoordinates: {
      latitude: convertFromContractInt256(data.gpsLatitude),
      longitude: convertFromContractInt256(data.gpsLongitude),
    },
  };
}

export async function getEnrichedTesterData(
  provider: ethers.Provider,
  batchId: number
): Promise<EnrichedTesterData> {
  const contract = getContractInstance(provider);
  const data = await contract.getTesterData(batchId);

  const metadata = await fetchIPFSMetadata(data.qrCodeData);

  return {
    ...data,
    metadata,
    gpsCoordinates: {
      latitude: convertFromContractInt256(data.gpsLatitude),
      longitude: convertFromContractInt256(data.gpsLongitude),
    },
  };
}

export async function getEnrichedProcessorData(
  provider: ethers.Provider,
  batchId: number
): Promise<EnrichedProcessorData> {
  const contract = getContractInstance(provider);
  const data = await contract.getProcessorData(batchId);

  const metadata = await fetchIPFSMetadata(data.qrCodeData);

  return {
    ...data,
    metadata,
    gpsCoordinates: {
      latitude: convertFromContractInt256(data.gpsLatitude),
      longitude: convertFromContractInt256(data.gpsLongitude),
    },
  };
}

export async function getEnrichedManufacturerData(
  provider: ethers.Provider,
  batchId: number
): Promise<EnrichedManufacturerData> {
  const contract = getContractInstance(provider);
  const data = await contract.getManufacturerData(batchId);

  const metadata = await fetchIPFSMetadata(data.qrCodeData);

  return {
    ...data,
    metadata,
    gpsCoordinates: {
      latitude: convertFromContractInt256(data.gpsLatitude),
      longitude: convertFromContractInt256(data.gpsLongitude),
    },
  };
}

export async function getEnrichedFullChain(
  provider: ethers.Provider,
  batchId: number
): Promise<EnrichedFullChainData> {
  const contract = getContractInstance(provider);
  const result = await contract.getFullChain(batchId);

  const [
    collectorMetadata,
    testerMetadata,
    processorMetadata,
    manufacturerMetadata,
  ] = await Promise.all([
    fetchIPFSMetadata(result.collector.qrCodeData),
    fetchIPFSMetadata(result.tester.qrCodeData),
    fetchIPFSMetadata(result.processor.qrCodeData),
    fetchIPFSMetadata(result.manufacturer.qrCodeData),
  ]);

  return {
    batch: {
      id: batchId,
      batchNumber: result.batch.batchNumber,
      currentPhase: result.batch.currentPhase,
      status: result.batch.status,
      createdBy: result.batch.createdBy,
      createdAt: result.batch.createdAt,
      updatedAt: result.batch.updatedAt,
    },
    collector: {
      ...result.collector,
      metadata: collectorMetadata,
      gpsCoordinates: {
        latitude: convertFromContractInt256(result.collector.gpsLatitude),
        longitude: convertFromContractInt256(result.collector.gpsLongitude),
      },
    },
    tester: {
      ...result.tester,
      metadata: testerMetadata,
      gpsCoordinates: {
        latitude: convertFromContractInt256(result.tester.gpsLatitude),
        longitude: convertFromContractInt256(result.tester.gpsLongitude),
      },
    },
    processor: {
      ...result.processor,
      metadata: processorMetadata,
      gpsCoordinates: {
        latitude: convertFromContractInt256(result.processor.gpsLatitude),
        longitude: convertFromContractInt256(result.processor.gpsLongitude),
      },
    },
    manufacturer: {
      ...result.manufacturer,
      metadata: manufacturerMetadata,
      gpsCoordinates: {
        latitude: convertFromContractInt256(result.manufacturer.gpsLatitude),
        longitude: convertFromContractInt256(result.manufacturer.gpsLongitude),
      },
    },
  };
}

export async function getAllBatches(
  provider: ethers.Provider
): Promise<EnrichedBatch[]> {
  const contract = getContractInstance(provider);
  const totalBatches = await contract.getTotalBatches();

  const batchPromises = [];
  for (let i = 1; i <= Number(totalBatches); i++) {
    batchPromises.push(getEnrichedBatch(provider, i));
  }

  return Promise.all(batchPromises);
}

export async function getBatchesByPhase(
  provider: ethers.Provider,
  phase: Phase
): Promise<EnrichedBatch[]> {
  const allBatches = await getAllBatches(provider);
  return allBatches.filter((batch) => batch.currentPhase === phase);
}

export async function getBatchesByStatus(
  provider: ethers.Provider,
  status: Status
): Promise<EnrichedBatch[]> {
  const allBatches = await getAllBatches(provider);
  return allBatches.filter((batch) => batch.status === status);
}

export async function getBatchesByCreator(
  provider: ethers.Provider,
  creatorAddress: string
): Promise<EnrichedBatch[]> {
  const allBatches = await getAllBatches(provider);
  return allBatches.filter(
    (batch) => batch.createdBy.toLowerCase() === creatorAddress.toLowerCase()
  );
}
