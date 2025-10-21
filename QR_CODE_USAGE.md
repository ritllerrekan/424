# QR Code Generation System

This document explains how to use the comprehensive QR code generation system for batch tracking in the FoodTrace supply chain application.

## Features

1. **High-Resolution QR Code Generation**
   - Generate QR codes with batch information
   - Encode batch ID, contract address, network, phase, and metadata
   - Support for multiple resolutions (512px standard, 2048px high-res)
   - Error correction level H for maximum reliability

2. **IPFS Integration**
   - Upload QR codes to IPFS for permanent storage
   - Retrieve QR codes from IPFS gateways
   - Store metadata IPFS hashes in QR codes

3. **Printable Labels**
   - Generate professional batch labels with QR codes
   - Include batch information, organization details, dates
   - Print-ready format with proper dimensions
   - Download as PNG images

4. **QR Code Scanning**
   - Camera-based QR code scanning
   - Automatic batch verification redirect
   - Permission handling for camera access
   - Error handling and user feedback

5. **Batch Certificates**
   - Generate blockchain-verified certificates
   - Include QR codes and full batch details
   - Download as PDF or print directly
   - Share verification links

6. **Database Storage**
   - Store all generated QR codes in Supabase
   - Track QR code metadata and IPFS hashes
   - Search and filter by batch number or phase
   - User-specific QR code management

## QR Code Data Structure

Each QR code encodes the following JSON data:

```json
{
  "batchId": "batch-123",
  "batchNumber": "BATCH-2025-001",
  "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "network": "base-sepolia",
  "phase": "collection",
  "timestamp": 1729490000000,
  "ipfsHash": "QmXx...",
  "verificationUrl": "https://your-app.com/verify/batch-123"
}
```

## Usage

### 1. Generate a QR Code

```tsx
import { QRCodeGenerator } from './components/QRCodeGenerator';

<QRCodeGenerator
  batchId="batch-123"
  batchNumber="BATCH-2025-001"
  phase="collection"
  contractAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  ipfsMetadataHash="QmXx..." // Optional
  additionalInfo={{
    productName: "Organic Tomatoes",
    organization: "Green Farm Co.",
    date: "2025-10-21"
  }}
  onQRGenerated={(qrCode) => {
    console.log('QR Code generated:', qrCode);
  }}
/>
```

### 2. Scan a QR Code

```tsx
import { QRCodeScanner } from './components/QRCodeScanner';

<QRCodeScanner
  onScanSuccess={(data) => {
    console.log('Scanned batch:', data.batchId);
    window.location.href = data.verificationUrl;
  }}
  onScanError={(error) => {
    console.error('Scan error:', error);
  }}
/>
```

### 3. Generate a Batch Certificate

```tsx
import { BatchCertificate } from './components/BatchCertificate';

<BatchCertificate
  batchNumber="BATCH-2025-001"
  phase="collection"
  qrCode={generatedQRCode}
  batchDetails={{
    collectorInfo: {
      organization: "Green Farm Co.",
      harvestDate: "2025-10-15",
      seedCropName: "Tomatoes",
      location: "Farm #1"
    },
    testerInfo: {
      labName: "Quality Labs Inc.",
      testDate: "2025-10-16",
      qualityScore: 95
    },
    manufacturerInfo: {
      productName: "Organic Tomato Paste",
      brandName: "FreshChoice",
      manufactureDate: "2025-10-20",
      expiryDate: "2026-10-20"
    }
  }}
/>
```

### 4. Programmatic QR Code Generation

```typescript
import {
  generateBatchQRCode,
  generateHighResQRCode,
  generatePrintableLabel,
  uploadQRCodeToIPFS,
  downloadQRCode,
  printQRLabel
} from './services/qrCodeService';

// Generate standard QR code
const qrCode = await generateBatchQRCode(
  'batch-123',
  'BATCH-2025-001',
  'collection',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
);

// Generate high-resolution QR code
const highResQR = await generateHighResQRCode(
  'batch-123',
  'BATCH-2025-001',
  'collection',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'QmXx...', // metadata IPFS hash
  2048 // size in pixels
);

// Upload to IPFS
const ipfsHash = await uploadQRCodeToIPFS(qrCode);
console.log('QR code uploaded to IPFS:', ipfsHash);

// Generate printable label
const label = await generatePrintableLabel(
  'batch-123',
  'BATCH-2025-001',
  'collection',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  {
    productName: 'Organic Tomatoes',
    organization: 'Green Farm Co.',
    date: '2025-10-21'
  }
);

// Download QR code
downloadQRCode(qrCode.dataUrl, 'batch-qr-code.png');

// Print label
printQRLabel(label);
```

