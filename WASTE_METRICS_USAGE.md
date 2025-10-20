# Waste Metrics System

A comprehensive waste tracking and analytics system for the food supply chain with IPFS integration for immutable record-keeping.

## Overview

The waste metrics system allows stakeholders at each phase of the supply chain to record, track, and analyze waste incidents. All waste data is stored both in Supabase for quick queries and on IPFS for immutable, decentralized storage.

## Features

- **Comprehensive Waste Tracking**: Record waste at any supply chain phase
- **Category-based Classification**: 8 predefined waste categories for detailed analysis
- **Cost Impact Tracking**: Monitor financial losses from waste
- **Prevention Notes**: Document recommendations to prevent future waste
- **IPFS Integration**: Immutable metadata storage with IPFS CIDs
- **Analytics Dashboard**: View waste trends, costs, and insights
- **Multi-unit Support**: Track waste in various units (kg, tons, liters, etc.)

## Database Schema

### waste_metrics Table

Stores individual waste incident records:

```sql
- id: UUID (primary key)
- batch_id: UUID (reference to any batch type)
- phase: TEXT (collection, testing, processing, manufacturing)
- recorded_by: UUID (user who recorded)
- waste_quantity: DECIMAL (amount of waste)
- waste_unit: TEXT (kg, tons, liters, etc.)
- waste_category: TEXT (spoilage, contamination, etc.)
- waste_reason: TEXT (detailed explanation)
- cost_impact: DECIMAL (estimated cost)
- currency: TEXT (USD, EUR, etc.)
- prevention_notes: TEXT (recommendations)
- ipfs_cid: TEXT (IPFS content identifier)
- recorded_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

### waste_prevention_insights Table

Aggregated insights for waste reduction strategies:

```sql
- id: UUID (primary key)
- organization_id: TEXT
- phase: TEXT
- waste_category: TEXT
- total_waste_quantity: DECIMAL
- total_cost_impact: DECIMAL
- incident_count: INTEGER
- common_reasons: JSONB
- recommendations: JSONB
- period_start: DATE
- period_end: DATE
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Waste Categories

1. **Spoilage**: Product deterioration due to time or improper storage
2. **Contamination**: Contaminated by foreign substances or microorganisms
3. **Processing Loss**: Material loss during processing or transformation
4. **Packaging Damage**: Product damaged due to packaging issues
5. **Quality Rejection**: Failed to meet quality standards
6. **Transportation Damage**: Damaged during transportation or handling
7. **Expired**: Passed expiration or best-before date
8. **Other**: Other reasons not listed above

## Usage Examples

### Recording Waste Metrics

```typescript
import { recordWasteMetric } from './services/wasteService';
import { WasteMetricInput } from './types/waste';

const wasteData: WasteMetricInput = {
  batch_id: 'batch-uuid-here',
  phase: 'processing',
  waste_quantity: 45.5,
  waste_unit: 'kg',
  waste_category: 'processing_loss',
  waste_reason: 'Mechanical breakdown during grinding process',
  cost_impact: 350.00,
  currency: 'USD',
  prevention_notes: `
    - Schedule preventive maintenance every 2 weeks
    - Train operators on early warning signs
    - Install backup processing unit
  `
};

// Optional: Include GPS and environmental data
const metadata = {
  gpsLocation: { latitude: 40.7128, longitude: -74.0060 },
  environmentalConditions: {
    temperature: 22,
    humidity: 65,
    weather: 'Clear'
  }
};

const metric = await recordWasteMetric(wasteData, userId, metadata);
console.log('Waste recorded with IPFS CID:', metric.ipfs_cid);
```

### Retrieving Waste Metrics

```typescript
import {
  getWasteMetricsByBatch,
  getWasteMetricsByPhase,
  calculateWasteSummary
} from './services/wasteService';

// Get all waste for a specific batch
const batchWaste = await getWasteMetricsByBatch('batch-uuid');

// Get all waste for a specific phase
const processingWaste = await getWasteMetricsByPhase('processing', userId);

// Get summary statistics
const summary = await calculateWasteSummary(userId);
console.log('Total waste:', summary.totalWasteQuantity);
console.log('Total cost:', summary.totalCostImpact);
console.log('Waste by category:', summary.wasteByCategory);
```

