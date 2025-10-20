import {
  AnyMetadata,
  CollectorBatchMetadata,
  TesterBatchMetadata,
  ProcessorBatchMetadata,
  ManufacturerBatchMetadata,
  WasteMetricsMetadata,
  QualityReportMetadata,
  METADATA_VERSION,
} from './schemas';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class MetadataValidator {
  static validateBase(metadata: AnyMetadata): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!metadata.version) {
      errors.push({
        field: 'version',
        message: 'Version is required',
        severity: 'error',
      });
    }

    if (metadata.version !== METADATA_VERSION) {
      errors.push({
        field: 'version',
        message: `Version mismatch. Expected ${METADATA_VERSION}, got ${metadata.version}`,
        severity: 'warning',
      });
    }

    if (!metadata.schemaType) {
      errors.push({
        field: 'schemaType',
        message: 'Schema type is required',
        severity: 'error',
      });
    }

    if (!metadata.createdAt) {
      errors.push({
        field: 'createdAt',
        message: 'Created timestamp is required',
        severity: 'error',
      });
    }

    if (!metadata.updatedAt) {
      errors.push({
        field: 'updatedAt',
        message: 'Updated timestamp is required',
        severity: 'error',
      });
    }

    return errors;
  }

  static validateCollectorBatch(metadata: CollectorBatchMetadata): ValidationResult {
    const errors: ValidationError[] = [...this.validateBase(metadata)];
    const warnings: ValidationError[] = [];

    if (!metadata.batchId) {
      errors.push({ field: 'batchId', message: 'Batch ID is required', severity: 'error' });
    }

    if (!metadata.batchNumber) {
      errors.push({
        field: 'batchNumber',
        message: 'Batch number is required',
        severity: 'error',
      });
    }

    if (!metadata.collectorAddress) {
      errors.push({
        field: 'collectorAddress',
        message: 'Collector address is required',
        severity: 'error',
      });
    }

    if (!metadata.location || typeof metadata.location.latitude !== 'number') {
      errors.push({ field: 'location.latitude', message: 'Valid latitude is required', severity: 'error' });
    }

    if (!metadata.location || typeof metadata.location.longitude !== 'number') {
      errors.push({ field: 'location.longitude', message: 'Valid longitude is required', severity: 'error' });
    }

    if (!metadata.environmental?.weatherCondition) {
      warnings.push({
        field: 'environmental.weatherCondition',
        message: 'Weather condition is recommended',
        severity: 'warning',
      });
    }

    if (!metadata.harvest?.seedCropName) {
      errors.push({
        field: 'harvest.seedCropName',
        message: 'Seed/crop name is required',
        severity: 'error',
      });
    }

    if (!metadata.harvest?.weightTotal || metadata.harvest.weightTotal <= 0) {
      errors.push({
        field: 'harvest.weightTotal',
        message: 'Valid weight total is required',
        severity: 'error',
      });
    }

    if (metadata.pesticide?.used && !metadata.pesticide?.name) {
      warnings.push({
        field: 'pesticide.name',
        message: 'Pesticide name should be provided when pesticide is used',
        severity: 'warning',
      });
    }

    if (!metadata.pricing?.pricePerUnit || metadata.pricing.pricePerUnit <= 0) {
      errors.push({
        field: 'pricing.pricePerUnit',
        message: 'Valid price per unit is required',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateTesterBatch(metadata: TesterBatchMetadata): ValidationResult {
    const errors: ValidationError[] = [...this.validateBase(metadata)];
    const warnings: ValidationError[] = [];

    if (!metadata.batchId) {
      errors.push({ field: 'batchId', message: 'Batch ID is required', severity: 'error' });
    }

    if (!metadata.testerAddress) {
      errors.push({
        field: 'testerAddress',
        message: 'Tester address is required',
        severity: 'error',
      });
    }

    if (!metadata.collectorBatchId) {
      errors.push({
        field: 'collectorBatchId',
        message: 'Collector batch ID is required',
        severity: 'error',
      });
    }

    if (!metadata.testing?.qualityGradeScore || metadata.testing.qualityGradeScore < 0) {
      errors.push({
        field: 'testing.qualityGradeScore',
        message: 'Valid quality grade score is required',
        severity: 'error',
      });
    }

    if (metadata.testing?.contaminantLevel > 100) {
      errors.push({
        field: 'testing.contaminantLevel',
        message: 'Contaminant level cannot exceed 100',
        severity: 'error',
      });
    }

    if (metadata.testing?.purityLevel > 100) {
      errors.push({
        field: 'testing.purityLevel',
        message: 'Purity level cannot exceed 100',
        severity: 'error',
      });
    }

    if (!metadata.testing?.labName) {
      warnings.push({
        field: 'testing.labName',
        message: 'Lab name is recommended',
        severity: 'warning',
      });
    }

    if (metadata.rating?.collectorRating < 1 || metadata.rating?.collectorRating > 5) {
      errors.push({
        field: 'rating.collectorRating',
        message: 'Rating must be between 1 and 5',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateProcessorBatch(metadata: ProcessorBatchMetadata): ValidationResult {
    const errors: ValidationError[] = [...this.validateBase(metadata)];
    const warnings: ValidationError[] = [];

    if (!metadata.batchId) {
      errors.push({ field: 'batchId', message: 'Batch ID is required', severity: 'error' });
    }

    if (!metadata.processorAddress) {
      errors.push({
        field: 'processorAddress',
        message: 'Processor address is required',
        severity: 'error',
      });
    }

    if (!metadata.testerBatchId) {
      errors.push({
        field: 'testerBatchId',
        message: 'Tester batch ID is required',
        severity: 'error',
      });
    }

    if (!metadata.processing?.processingType) {
      errors.push({
        field: 'processing.processingType',
        message: 'Processing type is required',
        severity: 'error',
      });
    }

    if (!metadata.processing?.inputWeight || metadata.processing.inputWeight <= 0) {
      errors.push({
        field: 'processing.inputWeight',
        message: 'Valid input weight is required',
        severity: 'error',
      });
    }

    if (!metadata.processing?.outputWeight || metadata.processing.outputWeight <= 0) {
      errors.push({
        field: 'processing.outputWeight',
        message: 'Valid output weight is required',
        severity: 'error',
      });
    }

    if (metadata.processing?.outputWeight > metadata.processing?.inputWeight) {
      warnings.push({
        field: 'processing.outputWeight',
        message: 'Output weight exceeds input weight',
        severity: 'warning',
      });
    }

    if (metadata.rating?.testerRating < 1 || metadata.rating?.testerRating > 5) {
      errors.push({
        field: 'rating.testerRating',
        message: 'Rating must be between 1 and 5',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateManufacturerBatch(metadata: ManufacturerBatchMetadata): ValidationResult {
    const errors: ValidationError[] = [...this.validateBase(metadata)];
    const warnings: ValidationError[] = [];

    if (!metadata.batchId) {
      errors.push({ field: 'batchId', message: 'Batch ID is required', severity: 'error' });
    }

    if (!metadata.manufacturerAddress) {
      errors.push({
        field: 'manufacturerAddress',
        message: 'Manufacturer address is required',
        severity: 'error',
      });
    }

    if (!metadata.processorBatchId) {
      errors.push({
        field: 'processorBatchId',
        message: 'Processor batch ID is required',
        severity: 'error',
      });
    }

    if (!metadata.product?.productName) {
      errors.push({
        field: 'product.productName',
        message: 'Product name is required',
        severity: 'error',
      });
    }

    if (!metadata.product?.brandName) {
      errors.push({
        field: 'product.brandName',
        message: 'Brand name is required',
        severity: 'error',
      });
    }

    if (!metadata.product?.quantity || metadata.product.quantity <= 0) {
      errors.push({
        field: 'product.quantity',
        message: 'Valid quantity is required',
        severity: 'error',
      });
    }

    if (!metadata.product?.manufactureDate) {
      errors.push({
        field: 'product.manufactureDate',
        message: 'Manufacture date is required',
        severity: 'error',
      });
    }

    if (!metadata.product?.expiryDate) {
      warnings.push({
        field: 'product.expiryDate',
        message: 'Expiry date is recommended',
        severity: 'warning',
      });
    }

    if (
      metadata.product?.manufactureDate &&
      metadata.product?.expiryDate &&
      new Date(metadata.product.expiryDate) <= new Date(metadata.product.manufactureDate)
    ) {
      errors.push({
        field: 'product.expiryDate',
        message: 'Expiry date must be after manufacture date',
        severity: 'error',
      });
    }

    if (metadata.rating?.processorRating < 1 || metadata.rating?.processorRating > 5) {
      errors.push({
        field: 'rating.processorRating',
        message: 'Rating must be between 1 and 5',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateWasteMetrics(metadata: WasteMetricsMetadata): ValidationResult {
    const errors: ValidationError[] = [...this.validateBase(metadata)];
    const warnings: ValidationError[] = [];

    if (!metadata.metricsId) {
      errors.push({ field: 'metricsId', message: 'Metrics ID is required', severity: 'error' });
    }

    if (!metadata.period?.startDate) {
      errors.push({
        field: 'period.startDate',
        message: 'Start date is required',
        severity: 'error',
      });
    }

    if (!metadata.period?.endDate) {
      errors.push({
        field: 'period.endDate',
        message: 'End date is required',
        severity: 'error',
      });
    }

    if (
      metadata.period?.startDate &&
      metadata.period?.endDate &&
      new Date(metadata.period.endDate) <= new Date(metadata.period.startDate)
    ) {
      errors.push({
        field: 'period.endDate',
        message: 'End date must be after start date',
        severity: 'error',
      });
    }

    if (!metadata.aggregation || typeof metadata.aggregation.totalBatches !== 'number') {
      errors.push({
        field: 'aggregation.totalBatches',
        message: 'Total batches is required',
        severity: 'error',
      });
    }

    if (metadata.aggregation?.wastePercentage > 100) {
      errors.push({
        field: 'aggregation.wastePercentage',
        message: 'Waste percentage cannot exceed 100',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateQualityReport(metadata: QualityReportMetadata): ValidationResult {
    const errors: ValidationError[] = [...this.validateBase(metadata)];
    const warnings: ValidationError[] = [];

    if (!metadata.reportId) {
      errors.push({ field: 'reportId', message: 'Report ID is required', severity: 'error' });
    }

    if (!metadata.batchId) {
      errors.push({ field: 'batchId', message: 'Batch ID is required', severity: 'error' });
    }

    if (!metadata.reportType) {
      errors.push({
        field: 'reportType',
        message: 'Report type is required',
        severity: 'error',
      });
    }

    if (!metadata.createdBy) {
      errors.push({
        field: 'createdBy',
        message: 'Creator address is required',
        severity: 'error',
      });
    }

    if (!metadata.summary) {
      errors.push({ field: 'summary', message: 'Summary is required', severity: 'error' });
    }

    if (metadata.summary?.overallScore < 0 || metadata.summary?.overallScore > 100) {
      errors.push({
        field: 'summary.overallScore',
        message: 'Overall score must be between 0 and 100',
        severity: 'error',
      });
    }

    if (!metadata.testResults || metadata.testResults.length === 0) {
      warnings.push({
        field: 'testResults',
        message: 'Test results are recommended',
        severity: 'warning',
      });
    }

    if (!metadata.compliance?.standards || metadata.compliance.standards.length === 0) {
      warnings.push({
        field: 'compliance.standards',
        message: 'Compliance standards are recommended',
        severity: 'warning',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validate(metadata: AnyMetadata): ValidationResult {
    switch (metadata.schemaType) {
      case 'collector-batch':
        return this.validateCollectorBatch(metadata as CollectorBatchMetadata);
      case 'tester-batch':
        return this.validateTesterBatch(metadata as TesterBatchMetadata);
      case 'processor-batch':
        return this.validateProcessorBatch(metadata as ProcessorBatchMetadata);
      case 'manufacturer-batch':
        return this.validateManufacturerBatch(metadata as ManufacturerBatchMetadata);
      case 'waste-metrics':
        return this.validateWasteMetrics(metadata as WasteMetricsMetadata);
      case 'quality-report':
        return this.validateQualityReport(metadata as QualityReportMetadata);
      default:
        return {
          isValid: false,
          errors: [
            {
              field: 'schemaType',
              message: `Unknown schema type: ${metadata.schemaType}`,
              severity: 'error',
            },
          ],
          warnings: [],
        };
    }
  }
}
