import { ethers } from 'ethers';
import { getContractInstance, getContractInterface } from './instance';
import {
  CollectorDataInput,
  TesterDataInput,
  ProcessorDataInput,
  ManufacturerDataInput,
  Batch,
  CollectorData,
  TesterData,
  ProcessorData,
  ManufacturerData,
  FullChainData,
} from './types';
import { uploadBatchMetadata } from '../ipfs/batch';

function convertToContractInt256(value: number): bigint {
  return BigInt(Math.floor(value * 1e6));
}

function convertToContractInt16(value: number): number {
  return Math.floor(value * 10);
}

export async function addCollectorData(
  signer: ethers.Signer,
  data: CollectorDataInput
): Promise<{ batchId: bigint; txHash: string; ipfsHash: string }> {
  const contract = getContractInstance(signer);

  const ipfsHash = await uploadBatchMetadata({
    type: 'collector',
    data: {
      ...data,
      timestamp: Date.now(),
    },
  });

  const qrData = data.ipfsHash || ipfsHash;

  const tx = await contract.addCollectorData(
    data.batchNumber,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.humidity,
    data.harvestDate,
    data.seedCropName,
    data.pesticideUsed,
    data.pesticideName,
    data.pesticideQuantity,
    ethers.parseUnits(data.pricePerUnit.toString(), 0),
    ethers.parseUnits(data.weightTotal.toString(), 0),
    ethers.parseUnits(data.totalPrice.toString(), 0),
    qrData
  );

  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e?.name === 'BatchCreated');

  const batchId = event ? event.args[0] : BigInt(0);

  return {
    batchId,
    txHash: receipt.hash,
    ipfsHash,
  };
}

export async function addTesterData(
  signer: ethers.Signer,
  data: TesterDataInput
): Promise<{ batchId: bigint; txHash: string; ipfsHash: string }> {
  const contract = getContractInstance(signer);

  const ipfsHash = await uploadBatchMetadata({
    type: 'tester',
    data: {
      ...data,
      timestamp: Date.now(),
    },
  });

  const qrData = data.ipfsHash || ipfsHash;

  const tx = await contract.addTesterData(
    data.collectorBatchId,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.humidity,
    data.testDate,
    ethers.parseUnits(data.qualityGradeScore.toString(), 0),
    ethers.parseUnits(data.contaminantLevel.toString(), 0),
    ethers.parseUnits(data.purityLevel.toString(), 0),
    data.labName,
    data.collectorRating,
    data.collectorRatingNotes,
    qrData
  );

  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e?.name === 'TesterDataAdded');

  const batchId = event ? event.args[0] : BigInt(0);

  return {
    batchId,
    txHash: receipt.hash,
    ipfsHash,
  };
}

export async function addProcessorData(
  signer: ethers.Signer,
  data: ProcessorDataInput
): Promise<{ batchId: bigint; txHash: string; ipfsHash: string }> {
  const contract = getContractInstance(signer);

  const ipfsHash = await uploadBatchMetadata({
    type: 'processor',
    data: {
      ...data,
      timestamp: Date.now(),
    },
  });

  const qrData = data.ipfsHash || ipfsHash;

  const tx = await contract.addProcessorData(
    data.testerBatchId,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.processingType,
    ethers.parseUnits(data.inputWeight.toString(), 0),
    ethers.parseUnits(data.outputWeight.toString(), 0),
    ethers.parseUnits(data.conversionRatio.toString(), 0),
    data.chemicalsAdditives,
    data.testerRating,
    data.testerRatingNotes,
    qrData
  );

  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e?.name === 'ProcessorDataAdded');

  const batchId = event ? event.args[0] : BigInt(0);

  return {
    batchId,
    txHash: receipt.hash,
    ipfsHash,
  };
}

export async function addManufacturerData(
  signer: ethers.Signer,
  data: ManufacturerDataInput
): Promise<{ batchId: bigint; txHash: string; ipfsHash: string }> {
  const contract = getContractInstance(signer);

  const ipfsHash = await uploadBatchMetadata({
    type: 'manufacturer',
    data: {
      ...data,
      timestamp: Date.now(),
    },
  });

  const qrData = data.ipfsHash || ipfsHash;

  const tx = await contract.addManufacturerData(
    data.processorBatchId,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.productName,
    data.brandName,
    data.productType,
    ethers.parseUnits(data.quantity.toString(), 0),
    data.unit,
    data.location,
    data.manufactureDate,
    data.expiryDate,
    data.processorRating,
    data.processorRatingNotes,
    qrData
  );

  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e?.name === 'ManufacturerDataAdded');

  const batchId = event ? event.args[0] : BigInt(0);

  return {
    batchId,
    txHash: receipt.hash,
    ipfsHash,
  };
}

