# Food Supply Chain Smart Contract Usage Guide

## Overview

The FoodSupplyChain smart contract stores all data from each dashboard (Collector, Tester, Processor, Manufacturer) on the blockchain. Each role submits their data by calling the corresponding function.

## Contract Structure

### Data Structures

1. **CollectorData** - Stores harvest information including GPS, weather, crop details, pesticide usage, pricing
2. **TesterData** - Stores quality testing results including lab name, quality scores, contamination levels, purity
3. **ProcessorData** - Stores processing details including type, weights, conversion ratios, chemicals used
4. **ManufacturerData** - Stores final product information including brand, product type, dates, quantities

### Key Features

- Each dashboard submission creates a new batch ID on the blockchain
- GPS coordinates and weather data are stored as integers for gas efficiency
- QR codes are generated and stored with each submission
- Chain participants can rate previous participants (e.g., Tester rates Collector)
- Full traceability from harvest to final product

## Setup Instructions

### 1. Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers
```

### 2. Compile the Contract

```bash
npx hardhat compile
```

### 3. Deploy to Local Network

Start a local Hardhat node:
```bash
npx hardhat node
```

In another terminal, deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Save the deployed contract address for frontend integration.

### 4. Deploy to Testnet (Optional)

Update `hardhat.config.js` with your testnet configuration and run:
```bash
npx hardhat run scripts/deploy.js --network <your-testnet>
```

## Contract Functions

### 1. Collector Dashboard

```javascript
function addCollectorData(
    string batchNumber,      // Generated batch number
    int256 gpsLatitude,      // Multiply by 1000000 for storage
    int256 gpsLongitude,     // Multiply by 1000000 for storage
    string weatherCondition, // e.g., "Sunny"
    int16 temperature,       // In Celsius
    uint8 humidity,          // Percentage
    string harvestDate,      // ISO format
    string seedCropName,     // e.g., "Organic Wheat"
    bool pesticideUsed,
    string pesticideName,
    string pesticideQuantity,
    uint256 pricePerUnit,    // In smallest currency unit
    uint256 weightTotal,     // In grams or smallest unit
    uint256 totalPrice,
    string qrCodeData
) returns (uint256 batchId)
```

**Example Call:**
```javascript
const tx = await contract.addCollectorData(
    "BATCH-20251018-ABC123",
    28547123,  // 28.547123 latitude
    77089456,  // 77.089456 longitude
    "Sunny",
    25,  // 25°C
    60,  // 60%
    "2025-10-18",
    "Organic Tomatoes",
    false,
    "",
    "",
    50,    // $0.50 per kg
    100000, // 100 kg
    5000,   // $50 total
    "QR_DATA_HERE"
);
const receipt = await tx.wait();
const batchId = receipt.logs[0].args.batchId;
```

### 2. Tester Dashboard

```javascript
function addTesterData(
    uint256 collectorBatchId,     // Previous batch ID
    int256 gpsLatitude,
    int256 gpsLongitude,
    string weatherCondition,
    int16 temperature,
    uint8 humidity,
    string testDate,
    uint256 qualityGradeScore,    // 0-100
    uint256 contaminantLevel,     // Parts per million
    uint256 purityLevel,          // Percentage * 100
    string labName,
    uint8 collectorRating,        // 1-5 stars
    string collectorRatingNotes,
    string qrCodeData
) returns (uint256 batchId)
```

### 3. Processor Dashboard

```javascript
function addProcessorData(
    uint256 testerBatchId,
    int256 gpsLatitude,
    int256 gpsLongitude,
    string weatherCondition,
    int16 temperature,
    string processingType,        // e.g., "Grinding"
    uint256 inputWeight,
    uint256 outputWeight,
    uint256 conversionRatio,      // Percentage * 100
    string chemicalsAdditives,
    uint8 testerRating,
    string testerRatingNotes,
    string qrCodeData
) returns (uint256 batchId)
```

### 4. Manufacturer Dashboard

```javascript
function addManufacturerData(
    uint256 processorBatchId,
    int256 gpsLatitude,
    int256 gpsLongitude,
    string weatherCondition,
    int16 temperature,
    string productName,
    string brandName,
    string productType,
    uint256 quantity,
    string unit,
    string location,
    string manufactureDate,
    string expiryDate,
    uint8 processorRating,
    string processorRatingNotes,
    string qrCodeData
) returns (uint256 batchId)
```

## Reading Data

### Get Individual Stage Data

```javascript
// Get collector data
const collectorData = await contract.getCollectorData(batchId);

// Get tester data
const testerData = await contract.getTesterData(batchId);

// Get processor data
const processorData = await contract.getProcessorData(batchId);

// Get manufacturer data
const manufacturerData = await contract.getManufacturerData(batchId);
```

### Get Complete Chain

```javascript
const [batch, collector, tester, processor, manufacturer] =
    await contract.getFullChain(batchId);

console.log("Batch Info:", batch);
console.log("Collector:", collector);
console.log("Tester:", tester);
console.log("Processor:", processor);
console.log("Manufacturer:", manufacturer);
```

## Data Format Notes

### GPS Coordinates
- Store as integers: multiply by 1,000,000
- Example: 28.547123° → 28547123

### Temperature
- Store as int16 in Celsius
- Range: -32,768 to 32,767

### Prices and Weights
- Use smallest unit (e.g., cents, grams)
- Store as uint256

### Dates
- Store as ISO string format: "YYYY-MM-DD"

## Integration with Frontend

### Example: Collector Dashboard Integration

```typescript
import { ethers } from 'ethers';
import contractABI from './FoodSupplyChain.json';

const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';

async function submitCollectorData(formData) {
    // Connect to wallet
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Create contract instance
    const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
    );

    // Convert GPS coordinates to integers
    const lat = Math.floor(formData.gpsLatitude * 1000000);
    const lng = Math.floor(formData.gpsLongitude * 1000000);

    // Call contract
    const tx = await contract.addCollectorData(
        formData.batchNumber,
        lat,
        lng,
        formData.weatherCondition,
        formData.temperature,
        formData.humidity,
        formData.harvestDate,
        formData.seedCropName,
        formData.pesticideUsed,
        formData.pesticideName || "",
        formData.pesticideQuantity || "",
        Math.floor(formData.pricePerUnit * 100), // Convert to cents
        Math.floor(formData.weightTotal * 1000), // Convert to grams
        Math.floor(formData.totalPrice * 100),
        formData.qrCodeData
    );

    // Wait for confirmation
    const receipt = await tx.wait();
    const batchId = receipt.logs[0].args.batchId;

    return batchId;
}
```

## Events

The contract emits these events for tracking:

- `BatchCreated(batchId, batchNumber, creator)`
- `CollectorDataAdded(batchId, collector)`
- `TesterDataAdded(batchId, tester)`
- `ProcessorDataAdded(batchId, processor)`
- `ManufacturerDataAdded(batchId, manufacturer)`
- `BatchCompleted(batchId, completedBy)`

## Gas Optimization Tips

1. GPS coordinates are stored as `int256` instead of `string`
2. Ratings use `uint8` (1 byte) instead of `uint256`
3. Temperature uses `int16` for compact storage
4. Use batch operations when possible
5. Consider IPFS for large documents, store only hash on-chain

## Security Considerations

1. Only the transaction sender can add data
2. Batch IDs are sequential and cannot be reused
3. Previous batch validation ensures proper chain sequence
4. All data is immutable once stored
5. Consider adding role-based access control for production

## Testing

Run contract tests:
```bash
npx hardhat test
```

## License

MIT