### Using the React Components

```tsx
import { WasteMetricForm } from './components/WasteMetricForm';
import { WasteMetricsList } from './components/WasteMetricsList';

// In your component
function BatchDetails({ batchId }) {
  const [showWasteForm, setShowWasteForm] = useState(false);

  const handleWasteSubmit = async (wasteData) => {
    await recordWasteMetric(wasteData, userId);
    setShowWasteForm(false);
    // Refresh the list
  };

  return (
    <div>
      <button onClick={() => setShowWasteForm(true)}>
        Record Waste
      </button>

      {showWasteForm && (
        <WasteMetricForm
          batchId={batchId}
          phase="processing"
          onSubmit={handleWasteSubmit}
          onCancel={() => setShowWasteForm(false)}
        />
      )}

      <WasteMetricsList batchId={batchId} />
    </div>
  );
}
```

## IPFS Metadata Structure

Each waste metric is stored on IPFS with the following structure:

```json
{
  "batch_id": "uuid",
  "phase": "processing",
  "waste_details": {
    "quantity": 45.5,
    "unit": "kg",
    "category": "processing_loss",
    "reason": "Mechanical breakdown during grinding process"
  },
  "financial_impact": {
    "cost": 350.00,
    "currency": "USD"
  },
  "prevention": {
    "notes": "Schedule preventive maintenance...",
    "recommendations": [
      "Schedule preventive maintenance every 2 weeks",
      "Train operators on early warning signs",
      "Install backup processing unit"
    ]
  },
  "metadata": {
    "recorded_by": "user-uuid",
    "recorded_at": "2025-10-20T10:30:00Z",
    "gps_location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "environmental_conditions": {
      "temperature": 22,
      "humidity": 65,
      "weather": "Clear"
    }
  }
}
```

## Best Practices

### Recording Waste

1. **Be Specific**: Provide detailed reasons for waste incidents
2. **Include Context**: Add GPS and environmental data when relevant
3. **Estimate Costs**: Record financial impact for better ROI analysis
4. **Document Prevention**: Always include prevention notes and recommendations
5. **Record Promptly**: Log waste as soon as it occurs

### Prevention Notes

Structure your prevention notes for clarity:

```
- Use bullet points for multiple recommendations
- Start with immediate actions
- Include long-term improvements
- Reference specific equipment or processes
- Mention training opportunities
```

### Cost Calculation

Include all relevant costs:
- Material cost
- Labor cost for handling waste
- Disposal costs
- Lost revenue from unsold product
- Quality control re-testing costs

## Analytics and Insights

The system provides multiple analytics capabilities:

### Waste Summary
```typescript
const summary = await calculateWasteSummary(userId);
// Returns: totalWasteQuantity, totalCostImpact, wasteByCategory, wasteByPhase
```

### Prevention Insights
```typescript
const insights = await getWasteInsights(organizationId, startDate, endDate);
// Returns aggregated insights with recommendations
```

### Trend Analysis
Query waste metrics by date range to identify patterns:
```typescript
const metrics = await getWasteMetricsByPhase('processing', userId);
const monthlyWaste = groupByMonth(metrics);
```

## Security

- **Row Level Security (RLS)**: Users can only access their own waste records
- **Organization Scoping**: Insights are scoped to organizations
- **Authentication Required**: All operations require authenticated users
- **IPFS Immutability**: Once uploaded, waste records cannot be altered

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_PINATA_API_KEY=your-pinata-api-key
VITE_PINATA_SECRET_KEY=your-pinata-secret-key
```

## Integration with Smart Contracts

To store waste IPFS CIDs on the blockchain, update your smart contract structs:

```solidity
struct CollectorData {
    // ... existing fields
    string wasteMetricsIPFS;
}

struct ProcessorData {
    // ... existing fields
    string wasteMetricsIPFS;
}

// Similar for TesterData and ManufacturerData
```

Then update the contract functions to accept and store the waste IPFS CID when recording batch data.

## Future Enhancements

Potential improvements:
- AI-powered waste prediction
- Automated insight generation
- Waste reduction targets and tracking
- Benchmark comparisons across organizations
- Image upload for waste documentation
- Integration with IoT sensors for automatic detection
- Carbon footprint calculation from waste data
