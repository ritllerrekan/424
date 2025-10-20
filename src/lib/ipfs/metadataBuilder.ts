import {
  METADATA_VERSION,
  CollectorBatchMetadata,
  TesterBatchMetadata,
  ProcessorBatchMetadata,
  ManufacturerBatchMetadata,
  WasteMetricsMetadata,
  QualityReportMetadata,
} from './schemas';

export class MetadataBuilder {
  static buildCollectorBatch(data: {
    batchId: string;
    batchNumber: string;
    collectorAddress: string;
    location: { latitude: number; longitude: number; address?: string };
    environmental: { weatherCondition: string; temperature: number; humidity: number };
    harvest: { harvestDate: string; seedCropName: string; weightTotal: number };
    pesticide: { used: boolean; name?: string; quantity?: string };
    pricing: { pricePerUnit: number; totalPrice: number };
    qrCodeData: string;
    images?: string[];
    documents?: string[];
    additionalData?: Record<string, any>;
  }): CollectorBatchMetadata {
    const now = new Date().toISOString();
    return {
      version: METADATA_VERSION,
      schemaType: 'collector-batch',
      createdAt: now,
      updatedAt: now,
      isValid: true,
      ...data,
    };
  }

  static buildTesterBatch(data: {
    batchId: string;
    testerAddress: string;
    collectorBatchId: string;
    location: { latitude: number; longitude: number; address?: string };
    environmental: { weatherCondition: string; temperature: number; humidity: number };
    testing: {
      testDate: string;
      qualityGradeScore: number;
      contaminantLevel: number;
      purityLevel: number;
      labName: string;
    };
    rating: { collectorRating: number; collectorRatingNotes: string };
    qrCodeData: string;
    images?: string[];
    documents?: string[];
    additionalData?: Record<string, any>;
  }): TesterBatchMetadata {
    const now = new Date().toISOString();
    return {
      version: METADATA_VERSION,
      schemaType: 'tester-batch',
      createdAt: now,
      updatedAt: now,
      isValid: true,
      ...data,
    };
  }

  static buildProcessorBatch(data: {
    batchId: string;
    processorAddress: string;
    testerBatchId: string;
    location: { latitude: number; longitude: number; address?: string };
    environmental: { weatherCondition: string; temperature: number };
    processing: {
      processingType: string;
      inputWeight: number;
      outputWeight: number;
      conversionRatio: number;
      chemicalsAdditives: string;
    };
    rating: { testerRating: number; testerRatingNotes: string };
    qrCodeData: string;
    images?: string[];
    documents?: string[];
    additionalData?: Record<string, any>;
  }): ProcessorBatchMetadata {
    const now = new Date().toISOString();
    return {
      version: METADATA_VERSION,
      schemaType: 'processor-batch',
      createdAt: now,
      updatedAt: now,
      isValid: true,
      ...data,
    };
  }

  static buildManufacturerBatch(data: {
    batchId: string;
    manufacturerAddress: string;
    processorBatchId: string;
    location: { latitude: number; longitude: number; address?: string };
    environmental: { weatherCondition: string; temperature: number };
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
    rating: { processorRating: number; processorRatingNotes: string };
    qrCodeData: string;
    images?: string[];
    documents?: string[];
    additionalData?: Record<string, any>;
  }): ManufacturerBatchMetadata {
    const now = new Date().toISOString();
    return {
      version: METADATA_VERSION,
      schemaType: 'manufacturer-batch',
      createdAt: now,
      updatedAt: now,
      isValid: true,
      ...data,
    };
  }

  static buildWasteMetrics(data: {
    metricsId: string;
    period: { startDate: string; endDate: string };
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
  }): WasteMetricsMetadata {
    const now = new Date().toISOString();
    return {
      version: METADATA_VERSION,
      schemaType: 'waste-metrics',
      createdAt: now,
      updatedAt: now,
      isValid: true,
      ...data,
    };
  }

  static buildQualityReport(data: {
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
  }): QualityReportMetadata {
    const now = new Date().toISOString();
    return {
      version: METADATA_VERSION,
      schemaType: 'quality-report',
      createdAt: now,
      updatedAt: now,
      isValid: true,
      ...data,
    };
  }
}
