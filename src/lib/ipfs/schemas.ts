export const METADATA_VERSION = '1.0.0';

export interface BaseMetadata {
  version: string;
  schemaType: string;
  createdAt: string;
  updatedAt: string;
  isValid: boolean;
}

export interface CollectorBatchMetadata extends BaseMetadata {
  schemaType: 'collector-batch';
  batchId: string;
  batchNumber: string;
  collectorAddress: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  environmental: {
    weatherCondition: string;
    temperature: number;
    humidity: number;
  };
  harvest: {
    harvestDate: string;
    seedCropName: string;
    weightTotal: number;
  };
  pesticide: {
    used: boolean;
    name?: string;
    quantity?: string;
  };
  pricing: {
    pricePerUnit: number;
    totalPrice: number;
  };
  qrCodeData: string;
  images?: string[];
  documents?: string[];
  additionalData?: Record<string, any>;
}

export interface TesterBatchMetadata extends BaseMetadata {
  schemaType: 'tester-batch';
  batchId: string;
  testerAddress: string;
  collectorBatchId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  environmental: {
    weatherCondition: string;
    temperature: number;
    humidity: number;
  };
  testing: {
    testDate: string;
    qualityGradeScore: number;
    contaminantLevel: number;
    purityLevel: number;
    labName: string;
  };
  rating: {
    collectorRating: number;
    collectorRatingNotes: string;
  };
  qrCodeData: string;
  images?: string[];
  documents?: string[];
  additionalData?: Record<string, any>;
}

export interface ProcessorBatchMetadata extends BaseMetadata {
  schemaType: 'processor-batch';
  batchId: string;
  processorAddress: string;
  testerBatchId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  environmental: {
    weatherCondition: string;
    temperature: number;
  };
  processing: {
    processingType: string;
    inputWeight: number;
    outputWeight: number;
    conversionRatio: number;
    chemicalsAdditives: string;
  };
  rating: {
    testerRating: number;
    testerRatingNotes: string;
  };
  qrCodeData: string;
  images?: string[];
  documents?: string[];
  additionalData?: Record<string, any>;
}

export interface ManufacturerBatchMetadata extends BaseMetadata {
  schemaType: 'manufacturer-batch';
  batchId: string;
  manufacturerAddress: string;
  processorBatchId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  environmental: {
    weatherCondition: string;
    temperature: number;
  };
  product: {
    productName: string;
    brandName: string;
    productType: string;
    quantity: number;
    unit: string;
    location: string;
    manufactureDate: string;
    expiryDate: string;
  };
  rating: {
    processorRating: number;
    processorRatingNotes: string;
  };
  qrCodeData: string;
  images?: string[];
  documents?: string[];
  additionalData?: Record<string, any>;
}

export interface WasteMetricsMetadata extends BaseMetadata {
  schemaType: 'waste-metrics';
  metricsId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  aggregation: {
    totalBatches: number;
    totalWeight: number;
    totalWaste: number;
    wastePercentage: number;
  };
  breakdown: {
    collectionWaste: number;
    testingWaste: number;
    processingWaste: number;
    manufacturingWaste: number;
  };
  trends: {
    wasteByMonth: Array<{ month: string; waste: number }>;
    topWasteSources: Array<{ source: string; amount: number }>;
  };
  recommendations?: string[];
  charts?: string[];
  additionalData?: Record<string, any>;
}

export interface QualityReportMetadata extends BaseMetadata {
  schemaType: 'quality-report';
  reportId: string;
  batchId: string;
  reportType: 'testing' | 'processing' | 'manufacturing' | 'final';
  createdBy: string;
  reportDate: string;
  summary: {
    overallScore: number;
    passed: boolean;
    criticalIssues: number;
    warnings: number;
  };
  testResults: Array<{
    testName: string;
    result: string;
    passed: boolean;
    value?: number;
    threshold?: number;
    notes?: string;
  }>;
  compliance: {
    standards: string[];
    certifications: string[];
    verified: boolean;
  };
  qualityIndicators: {
    appearance: number;
    color: number;
    texture: number;
    smell: number;
    overall: number;
  };
  defects?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  recommendations?: string[];
  images?: string[];
  documents?: string[];
  additionalData?: Record<string, any>;
}

export type AnyBatchMetadata =
  | CollectorBatchMetadata
  | TesterBatchMetadata
  | ProcessorBatchMetadata
  | ManufacturerBatchMetadata;

export type AnyMetadata =
  | AnyBatchMetadata
  | WasteMetricsMetadata
  | QualityReportMetadata;

export interface MetadataSearchQuery {
  schemaType?: string;
  batchId?: string;
  address?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  tags?: string[];
  version?: string;
}