export async function getBatch(
  provider: ethers.Provider,
  batchId: number
): Promise<Batch> {
  const contract = getContractInstance(provider);
  const batch = await contract.getBatch(batchId);

  return {
    batchNumber: batch.batchNumber,
    currentPhase: batch.currentPhase,
    status: batch.status,
    createdBy: batch.createdBy,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };
}

export async function getCollectorData(
  provider: ethers.Provider,
  batchId: number
): Promise<CollectorData> {
  const contract = getContractInstance(provider);
  return await contract.getCollectorData(batchId);
}

export async function getTesterData(
  provider: ethers.Provider,
  batchId: number
): Promise<TesterData> {
  const contract = getContractInstance(provider);
  return await contract.getTesterData(batchId);
}

export async function getProcessorData(
  provider: ethers.Provider,
  batchId: number
): Promise<ProcessorData> {
  const contract = getContractInstance(provider);
  return await contract.getProcessorData(batchId);
}

export async function getManufacturerData(
  provider: ethers.Provider,
  batchId: number
): Promise<ManufacturerData> {
  const contract = getContractInstance(provider);
  return await contract.getManufacturerData(batchId);
}

export async function getFullChain(
  provider: ethers.Provider,
  batchId: number
): Promise<FullChainData> {
  const contract = getContractInstance(provider);
  const result = await contract.getFullChain(batchId);

  return {
    batch: {
      batchNumber: result.batch.batchNumber,
      currentPhase: result.batch.currentPhase,
      status: result.batch.status,
      createdBy: result.batch.createdBy,
      createdAt: result.batch.createdAt,
      updatedAt: result.batch.updatedAt,
    },
    collector: result.collector,
    tester: result.tester,
    processor: result.processor,
    manufacturer: result.manufacturer,
  };
}

export async function getTotalBatches(provider: ethers.Provider): Promise<bigint> {
  const contract = getContractInstance(provider);
  return await contract.getTotalBatches();
}

export function encodeCollectorData(data: CollectorDataInput): string {
  const iface = getContractInterface();

  return iface.encodeFunctionData('addCollectorData', [
    data.batchNumber,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.humidity,
    data.harvestDate,
    data.seedCropName,
    data.pesticideUsed,
    data.pesticideName,
    data.pesticideQuantity,
    ethers.parseUnits(data.pricePerUnit.toString(), 0),
    ethers.parseUnits(data.weightTotal.toString(), 0),
    ethers.parseUnits(data.totalPrice.toString(), 0),
    data.qrCodeData,
  ]);
}

export function encodeTesterData(data: TesterDataInput): string {
  const iface = getContractInterface();

  return iface.encodeFunctionData('addTesterData', [
    data.collectorBatchId,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.humidity,
    data.testDate,
    ethers.parseUnits(data.qualityGradeScore.toString(), 0),
    ethers.parseUnits(data.contaminantLevel.toString(), 0),
    ethers.parseUnits(data.purityLevel.toString(), 0),
    data.labName,
    data.collectorRating,
    data.collectorRatingNotes,
    data.qrCodeData,
  ]);
}

export function encodeProcessorData(data: ProcessorDataInput): string {
  const iface = getContractInterface();

  return iface.encodeFunctionData('addProcessorData', [
    data.testerBatchId,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.processingType,
    ethers.parseUnits(data.inputWeight.toString(), 0),
    ethers.parseUnits(data.outputWeight.toString(), 0),
    ethers.parseUnits(data.conversionRatio.toString(), 0),
    data.chemicalsAdditives,
    data.testerRating,
    data.testerRatingNotes,
    data.qrCodeData,
  ]);
}

export function encodeManufacturerData(data: ManufacturerDataInput): string {
  const iface = getContractInterface();

  return iface.encodeFunctionData('addManufacturerData', [
    data.processorBatchId,
    convertToContractInt256(data.gpsLatitude),
    convertToContractInt256(data.gpsLongitude),
    data.weatherCondition,
    convertToContractInt16(data.temperature),
    data.productName,
    data.brandName,
    data.productType,
    ethers.parseUnits(data.quantity.toString(), 0),
    data.unit,
    data.location,
    data.manufactureDate,
    data.expiryDate,
    data.processorRating,
    data.processorRatingNotes,
    data.qrCodeData,
  ]);
}
