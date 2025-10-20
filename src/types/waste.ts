export type WastePhase = 'collection' | 'testing' | 'processing' | 'manufacturing';

export type WasteCategory =
  | 'spoilage'
  | 'contamination'
  | 'processing_loss'
  | 'packaging_damage'
  | 'quality_rejection'
  | 'transportation_damage'
  | 'expired'
  | 'other';

export interface WasteMetric {
  id: string;
  batch_id: string;
  phase: WastePhase;
  recorded_by: string;
  waste_quantity: number;
  waste_unit: string;
  waste_category: WasteCategory;
  waste_reason: string;
  cost_impact: number;
  currency: string;
  prevention_notes?: string;
  ipfs_cid?: string;
  recorded_at: string;
  created_at: string;
}

export interface WasteMetricInput {
  batch_id: string;
  phase: WastePhase;
  waste_quantity: number;
  waste_unit: string;
  waste_category: WasteCategory;
  waste_reason: string;
  cost_impact?: number;
  currency?: string;
  prevention_notes?: string;
}

export interface WasteMetricIPFSData {
  batch_id: string;
  phase: WastePhase;
  waste_details: {
    quantity: number;
    unit: string;
    category: WasteCategory;
    reason: string;
  };
  financial_impact: {
    cost: number;
    currency: string;
  };
  prevention: {
    notes: string;
    recommendations: string[];
  };
  metadata: {
    recorded_by: string;
    recorded_at: string;
    gps_location?: {
      latitude: number;
      longitude: number;
    };
    environmental_conditions?: {
      temperature?: number;
      humidity?: number;
      weather?: string;
    };
  };
}

export interface WastePreventionInsight {
  id: string;
  organization_id: string;
  phase: WastePhase;
  waste_category: WasteCategory;
  total_waste_quantity: number;
  total_cost_impact: number;
  incident_count: number;
  common_reasons: string[];
  recommendations: string[];
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export const WASTE_CATEGORIES: { value: WasteCategory; label: string; description: string }[] = [
  {
    value: 'spoilage',
    label: 'Spoilage',
    description: 'Product deterioration due to time or improper storage'
  },
  {
    value: 'contamination',
    label: 'Contamination',
    description: 'Contaminated by foreign substances or microorganisms'
  },
  {
    value: 'processing_loss',
    label: 'Processing Loss',
    description: 'Material loss during processing or transformation'
  },
  {
    value: 'packaging_damage',
    label: 'Packaging Damage',
    description: 'Product damaged due to packaging issues'
  },
  {
    value: 'quality_rejection',
    label: 'Quality Rejection',
    description: 'Failed to meet quality standards'
  },
  {
    value: 'transportation_damage',
    label: 'Transportation Damage',
    description: 'Damaged during transportation or handling'
  },
  {
    value: 'expired',
    label: 'Expired',
    description: 'Passed expiration or best-before date'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reasons not listed above'
  }
];

export const WASTE_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'tons', label: 'Tons' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'units', label: 'Units' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'pallets', label: 'Pallets' }
];
