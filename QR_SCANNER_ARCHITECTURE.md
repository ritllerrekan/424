# QR Scanner System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FoodTrace QR System                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  QR Code         │     │  Scanning        │     │  Display     │
│  Generation      │────▶│  Methods         │────▶│  Results     │
└──────────────────┘     └──────────────────┘     └──────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ PublicBatch      │         │ QRCodeManagement │             │
│  │ Tracker          │         │ Page             │             │
│  │                  │         │                  │             │
│  │ - Manual Search  │         │ - Generate QR    │             │
│  │ - QR Scanner     │         │ - Scan QR        │             │
│  │ - Batch Display  │         │ - List QR Codes  │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                        │
│           └────────────┬───────────────┘                        │
│                        │                                        │
│           ┌────────────▼────────────┐                          │
│           │                         │                          │
│           │   QRCodeScanner         │                          │
│           │   Component             │                          │
│           │                         │                          │
│           │  ┌─────────────────┐   │                          │
│           │  │ Camera Scan     │   │                          │
│           │  ├─────────────────┤   │                          │
│           │  │ File Upload     │   │                          │
│           │  ├─────────────────┤   │                          │
│           │  │ Manual Entry    │   │                          │
│           │  └─────────────────┘   │                          │
│           │                         │                          │
│           └────────────┬────────────┘                          │
│                        │                                        │
│           ┌────────────▼────────────┐                          │
│           │                         │                          │
│           │  BatchDetailsViewer     │                          │
│           │  Component              │                          │
│           │                         │                          │
│           │  - Batch Info           │                          │
│           │  - Collection Data      │                          │
│           │  - Testing Data         │                          │
│           │  - Processing Data      │                          │
│           │  - Manufacturing Data   │                          │
│           │                         │                          │
│           └─────────────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ qrCodeService.ts                                         │  │
│  │ - generateBatchQRCode()                                  │  │
│  │ - decodeQRData()                                         │  │
│  │ - validateQRCode()                                       │  │
│  │ - uploadQRCodeToIPFS()                                   │  │
│  │ - generatePrintableLabel()                               │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────┼─────────────────────────────────────┐  │
│  │ blockchainService.ts│                                     │  │
│  │ - getFullSupplyChain()                                   │  │
│  │ - getBatchInfo()                                         │  │
│  │ - getCollectorData()                                     │  │
│  │ - getTesterData()                                        │  │
│  │ - getProcessorData()                                     │  │
│  │ - getManufacturerData()                                  │  │
│  │ - validateBatchExists()                                  │  │
│  └────────────────────┼─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────┼─────────────────────────────────────┐  │
│  │ ipfsService.ts     │                                      │  │
│  │ - fetchIPFSMetadata()                                    │  │
│  │ - getIPFSUrl()                                           │  │
│  │ - isValidIPFSHash()                                      │  │
│  │ - checkIPFSAvailability()                                │  │
│  └────────────────────┴─────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        QR Code Scan Flow                         │
└─────────────────────────────────────────────────────────────────┘

1. User Action
   │
   ├─▶ Camera Scan
   │   └─▶ html5-qrcode library
   │       └─▶ Detects QR code
   │
   ├─▶ File Upload
   │   └─▶ User selects image
   │       └─▶ html5-qrcode scans file
   │
   └─▶ Manual Entry
       └─▶ User types batch ID
           └─▶ Constructs QR data

2. QR Data Extraction
   │
   └─▶ decodeQRData()
       ├─▶ Parse JSON from QR
       └─▶ Extract batch information
           │
           ├─ batchId
           ├─ batchNumber
           ├─ contractAddress
           ├─ network
           ├─ phase
           ├─ timestamp
           ├─ ipfsHash (optional)
           └─ verificationUrl

3. Validation
   │
   └─▶ validateQRCode()
       ├─▶ Check required fields
       ├─▶ Validate network
       ├─▶ Verify timestamp
       └─▶ Return valid/invalid

