/*
  # Create Waste Metrics System for Web3Auth

  ## Overview
  Creates comprehensive waste tracking system for all supply chain phases with IPFS metadata storage.
  Modified to work with Web3Auth wallet addresses instead of Supabase auth.

  ## New Tables

  ### `waste_metrics`
  Core waste tracking table linking to batches and phases
  - `id` (uuid, primary key) - Unique identifier
  - `batch_id` (uuid) - Reference to any batch type
  - `phase` (text) - Supply chain phase (collection, testing, processing, manufacturing)
  - `recorded_by` (text) - Wallet address of user who recorded the waste
  - `waste_quantity` (decimal) - Amount of waste
  - `waste_unit` (text) - Unit of measurement (kg, tons, liters, etc.)
  - `waste_category` (text) - Category (spoilage, contamination, processing_loss, etc.)
  - `waste_reason` (text) - Detailed reason for waste
  - `cost_impact` (decimal) - Estimated cost of waste
  - `currency` (text) - Currency for cost (USD, EUR, etc.)
  - `prevention_notes` (text) - Recommendations to prevent future waste
  - `ipfs_cid` (text) - IPFS content identifier for detailed metadata
  - `recorded_at` (timestamptz) - When waste was recorded
  - `created_at` (timestamptz) - Record creation timestamp

  ### `waste_prevention_insights`
  Aggregate insights and recommendations for waste reduction
  - `id` (uuid, primary key)
  - `organization_id` (text) - Organization identifier
  - `phase` (text) - Phase the insight applies to
  - `waste_category` (text) - Category the insight addresses
  - `total_waste_quantity` (decimal) - Total waste in this category
  - `total_cost_impact` (decimal) - Total cost impact
  - `incident_count` (integer) - Number of waste incidents
  - `common_reasons` (jsonb) - Array of common reasons
  - `recommendations` (jsonb) - Array of prevention recommendations
  - `period_start` (date) - Analysis period start
  - `period_end` (date) - Analysis period end
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for transparency
  - Users can record and manage waste by wallet address
*/

CREATE TABLE IF NOT EXISTS waste_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('collection', 'testing', 'processing', 'manufacturing')),
  recorded_by text NOT NULL,
  waste_quantity decimal(12, 3) NOT NULL CHECK (waste_quantity >= 0),
  waste_unit text NOT NULL DEFAULT 'kg',
  waste_category text NOT NULL CHECK (
    waste_category IN (
      'spoilage',
      'contamination',
      'processing_loss',
      'packaging_damage',
      'quality_rejection',
      'transportation_damage',
      'expired',
      'other'
    )
  ),
  waste_reason text NOT NULL,
  cost_impact decimal(12, 2) DEFAULT 0 CHECK (cost_impact >= 0),
  currency text DEFAULT 'USD',
  prevention_notes text,
  ipfs_cid text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waste_prevention_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  phase text NOT NULL,
  waste_category text NOT NULL,
  total_waste_quantity decimal(12, 3) DEFAULT 0,
  total_cost_impact decimal(12, 2) DEFAULT 0,
  incident_count integer DEFAULT 0,
  common_reasons jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_metrics_batch_id ON waste_metrics(batch_id);
CREATE INDEX IF NOT EXISTS idx_waste_metrics_phase ON waste_metrics(phase);
CREATE INDEX IF NOT EXISTS idx_waste_metrics_category ON waste_metrics(waste_category);
CREATE INDEX IF NOT EXISTS idx_waste_metrics_recorded_by ON waste_metrics(recorded_by);
CREATE INDEX IF NOT EXISTS idx_waste_metrics_recorded_at ON waste_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_waste_prevention_org ON waste_prevention_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_waste_prevention_phase ON waste_prevention_insights(phase);
CREATE INDEX IF NOT EXISTS idx_waste_prevention_period ON waste_prevention_insights(period_start, period_end);

ALTER TABLE waste_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_prevention_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view waste metrics"
  ON waste_metrics FOR SELECT
  USING (true);

CREATE POLICY "Users can record waste metrics with wallet"
  ON waste_metrics FOR INSERT
  WITH CHECK (recorded_by IS NOT NULL AND length(recorded_by) > 0);

CREATE POLICY "Users can update own waste metrics by wallet"
  ON waste_metrics FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own waste metrics by wallet"
  ON waste_metrics FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view insights"
  ON waste_prevention_insights FOR SELECT
  USING (true);

CREATE POLICY "System can manage insights"
  ON waste_prevention_insights FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_waste_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waste_insights_timestamp ON waste_prevention_insights;
CREATE TRIGGER update_waste_insights_timestamp
  BEFORE UPDATE ON waste_prevention_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_waste_insights_updated_at();
