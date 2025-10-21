import { ethers } from 'ethers';
import { QRCodeData } from './qrCodeService';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const RPC_URL = 'https://sepolia.base.org';

const CONTRACT_ABI = [
  'function getBatch(uint256 _batchId) view returns (tuple(string batchNumber, uint8 currentPhase, uint8 status, address createdBy, uint256 createdAt, uint256 updatedAt))',
  'function getCollectorData(uint256 _batchId) view returns (tuple(uint256 batchId, address collectorAddress, string batchNumber, int256 gpsLatitude, int256 gpsLongitude, string weatherCondition, int16 temperature, uint8 humidity, string harvestDate, string seedCropName, bool pesticideUsed, string pesticideName, string pesticideQuantity, uint256 pricePerUnit, uint256 weightTotal, uint256 totalPrice, string qrCodeData, uint256 timestamp))',
  'function getTesterData(uint256 _batchId) view returns (tuple(uint256 batchId, address testerAddress, uint256 collectorBatchId, int256 gpsLatitude, int256 gpsLongitude, string weatherCondition, int16 temperature, uint8 humidity, string testDate, uint256 qualityGradeScore, uint256 contaminantLevel, uint256 purityLevel, string labName, uint8 collectorRating, string collectorRatingNotes, string qrCodeData, uint256 timestamp))',
  'function getProcessorData(uint256 _batchId) view returns (tuple(uint256 batchId, address processorAddress, uint256 testerBatchId, int256 gpsLatitude, int256 gpsLongitude, string weatherCondition, int16 temperature, string processingType, uint256 inputWeight, uint256 outputWeight, uint256 conversionRatio, string chemicalsAdditives, uint8 testerRating, string testerRatingNotes, string qrCodeData, uint256 timestamp))',
  'function getManufacturerData(uint256 _batchId) view returns (tuple(uint256 batchId, address manufacturerAddress, uint256 processorBatchId, int256 gpsLatitude, int256 gpsLongitude, string weatherCondition, int16 temperature, string productName, string brandName, string productType, uint256 quantity, string unit, string location, string manufactureDate, string expiryDate, uint8 processorRating, string processorRatingNotes, string qrCodeData, uint256 timestamp))',
  'function getTotalBatches() view returns (uint256)'
];

