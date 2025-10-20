export enum Phase {
  Collection = 0,
  Testing = 1,
  Processing = 2,
  Manufacturing = 3,
  Completed = 4,
}

export enum Status {
  Active = 0,
  Completed = 1,
  Rejected = 2,
}

export interface CollectorDataInput {
  batchNumber: string;
  gpsLatitude: number;
  gpsLongitude: number;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  harvestDate: string;
  seedCropName: string;
  pesticideUsed: boolean;
  pesticideName: string;
  pesticideQuantity: string;
  pricePerUnit: number;
  weightTotal: number;
  totalPrice: number;
  qrCodeData: string;
  ipfsHash?: string;
}

export interface TesterDataInput {
  collectorBatchId: number;
  gpsLatitude: number;
  gpsLongitude: number;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  testDate: string;
  qualityGradeScore: number;
  contaminantLevel: number;
  purityLevel: number;
  labName: string;
  collectorRating: number;
  collectorRatingNotes: string;
  qrCodeData: string;
  ipfsHash?: string;
}

export interface ProcessorDataInput {
  testerBatchId: number;
  gpsLatitude: number;
  gpsLongitude: number;
  weatherCondition: string;
  temperature: number;
  processingType: string;
  inputWeight: number;
  outputWeight: number;
  conversionRatio: number;
  chemicalsAdditives: string;
  testerRating: number;
  testerRatingNotes: string;
  qrCodeData: string;
  ipfsHash?: string;
}

export interface ManufacturerDataInput {
  processorBatchId: number;
  gpsLatitude: number;
  gpsLongitude: number;
  weatherCondition: string;
  temperature: number;
  productName: string;
  brandName: string;
  productType: string;
  quantity: number;
  unit: string;
  location: string;
  manufactureDate: string;
  expiryDate: string;
  processorRating: number;
  processorRatingNotes: string;
  qrCodeData: string;
  ipfsHash?: string;
}

export interface Batch {
  batchNumber: string;
  currentPhase: Phase;
  status: Status;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface CollectorData {
  batchId: bigint;
  collectorAddress: string;
  batchNumber: string;
  gpsLatitude: bigint;
  gpsLongitude: bigint;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  harvestDate: string;
  seedCropName: string;
  pesticideUsed: boolean;
  pesticideName: string;
  pesticideQuantity: string;
  pricePerUnit: bigint;
  weightTotal: bigint;
  totalPrice: bigint;
  qrCodeData: string;
  timestamp: bigint;
}

export interface TesterData {
  batchId: bigint;
  testerAddress: string;
  collectorBatchId: bigint;
  gpsLatitude: bigint;
  gpsLongitude: bigint;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  testDate: string;
  qualityGradeScore: bigint;
  contaminantLevel: bigint;
  purityLevel: bigint;
  labName: string;
  collectorRating: number;
  collectorRatingNotes: string;
  qrCodeData: string;
  timestamp: bigint;
}

export interface ProcessorData {
  batchId: bigint;
  processorAddress: string;
  testerBatchId: bigint;
  gpsLatitude: bigint;
  gpsLongitude: bigint;
  weatherCondition: string;
  temperature: number;
  processingType: string;
  inputWeight: bigint;
  outputWeight: bigint;
  conversionRatio: bigint;
  chemicalsAdditives: string;
  testerRating: number;
  testerRatingNotes: string;
  qrCodeData: string;
  timestamp: bigint;
}

export interface ManufacturerData {
  batchId: bigint;
  manufacturerAddress: string;
  processorBatchId: bigint;
  gpsLatitude: bigint;
  gpsLongitude: bigint;
  weatherCondition: string;
  temperature: number;
  productName: string;
  brandName: string;
  productType: string;
  quantity: bigint;
  unit: string;
  location: string;
  manufactureDate: string;
  expiryDate: string;
  processorRating: number;
  processorRatingNotes: string;
  qrCodeData: string;
  timestamp: bigint;
}

export interface FullChainData {
  batch: Batch;
  collector: CollectorData;
  tester: TesterData;
  processor: ProcessorData;
  manufacturer: ManufacturerData;
}