4. Blockchain Fetch
   │
   └─▶ getFullSupplyChain(batchId)
       │
       ├─▶ Connect to RPC
       │   └─▶ https://sepolia.base.org
       │
       ├─▶ Get Smart Contract
       │   └─▶ ethers.Contract(address, abi, provider)
       │
       ├─▶ Fetch Batch Data
       │   ├─▶ getBatch(batchId)
       │   ├─▶ getCollectorData(batchId)
       │   ├─▶ getTesterData(batchId)
       │   ├─▶ getProcessorData(batchId)
       │   └─▶ getManufacturerData(batchId)
       │
       └─▶ Return FullSupplyChain object

5. IPFS Metadata (Optional)
   │
   └─▶ fetchIPFSMetadata(ipfsHash)
       │
       ├─▶ Check if hash exists
       ├─▶ Validate hash format
       ├─▶ Fetch from gateway
       │   └─▶ https://gateway.pinata.cloud/ipfs/
       └─▶ Parse JSON metadata

6. Display Results
   │
   └─▶ BatchDetailsViewer
       │
       ├─▶ Show Batch Header
       │   ├─ Batch Number
       │   ├─ Current Phase
       │   └─ Status
       │
       ├─▶ Show Collection Phase
       │   ├─ Crop details
       │   ├─ Harvest info
       │   ├─ GPS location
       │   └─ Pricing
       │
       ├─▶ Show Testing Phase
       │   ├─ Lab results
       │   ├─ Quality scores
       │   └─ Contaminants
       │
       ├─▶ Show Processing Phase
       │   ├─ Processing type
       │   ├─ Conversion ratio
       │   └─ Additives
       │
       ├─▶ Show Manufacturing Phase
       │   ├─ Product details
       │   ├─ Expiry dates
       │   └─ Final location
       │
       └─▶ Show Verification Badge
