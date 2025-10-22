# Batch Certificate Generation System

A comprehensive PDF certificate generation system with blockchain verification, QR codes, and IPFS storage for the FoodTrace supply chain platform.

## Features

### Core Certificate Features
- **Professional PDF Generation**: Creates high-quality A4 certificates using jsPDF
- **Complete Supply Chain Data**: Includes all phases (Collection, Testing, Processing, Manufacturing)
- **QR Code Integration**: Embedded QR codes for instant blockchain verification
- **Blockchain Verification Hash**: Unique hash for certificate authenticity verification
- **Waste Metrics Summary**: Optional waste tracking data included in certificates
- **Participant Signatures**: Digital signatures from all supply chain participants
- **IPFS Storage**: Upload certificates to IPFS for permanent, decentralized storage
- **Downloadable PDF**: One-click download of formatted certificates
- **Certificate Authentication**: Built-in verification system

## Components

### 1. BatchCertificate Component
Enhanced component with full PDF generation capabilities.

**Props:**
```typescript
interface BatchCertificateProps {
  batchNumber: string;
  batchId: string;
  phase: string;
  qrCode: GeneratedQRCode;
  supplyChainData: FullSupplyChain;
  wasteMetrics?: WasteMetric[];
  userAddress?: string;
  batchDetails: {
    collectorInfo?: { ... };
    testerInfo?: { ... };
    processorInfo?: { ... };
    manufacturerInfo?: { ... };
  };
}
```

**Usage:**
```tsx
import { BatchCertificate } from './components/BatchCertificate';

<BatchCertificate
  batchNumber="BATCH-001"
  batchId="1"
  phase="Manufacturing"
  qrCode={generatedQRCode}
  supplyChainData={fullSupplyChain}
  wasteMetrics={wasteMetrics}
  userAddress={currentUserAddress}
  batchDetails={details}
/>
```

**Features:**
- Download PDF certificate button
- Upload to IPFS button with loading states
- Share certificate functionality
- Real-time certificate metadata display
- Error handling with user feedback
- Certificate ID and hash generation

### 2. CertificateVerifier Component
Standalone component for verifying certificate authenticity.

**Usage:**
```tsx
import { CertificateVerifier } from './components/CertificateVerifier';

<CertificateVerifier />
```

**Features:**
- Certificate ID lookup
- Blockchain verification
- Hash validation
- Participant display
- IPFS link verification
- Visual validation status

## Services

### Certificate Service (`certificateService.ts`)

#### generateCertificatePDF()
Creates a formatted PDF certificate with all supply chain data.

```typescript
const { pdf, metadata } = await generateCertificatePDF(
  certificateData,
  generatedBy
);
```

**Certificate Includes:**
- FoodTrace branding and header
- Batch information and current phase
- QR code for verification
- Complete supply chain journey:
  - Collection phase details
  - Testing/Quality assurance data
  - Processing information
  - Manufacturing details
- Waste metrics summary (if available)
- Blockchain verification section
- Participant signatures
- Certificate ID and hash

#### downloadCertificatePDF()
Generates and downloads the certificate as a PDF file.

```typescript
const metadata = await downloadCertificatePDF(
  certificateData,
  userAddress,
  batchId
);
```

#### uploadCertificateToIPFS()
Uploads certificate metadata to IPFS for permanent storage.

```typescript
const { ipfsHash, metadata } = await uploadCertificateToIPFS(
  certificateData,
  userAddress,
  batchId
);
```

**Stored Metadata:**
- Certificate ID and hash
- Complete supply chain data
- Waste metrics
- Blockchain information
- Participant addresses
- Generation timestamp

#### verifyCertificateAuthenticity()
Verifies certificate hash and authenticity.

```typescript
const isValid = await verifyCertificateAuthenticity(
  certificateHash,
  batchNumber,
  contractAddress
);
```

### Certificate Storage Service (`certificateStorageService.ts`)

#### saveCertificateMetadata()
Saves certificate metadata to Supabase database.

```typescript
const stored = await saveCertificateMetadata(batchId, metadata);
```

#### getCertificateByBatchNumber()
Retrieves all certificates for a specific batch.

```typescript
const certificates = await getCertificateByBatchNumber(batchNumber);
```

#### getCertificateByCertificateId()
Retrieves a specific certificate by ID.

```typescript
const certificate = await getCertificateByCertificateId(certificateId);
```

#### verifyCertificateByHash()
Verifies certificate using database records.

```typescript
const isValid = await verifyCertificateByHash(hash, batchNumber);
```

## Certificate Format