export interface BatchInfo {
  batchNumber: string;
  currentPhase: number;
  status: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface CollectorData {
  batchId: string;
  collectorAddress: string;
  batchNumber: string;
  gpsLatitude: string;
  gpsLongitude: string;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  harvestDate: string;
  seedCropName: string;
  pesticideUsed: boolean;
  pesticideName: string;
  pesticideQuantity: string;
  pricePerUnit: string;
  weightTotal: string;
  totalPrice: string;
  qrCodeData: string;
  timestamp: number;
}

export interface TesterData {
  batchId: string;
  testerAddress: string;
  collectorBatchId: string;
  gpsLatitude: string;
  gpsLongitude: string;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  testDate: string;
  qualityGradeScore: string;
  contaminantLevel: string;
  purityLevel: string;
  labName: string;
  collectorRating: number;
  collectorRatingNotes: string;
  qrCodeData: string;
  timestamp: number;
}

export interface ProcessorData {
  batchId: string;
  processorAddress: string;
  testerBatchId: string;
  gpsLatitude: string;
  gpsLongitude: string;
  weatherCondition: string;
  temperature: number;
  processingType: string;
  inputWeight: string;
  outputWeight: string;
  conversionRatio: string;
  chemicalsAdditives: string;
  testerRating: number;
  testerRatingNotes: string;
  qrCodeData: string;
  timestamp: number;
}

export interface ManufacturerData {
  batchId: string;
  manufacturerAddress: string;
  processorBatchId: string;
  gpsLatitude: string;
  gpsLongitude: string;
  weatherCondition: string;
  temperature: number;
  productName: string;
  brandName: string;
  productType: string;
  quantity: string;
  unit: string;
  location: string;
  manufactureDate: string;
  expiryDate: string;
  processorRating: number;
  processorRatingNotes: string;
  qrCodeData: string;
  timestamp: number;
}

export interface FullSupplyChain {
  batch: BatchInfo;
  collector?: CollectorData;
  tester?: TesterData;
  processor?: ProcessorData;
  manufacturer?: ManufacturerData;
}

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getContract(): ethers.Contract {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function getBatchInfo(batchId: string): Promise<BatchInfo | null> {
  try {
    const contract = getContract();
    const batch = await contract.getBatch(batchId);

    return {
      batchNumber: batch.batchNumber,
      currentPhase: Number(batch.currentPhase),
      status: Number(batch.status),
      createdBy: batch.createdBy,
      createdAt: Number(batch.createdAt),
      updatedAt: Number(batch.updatedAt)
    };
  } catch (error) {
    console.error('Error fetching batch info:', error);
    return null;
  }
}

export async function getCollectorData(batchId: string): Promise<CollectorData | null> {
  try {
    const contract = getContract();
    const data = await contract.getCollectorData(batchId);

    return {
      batchId: data.batchId.toString(),
      collectorAddress: data.collectorAddress,
      batchNumber: data.batchNumber,
      gpsLatitude: data.gpsLatitude.toString(),
      gpsLongitude: data.gpsLongitude.toString(),
      weatherCondition: data.weatherCondition,
      temperature: Number(data.temperature),
      humidity: Number(data.humidity),
      harvestDate: data.harvestDate,
      seedCropName: data.seedCropName,
      pesticideUsed: data.pesticideUsed,
      pesticideName: data.pesticideName,
      pesticideQuantity: data.pesticideQuantity,
      pricePerUnit: ethers.formatEther(data.pricePerUnit),
      weightTotal: data.weightTotal.toString(),
      totalPrice: ethers.formatEther(data.totalPrice),
      qrCodeData: data.qrCodeData,
      timestamp: Number(data.timestamp)
    };
  } catch (error) {
    console.error('Error fetching collector data:', error);
    return null;
  }
}

export async function getTesterData(batchId: string): Promise<TesterData | null> {
  try {
    const contract = getContract();
    const data = await contract.getTesterData(batchId);

    return {
      batchId: data.batchId.toString(),
      testerAddress: data.testerAddress,
      collectorBatchId: data.collectorBatchId.toString(),
      gpsLatitude: data.gpsLatitude.toString(),
      gpsLongitude: data.gpsLongitude.toString(),
      weatherCondition: data.weatherCondition,
      temperature: Number(data.temperature),
      humidity: Number(data.humidity),
      testDate: data.testDate,
      qualityGradeScore: data.qualityGradeScore.toString(),
      contaminantLevel: data.contaminantLevel.toString(),
      purityLevel: data.purityLevel.toString(),
      labName: data.labName,
      collectorRating: Number(data.collectorRating),
      collectorRatingNotes: data.collectorRatingNotes,
      qrCodeData: data.qrCodeData,
      timestamp: Number(data.timestamp)
    };
  } catch (error) {
    console.error('Error fetching tester data:', error);
    return null;
  }
}

export async function getProcessorData(batchId: string): Promise<ProcessorData | null> {
  try {
    const contract = getContract();
    const data = await contract.getProcessorData(batchId);

    return {
      batchId: data.batchId.toString(),
      processorAddress: data.processorAddress,
      testerBatchId: data.testerBatchId.toString(),
      gpsLatitude: data.gpsLatitude.toString(),
      gpsLongitude: data.gpsLongitude.toString(),
      weatherCondition: data.weatherCondition,
      temperature: Number(data.temperature),
      processingType: data.processingType,
      inputWeight: data.inputWeight.toString(),
      outputWeight: data.outputWeight.toString(),
      conversionRatio: data.conversionRatio.toString(),
      chemicalsAdditives: data.chemicalsAdditives,
      testerRating: Number(data.testerRating),
      testerRatingNotes: data.testerRatingNotes,
      qrCodeData: data.qrCodeData,
      timestamp: Number(data.timestamp)
    };
  } catch (error) {
    console.error('Error fetching processor data:', error);
    return null;
  }
}

export async function getManufacturerData(batchId: string): Promise<ManufacturerData | null> {
  try {
    const contract = getContract();
    const data = await contract.getManufacturerData(batchId);

    return {
      batchId: data.batchId.toString(),
      manufacturerAddress: data.manufacturerAddress,
      processorBatchId: data.processorBatchId.toString(),
      gpsLatitude: data.gpsLatitude.toString(),
      gpsLongitude: data.gpsLongitude.toString(),
      weatherCondition: data.weatherCondition,
      temperature: Number(data.temperature),
      productName: data.productName,
      brandName: data.brandName,
      productType: data.productType,
      quantity: data.quantity.toString(),
      unit: data.unit,
      location: data.location,
      manufactureDate: data.manufactureDate,
      expiryDate: data.expiryDate,
      processorRating: Number(data.processorRating),
      processorRatingNotes: data.processorRatingNotes,
      qrCodeData: data.qrCodeData,
      timestamp: Number(data.timestamp)
    };
  } catch (error) {
    console.error('Error fetching manufacturer data:', error);
    return null;
  }
}

export async function getFullSupplyChain(batchId: string): Promise<FullSupplyChain | null> {
  try {
    const batch = await getBatchInfo(batchId);
    if (!batch) {
      return null;
    }

    const collector = await getCollectorData(batchId);
    const tester = await getTesterData(batchId);
    const processor = await getProcessorData(batchId);
    const manufacturer = await getManufacturerData(batchId);

    return {
      batch,
      collector: collector || undefined,
      tester: tester || undefined,
      processor: processor || undefined,
      manufacturer: manufacturer || undefined
    };
  } catch (error) {
    console.error('Error fetching full supply chain:', error);
    return null;
  }
}

export async function getSupplyChainFromQRCode(qrData: QRCodeData): Promise<FullSupplyChain | null> {
  return getFullSupplyChain(qrData.batchId);
}

export async function validateBatchExists(batchId: string): Promise<boolean> {
  try {
    const batch = await getBatchInfo(batchId);
    return batch !== null;
  } catch (error) {
    console.error('Error validating batch:', error);
    return false;
  }
}

export function getPhaseLabel(phase: number): string {
  const phases = ['Collection', 'Testing', 'Processing', 'Manufacturing', 'Completed'];
  return phases[phase] || 'Unknown';
}

export function getStatusLabel(status: number): string {
  const statuses = ['Active', 'Completed', 'Rejected'];
  return statuses[status] || 'Unknown';
}

export async function getTotalBatches(): Promise<number> {
  try {
    const contract = getContract();
    const total = await contract.getTotalBatches();
    return Number(total);
  } catch (error) {
    console.error('Error fetching total batches:', error);
    return 0;
  }
}