### 5. Database Operations

```typescript
import {
  saveQRCode,
  getQRCodeByBatchId,
  getQRCodesByUser,
  searchQRCodesByBatchNumber,
  getQRCodeStats,
  updateQRCodeIPFS,
  deleteQRCode
} from './services/qrCodeStorage';

// Save QR code to database
const stored = await saveQRCode(qrCode, userId);

// Get QR code by batch ID
const qrCodeData = await getQRCodeByBatchId('batch-123');

// Get all user's QR codes
const userQRCodes = await getQRCodesByUser(userId);

// Search by batch number
const results = await searchQRCodesByBatchNumber('BATCH-2025');

// Get statistics
const stats = await getQRCodeStats(userId);
console.log('Total QR codes:', stats.total);
console.log('Phase breakdown:', stats.phaseBreakdown);

// Update IPFS hash
await updateQRCodeIPFS(qrCodeId, 'QmNewHash...', userId);

// Delete QR code
await deleteQRCode(qrCodeId, userId);
```

## Access the QR Code Management Page

Navigate to `/qr` or click the "QR Codes" button in the dashboard navigation to access the full QR code management interface.

The page includes:
- **Generate Tab**: Create new QR codes with custom batch information
- **Scan Tab**: Use your camera to scan existing QR codes
- **View All Tab**: Browse, search, and manage all your QR codes

## Database Schema

The `qr_codes` table stores all generated QR codes:

```sql
CREATE TABLE qr_codes (
  id uuid PRIMARY KEY,
  batch_id text NOT NULL,
  batch_number text NOT NULL,
  phase text NOT NULL,
  qr_data_url text NOT NULL,
  qr_ipfs_hash text,
  label_ipfs_hash text,
  contract_address text NOT NULL,
  network text NOT NULL,
  verification_url text NOT NULL,
  metadata_ipfs_hash text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Configuration

The QR code system uses the following environment variables:

```env
VITE_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features by Component

### QRCodeGenerator Component
- Interactive QR code generation
- Real-time preview
- Download functionality
- IPFS upload integration
- Printable label generation
- QR code data display

### QRCodeScanner Component
- Camera permission handling
- Real-time QR code scanning
- Automatic decoding
- Error handling
- Success feedback

### BatchCertificate Component
- Professional certificate layout
- QR code integration
- Blockchain verification info
- PDF download
- Print functionality
- Social sharing

## Best Practices

1. **Always generate high-resolution QR codes for printing** (2048px or higher)
2. **Upload QR codes to IPFS** for permanent storage and decentralized access
3. **Include verification URLs** in QR codes for easy batch verification
4. **Store QR code metadata** in the database for tracking and management
5. **Use proper error handling** for camera permissions and IPFS uploads
6. **Test QR codes** after generation to ensure they scan correctly
7. **Include batch context** in printable labels for human readability

## Troubleshooting

### Camera Permission Denied
- Check browser permissions for camera access
- Ensure HTTPS is used (camera API requires secure context)
- Try refreshing the page and allowing permissions

### IPFS Upload Fails
- Verify Pinata API credentials are configured
- Check network connectivity
- Ensure file size is within limits
- Retry the upload

### QR Code Won't Scan
- Ensure adequate lighting
- Hold camera steady
- Check QR code resolution (should be at least 256px)
- Verify QR code data is valid JSON

### Database Errors
- Verify Supabase credentials
- Check RLS policies are correctly configured
- Ensure user is authenticated
- Verify network connectivity

## Future Enhancements

- Bulk QR code generation for multiple batches
- Custom QR code styling and branding
- NFC tag integration
- Batch verification history tracking
- QR code analytics (scan count, locations, etc.)
- Multi-language support for certificates
- Custom certificate templates
