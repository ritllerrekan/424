# IPFS Metadata Management System

Complete guide for managing IPFS metadata in the Food Supply Chain application.

## Overview

The IPFS Metadata Management System provides:
- Structured metadata schemas for batches, waste metrics, and quality reports
- Metadata validation and sanitization
- Metadata versioning and history tracking
- Metadata search and indexing
- Handling of corrupted or missing IPFS data
- Metadata retrieval and parsing

## Table of Contents

1. [Metadata Schemas](#metadata-schemas)
2. [Building Metadata](#building-metadata)
3. [Validating Metadata](#validating-metadata)
4. [Uploading Metadata](#uploading-metadata)
5. [Retrieving Metadata](#retrieving-metadata)
6. [Versioning Metadata](#versioning-metadata)
7. [Searching Metadata](#searching-metadata)
8. [Handling Errors](#handling-errors)

## Metadata Schemas

### Collector Batch Metadata

```typescript
import { MetadataBuilder } from '@/lib/ipfs';

const collectorMetadata = MetadataBuilder.buildCollectorBatch({
  batchId: '1',
  batchNumber: 'BATCH-2024-001',
  collectorAddress: '0x123...',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'San Francisco, CA'
  },
  environmental: {
    weatherCondition: 'Sunny',
    temperature: 22,
    humidity: 65
  },
  harvest: {
    harvestDate: '2024-10-20',
    seedCropName: 'Organic Tomatoes',
    weightTotal: 500
  },
  pesticide: {
    used: false
  },
  pricing: {
    pricePerUnit: 2.5,
    totalPrice: 1250
  },
  qrCodeData: 'QR-BATCH-001',
  images: ['QmImage1...', 'QmImage2...'],
  documents: ['QmDoc1...']
});
```

### Tester Batch Metadata

```typescript
const testerMetadata = MetadataBuilder.buildTesterBatch({
  batchId: '2',
  testerAddress: '0x456...',
  collectorBatchId: '1',
  location: {
    latitude: 37.7749,
    longitude: -122.4194
  },
  environmental: {
    weatherCondition: 'Cloudy',
    temperature: 20,
    humidity: 70
  },
  testing: {
    testDate: '2024-10-21',
    qualityGradeScore: 95,
    contaminantLevel: 2,
    purityLevel: 98,
    labName: 'Quality Labs Inc'
  },
  rating: {
    collectorRating: 5,
    collectorRatingNotes: 'Excellent quality produce'
  },
  qrCodeData: 'QR-TEST-002'
});
```

### Waste Metrics Metadata

```typescript
const wasteMetrics = MetadataBuilder.buildWasteMetrics({
  metricsId: 'WM-2024-Q1',
  period: {
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  },
  aggregation: {
    totalBatches: 150,
    totalWeight: 75000,
    totalWaste: 3750,
    wastePercentage: 5
  },
  breakdown: {
    collectionWaste: 1500,
    testingWaste: 750,
    processingWaste: 1000,
    manufacturingWaste: 500
  },
  trends: {
    wasteByMonth: [
      { month: '2024-01', waste: 1200 },
      { month: '2024-02', waste: 1250 },
      { month: '2024-03', waste: 1300 }
    ],
    topWasteSources: [
      { source: 'Collection', amount: 1500 },
      { source: 'Processing', amount: 1000 }
    ]
  },
  recommendations: [
    'Improve collection handling',
    'Optimize processing techniques'
  ]
});
```

### Quality Report Metadata

```typescript
const qualityReport = MetadataBuilder.buildQualityReport({
  reportId: 'QR-2024-001',
  batchId: '2',
  reportType: 'testing',
  createdBy: '0x789...',
  reportDate: '2024-10-21',
  summary: {
    overallScore: 95,
    passed: true,
    criticalIssues: 0,
    warnings: 1
  },
  testResults: [
    {
      testName: 'Pesticide Residue',
      result: 'Pass',
      passed: true,
      value: 0.5,
      threshold: 1.0,
      notes: 'Well below threshold'
    },
    {
      testName: 'Microbial Count',
      result: 'Pass',
      passed: true,
      value: 100,
      threshold: 1000
    }
  ],
  compliance: {
    standards: ['FDA', 'USDA Organic'],
    certifications: ['CERT-2024-001'],
    verified: true
  },
  qualityIndicators: {
    appearance: 95,
    color: 98,
    texture: 92,
    smell: 96,
    overall: 95
  },
  defects: [],
  recommendations: ['Continue current practices']
});
```

## Building Metadata

Use the `MetadataBuilder` class to create properly structured metadata:

```typescript
import { MetadataBuilder } from '@/lib/ipfs';

const metadata = MetadataBuilder.buildCollectorBatch({
  // ... your data
});
```

All builders automatically add:
- Version number
- Schema type
- Created timestamp
- Updated timestamp
- Validation flag

## Validating Metadata

### Basic Validation

```typescript
import { MetadataValidator } from '@/lib/ipfs';

const validation = MetadataValidator.validate(metadata);

if (validation.isValid) {
  console.log('Metadata is valid!');
} else {
  console.error('Validation errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

### Validation Result Structure

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; severity: 'error' }>;
  warnings: Array<{ field: string; message: string; severity: 'warning' }>;
}
```

## Uploading Metadata

### Simple Upload

```typescript
import { MetadataManager } from '@/lib/ipfs';

const result = await MetadataManager.uploadMetadata(metadata, {
  validate: true,
  name: 'collector-batch-1',
  keyvalues: {
    batchNumber: 'BATCH-001',
    phase: 'collection'
  }
});

console.log('Uploaded to IPFS:', result.cid);
```

### Upload with Versioning

```typescript
const { result, versioned } = await MetadataManager.uploadVersionedMetadata(
  metadata,
  existingVersioned,
  '0x123...', // updatedBy
  'Updated harvest weight', // changeLog
  { validate: true }
);

console.log('New version CID:', result.cid);
console.log('Version history:', versioned.history);
```

## Retrieving Metadata

### Retrieve Single Metadata

```typescript
import { MetadataManager } from '@/lib/ipfs';

const parsed = await MetadataManager.retrieveMetadata('QmCID...', true);

if (parsed.isValid && !parsed.isCorrupted) {
  console.log('Metadata:', parsed.metadata);
} else {
  console.error('Errors:', parsed.errors);
}
```

### Retrieve Multiple Metadata

```typescript
const cids = ['QmCID1...', 'QmCID2...', 'QmCID3...'];
const parsedBatch = await MetadataManager.retrieveBatch(cids, true);

parsedBatch.forEach(parsed => {
  if (parsed.isValid) {
    console.log(`${parsed.cid}:`, parsed.metadata.schemaType);
  }
});
```

### Handle Corrupted Data

```typescript
import { parseMissingIPFSData } from '@/lib/ipfs';

const parsed = await parseMissingIPFSData('QmCID...');

if (parsed) {
  console.log('Retrieved after retries:', parsed.metadata);
} else {
  console.error('Failed to retrieve after multiple attempts');
}
```

## Versioning Metadata

### Create Versioned Metadata

```typescript
import { MetadataVersionManager } from '@/lib/ipfs';

const versioned = MetadataVersionManager.createVersionedMetadata(
  metadata,
  'QmCID...',
  '0x123...', // updatedBy
  'Initial version'
);
```

### Add New Version

```typescript
const updated = MetadataVersionManager.addVersion(
  versioned,
  newMetadata,
  'QmNewCID...',
  '0x456...',
  'Updated quality scores'
);
```

### Get Version History

```typescript
const history = MetadataVersionManager.getVersionHistory(versioned);

history.forEach(version => {
  console.log(`${version.updatedAt}: ${version.changeLog}`);
  console.log(`CID: ${version.cid}`);
});
```

### Compare Versions

```typescript
const comparison = MetadataVersionManager.compareVersions(
  versioned,
  'QmCID1...',
  'QmCID2...'
);

console.log('Time difference:', comparison.timeDifference);
console.log('Older version:', comparison.older);
console.log('Newer version:', comparison.newer);
```

### Rollback to Previous Version

```typescript
const rolledBack = MetadataVersionManager.rollbackToVersion(
  versioned,
  'QmOldCID...',
  '0x789...',
  'Reverting to previous version due to error'
);
```

## Searching Metadata

### Build Search Index

```typescript
import { MetadataManager } from '@/lib/ipfs';

const cids = ['QmCID1...', 'QmCID2...', 'QmCID3...'];
await MetadataManager.buildSearchIndex(cids);
```

### Search by Schema Type

```typescript
const results = await MetadataManager.searchMetadata({
  schemaType: 'collector-batch'
}, {
  sortBy: 'date',
  sortOrder: 'desc',
  limit: 10
});

results.forEach(result => {
  console.log(`Score: ${result.relevanceScore}`);
  console.log(`Batch:`, result.metadata);
});
```

### Search by Batch ID

```typescript
const results = await MetadataManager.searchMetadata({
  batchId: '123'
});
```

### Search by Address

```typescript
const results = await MetadataManager.searchMetadata({
  address: '0x123...'
});
```

### Search by Date Range

```typescript
const results = await MetadataManager.searchMetadata({
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  }
});
```

### Full-Text Search

```typescript
const results = MetadataManager.fullTextSearch('organic tomatoes', {
  sortBy: 'relevance',
  limit: 20
});
```

### Advanced Custom Search

```typescript
import { MetadataSearch } from '@/lib/ipfs';

const results = MetadataSearch.advancedSearch(
  (metadata) => {
    if (metadata.schemaType === 'tester-batch') {
      const tester = metadata as TesterBatchMetadata;
      return tester.testing.qualityGradeScore >= 90;
    }
    return false;
  },
  { sortBy: 'date', limit: 50 }
);
```

### Get Search Statistics

```typescript
const stats = MetadataManager.getSearchStatistics();

console.log('Total metadata:', stats.totalMetadata);
console.log('By type:', stats.bySchemaType);
console.log('Valid:', stats.validMetadata);
console.log('Invalid:', stats.invalidMetadata);
```

## Handling Errors

### Validation Errors

```typescript
try {
  const result = await MetadataManager.uploadMetadata(metadata, {
    validate: true
  });
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Corrupted Data Recovery

```typescript
import { MetadataParser } from '@/lib/ipfs';

const parsed = await MetadataParser.parseFromCID('QmCID...');

if (parsed.isCorrupted) {
  const recovered = await MetadataParser.handleCorruptedData(
    'QmCID...',
    'retry' // or 'skip' or 'default'
  );

  if (recovered) {
    console.log('Data recovered:', recovered.metadata);
  }
}
```

### Sanitize Invalid Metadata

```typescript
const sanitized = MetadataParser.sanitizeMetadata(invalidMetadata);
```

## Complete Example

```typescript
import {
  MetadataBuilder,
  MetadataManager,
  MetadataVersionManager,
  uploadBatchImages
} from '@/lib/ipfs';

async function createAndUploadBatch(formData: any, images: File[]) {
  // 1. Build metadata
  const metadata = MetadataBuilder.buildCollectorBatch({
    batchId: formData.batchId,
    batchNumber: formData.batchNumber,
    collectorAddress: formData.address,
    location: formData.location,
    environmental: formData.environmental,
    harvest: formData.harvest,
    pesticide: formData.pesticide,
    pricing: formData.pricing,
    qrCodeData: formData.qrCode
  });

  // 2. Upload images
  const imageResults = await uploadBatchImages(formData.batchId, images);
  metadata.images = imageResults.map(r => r.cid);

  // 3. Upload metadata with validation and versioning
  const { result, versioned } = await MetadataManager.uploadVersionedMetadata(
    metadata,
    undefined,
    formData.address,
    'Initial batch creation',
    { validate: true }
  );

  // 4. Index for search
  await MetadataManager.buildSearchIndex([result.cid]);

  return {
    metadataCID: result.cid,
    versioned,
    validation: result.validation
  };
}

async function searchAndDisplayBatches(searchTerm: string) {
  // Search for batches
  const results = MetadataManager.fullTextSearch(searchTerm, {
    sortBy: 'relevance',
    limit: 10
  });

  // Display results
  results.forEach(result => {
    console.log(`Found: ${result.metadata.schemaType}`);
    console.log(`Relevance: ${result.relevanceScore}`);
    console.log(`CID: ${result.cid}`);
  });
}
```

## Best Practices

1. **Always validate metadata** before uploading to IPFS
2. **Use versioning** for important metadata that may change
3. **Build search indexes** for frequently accessed metadata
4. **Handle corrupted data** gracefully with retry logic
5. **Cache retrieved metadata** to minimize IPFS gateway calls
6. **Use proper schema types** for type safety
7. **Include meaningful change logs** in versions
8. **Regularly check validation warnings** even when metadata passes

## API Reference

### MetadataManager
- `uploadMetadata(metadata, options)` - Upload metadata with validation
- `uploadVersionedMetadata(metadata, existing, updatedBy, changeLog, options)` - Upload with versioning
- `retrieveMetadata(cid, useCache)` - Retrieve and parse metadata
- `retrieveBatch(cids, useCache)` - Retrieve multiple metadata items
- `validateMetadata(metadata)` - Validate metadata structure
- `searchMetadata(query, options)` - Search indexed metadata
- `buildSearchIndex(cids)` - Build search index from CIDs
- `getSearchStatistics()` - Get search index statistics
- `fullTextSearch(term, options)` - Full-text search

### MetadataBuilder
- `buildCollectorBatch(data)` - Build collector batch metadata
- `buildTesterBatch(data)` - Build tester batch metadata
- `buildProcessorBatch(data)` - Build processor batch metadata
- `buildManufacturerBatch(data)` - Build manufacturer batch metadata
- `buildWasteMetrics(data)` - Build waste metrics metadata
- `buildQualityReport(data)` - Build quality report metadata

### MetadataValidator
- `validate(metadata)` - Validate any metadata type
- `validateCollectorBatch(metadata)` - Validate collector batch
- `validateTesterBatch(metadata)` - Validate tester batch
- `validateProcessorBatch(metadata)` - Validate processor batch
- `validateManufacturerBatch(metadata)` - Validate manufacturer batch
- `validateWasteMetrics(metadata)` - Validate waste metrics
- `validateQualityReport(metadata)` - Validate quality report

### MetadataVersionManager
- `createVersionedMetadata(metadata, cid, updatedBy, changeLog)` - Create versioned metadata
- `addVersion(versioned, newMetadata, newCID, updatedBy, changeLog)` - Add new version
- `getLatestVersion(versioned)` - Get latest version
- `getVersionHistory(versioned)` - Get version history
- `getVersionByCID(versioned, cid)` - Get specific version
- `compareVersions(versioned, cidA, cidB)` - Compare two versions
- `rollbackToVersion(versioned, cid, updatedBy, changeLog)` - Rollback to version

### MetadataParser
- `parseFromCID(cid, useCache)` - Parse metadata from CID
- `parseBatch(cids, useCache)` - Parse multiple metadata items
- `parseRawMetadata(rawData, cid)` - Parse raw data
- `handleCorruptedData(cid, strategy)` - Handle corrupted data
- `sanitizeMetadata(metadata)` - Sanitize invalid metadata

### MetadataSearch
- `search(query, options)` - Search with query
- `searchBySchemaType(type, options)` - Search by schema type
- `searchByBatchId(batchId, options)` - Search by batch ID
- `searchByAddress(address, options)` - Search by address
- `searchByDateRange(start, end, options)` - Search by date range
- `fullTextSearch(term, options)` - Full-text search
- `advancedSearch(predicate, options)` - Advanced custom search
- `buildIndexFromCIDs(cids)` - Build index from CIDs
- `getStatistics()` - Get search statistics