### PDF Layout
- **A4 Portrait** format
- **Double border** design with emerald green accent color
- **Professional typography** with clear hierarchy
- **QR Code** positioned in top-right corner
- **Sections:**
  1. Header with title and subtitle
  2. Batch information
  3. Supply chain phases (expandable based on available data)
  4. Waste metrics summary (if available)
  5. Blockchain verification details
  6. Participant signatures
  7. Footer with timestamp and certificate ID

### Certificate ID Format
```
CERT-{BATCH_NUMBER}-{TIMESTAMP}
Example: CERT-BATCH001-1698765432000
```

### Certificate Hash
64-character hexadecimal hash generated from:
- Batch number
- Batch ID
- Timestamp
- Contract address

## Database Schema

Table: `batch_certificates`

```sql
CREATE TABLE batch_certificates (
  id uuid PRIMARY KEY,
  certificate_id text UNIQUE NOT NULL,
  batch_number text NOT NULL,
  batch_id text NOT NULL,
  generated_by text NOT NULL,
  generated_at timestamptz NOT NULL,
  certificate_hash text NOT NULL,
  ipfs_hash text,
  blockchain_verified boolean DEFAULT true,
  participants jsonb NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
- `batch_number` - Fast batch lookups
- `certificate_id` - Verification queries
- `ipfs_hash` - IPFS reference lookups
- `generated_by` - User certificate history

**RLS Policies:**
- Anyone can view certificates (authenticated)
- Authenticated users can create certificates

## Integration Example

```tsx
import { useState } from 'react';
import { BatchCertificate } from './components/BatchCertificate';
import { CertificateVerifier } from './components/CertificateVerifier';
import { getFullSupplyChain } from './services/blockchainService';
import { getWasteMetricsByBatch } from './services/wasteService';
import { generateQRCode } from './services/qrCodeService';

function CertificateManager({ batchId, batchNumber }) {
  const [supplyChain, setSupplyChain] = useState(null);
  const [wasteMetrics, setWasteMetrics] = useState([]);
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    async function loadData() {
      const chain = await getFullSupplyChain(batchId);
      const waste = await getWasteMetricsByBatch(batchId);
      const qr = await generateQRCode(batchId, batchNumber, 'completed');

      setSupplyChain(chain);
      setWasteMetrics(waste);
      setQrCode(qr);
    }
    loadData();
  }, [batchId, batchNumber]);

  if (!supplyChain || !qrCode) return <div>Loading...</div>;

  return (
    <div>
      <BatchCertificate
        batchNumber={batchNumber}
        batchId={batchId}
        phase="completed"
        qrCode={qrCode}
        supplyChainData={supplyChain}
        wasteMetrics={wasteMetrics}
        userAddress={currentUser.address}
        batchDetails={{
          collectorInfo: {
            organization: 'Farm Co',
            harvestDate: supplyChain.collector?.harvestDate,
            seedCropName: supplyChain.collector?.seedCropName
          }
        }}
      />

      <CertificateVerifier />
    </div>
  );
}
```

## Certificate Workflow

1. **Generation**:
   - User clicks "Download PDF" button
   - System fetches complete supply chain data
   - PDF is generated with all information
   - Certificate metadata is created with unique ID and hash
   - Metadata is saved to database
   - PDF is downloaded to user's device

2. **IPFS Upload**:
   - User clicks "Upload to IPFS" button
   - Certificate metadata is prepared
   - Metadata is uploaded to IPFS via Pinata
   - IPFS hash is returned and stored
   - Database is updated with IPFS reference

3. **Verification**:
   - User enters certificate ID
   - System queries database for certificate
   - Hash is verified against stored hash
   - Blockchain verification status checked
   - Results displayed with participant information

## Security Features

- **Unique Certificate Hash**: Cryptographic hash ensures certificate integrity
- **Blockchain Verification**: Links certificate to immutable blockchain records
- **IPFS Storage**: Decentralized storage prevents tampering
- **Database Verification**: Cross-reference with stored metadata
- **Participant Signatures**: Digital addresses of all supply chain participants
- **Timestamp Verification**: Generation time recorded immutably

## Best Practices

1. **Always generate certificates at completion** of the supply chain
2. **Upload to IPFS** for permanent record keeping
3. **Provide certificate ID** to all stakeholders
4. **Verify certificates** before accepting them as proof
5. **Include waste metrics** for transparency
6. **Share verification URL** with consumers

## Error Handling

The system includes comprehensive error handling:
- Network failures during IPFS upload
- Database connection issues
- Missing supply chain data
- Invalid certificate IDs
- Verification failures

All errors are displayed to users with clear messages and suggested actions.

## Future Enhancements

- Multi-language certificate support
- Custom branding options
- Email certificate distribution
- Bulk certificate generation
- QR code scanning integration
- Mobile-optimized certificates
- Certificate revocation system