```

## QR Code Data Structure

```javascript
{
  // Core Identification
  "batchId": "123",                    // Blockchain ID
  "batchNumber": "BATCH-2025-001",    // Human-readable ID

  // Blockchain Info
  "contractAddress": "0x742d35...",   // Smart contract
  "network": "base-sepolia",          // Blockchain network

  // Supply Chain
  "phase": "collection",              // Current phase

  // Metadata
  "timestamp": 1729512000000,         // Creation time
  "ipfsHash": "QmXxxx...",            // Optional IPFS

  // Public Access
  "verificationUrl": "https://app.com/verify/123"
}
```

## Smart Contract Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Contract Structure                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FoodSupplyChain Contract (Base Sepolia)                        │
│  Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb            │
│                                                                  │
│  ┌────────────────────────────────────────┐                    │
│  │ Batch Mapping                          │                    │
│  │ mapping(uint256 => Batch) batches      │                    │
│  └────────────────────────────────────────┘                    │
│           │                                                      │
│           ├─▶ Phase 1: Collection                               │
│           │   mapping(uint256 => CollectorData)                 │
│           │   - GPS Location                                    │
│           │   - Harvest Date                                    │
│           │   - Pesticide Info                                  │
│           │   - Pricing                                         │
│           │                                                      │
│           ├─▶ Phase 2: Testing                                  │
│           │   mapping(uint256 => TesterData)                    │
│           │   - Quality Score                                   │
│           │   - Contaminants                                    │
│           │   - Lab Name                                        │
│           │   - Collector Rating                                │
│           │                                                      │
│           ├─▶ Phase 3: Processing                               │
│           │   mapping(uint256 => ProcessorData)                 │
│           │   - Processing Type                                 │
│           │   - Input/Output Weight                             │
│           │   - Conversion Ratio                                │
│           │   - Additives                                       │
│           │                                                      │
│           └─▶ Phase 4: Manufacturing                            │
│               mapping(uint256 => ManufacturerData)              │
│               - Product Name                                    │
│               - Brand Name                                      │
│               - Expiry Date                                     │
│               - Final Location                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Public Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Consumer Scanning Journey                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: Consumer finds QR code on product
   │
   ├─ On product packaging
   ├─ On product label
   └─ On product certificate

Step 2: Consumer scans QR code
   │
   ├─▶ Using phone camera app
   ├─▶ Using dedicated QR scanner app
   └─▶ Using FoodTrace app scanner

Step 3: QR app detects URL
   │
   └─▶ https://yourapp.com/verify/123

Step 4: Browser opens URL
   │
   └─▶ PublicBatchTracker page loads

Step 5: Page extracts batch ID
   │
   └─▶ Batch ID: "123"

Step 6: Fetch blockchain data
   │
   └─▶ Complete supply chain loaded

Step 7: Display results
   │
   └─▶ Consumer sees full history
       ├─ Farm origin
       ├─ Quality tests
       ├─ Processing details
       └─ Manufacturing info

Step 8: Consumer makes informed decision
   │
   ├─▶ Trust verified
   ├─▶ Quality confirmed
   └─▶ Purchase with confidence
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Handling                                │
└─────────────────────────────────────────────────────────────────┘

Camera Permission Denied
   │
   └─▶ Show permission instructions
       └─▶ Offer alternative methods
           ├─ File upload
           └─ Manual entry

Invalid QR Format
   │
   └─▶ Show error message
       └─▶ Allow retry

Batch Not Found
   │
   └─▶ Check batch ID
       └─▶ Verify blockchain connection
           └─▶ Show helpful message

Network Error
   │
   └─▶ Retry connection
       └─▶ Show offline message
           └─▶ Cache if possible

IPFS Unavailable
   │
   └─▶ Continue without IPFS
       └─▶ Show blockchain data only
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
└─────────────────────────────────────────────────────────────────┘

1. QR Code Level
   │
   ├─▶ JSON format validation
   ├─▶ Required fields check
   ├─▶ Timestamp verification
   └─▶ Network validation

2. Blockchain Level
   │
   ├─▶ Immutable data
   ├─▶ Cryptographic verification
   ├─▶ Smart contract validation
   └─▶ Decentralized storage

3. Application Level
   │
   ├─▶ Input sanitization
   ├─▶ XSS protection
   ├─▶ HTTPS only
   └─▶ Secure RPC connection

4. Display Level
   │
   ├─▶ Data sanitization
   ├─▶ Safe rendering
   └─▶ Verification badges
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                Performance Characteristics                       │
└─────────────────────────────────────────────────────────────────┘

QR Scanning
   ├─ Camera FPS: 10 frames/second
   ├─ Detection time: < 1 second
   └─ File upload: < 2 seconds

Blockchain Fetch
   ├─ RPC connection: < 500ms
   ├─ Contract read: 1-2 seconds
   ├─ Multiple calls: Parallel execution
   └─ Total fetch: 2-3 seconds

IPFS Fetch
   ├─ Gateway connection: < 500ms
   ├─ Metadata fetch: 1-2 seconds
   └─ Optional fallback: Continue without

Page Load
   ├─ Initial load: < 1 second
   ├─ Data display: < 500ms
   └─ Total UX: < 4 seconds
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Stack                              │
└─────────────────────────────────────────────────────────────────┘

Frontend (Vite + React)
   │
   ├─▶ Hosted on CDN
   ├─▶ HTTPS required
   └─▶ Static files

Smart Contract
   │
   ├─▶ Base Sepolia Network
   ├─▶ Address: 0x742d35...
   └─▶ Immutable code

IPFS Storage
   │
   ├─▶ Pinata Gateway
   ├─▶ Decentralized storage
   └─▶ Permanent files

Database (Supabase)
   │
   ├─▶ QR code registry
   ├─▶ User preferences
   └─▶ Analytics data
```

This architecture ensures reliability, security, and excellent user experience across all devices and platforms.
