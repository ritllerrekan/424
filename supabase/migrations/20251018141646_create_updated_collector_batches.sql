/*
  # Create Updated Collector Batches System

  ## Overview
  Creates tables for collectors to log collected batches with GPS, weather data, harvest details, and documents.

  ## New Tables
  
  ### `collector_batches`
  - `id` (uuid, primary key)
  - `collector_id` (uuid) - User who collected
  - `batch_number` (text) - Unique batch identifier
  - `seed_crop_name` (text) - Type of seed/crop
  - `gps_latitude` (decimal) - GPS latitude
  - `gps_longitude` (decimal) - GPS longitude
  - `weather_condition` (text) - Weather condition
  - `temperature` (decimal) - Temperature
  - `harvest_date` (date) - Harvest date
  - `pesticide_used` (boolean) - Whether pesticide was used
  - `pesticide_name` (text, nullable) - Name of pesticide if used
  - `pesticide_quantity` (text, nullable) - Quantity of pesticide if used
  - `price_per_unit` (decimal) - Price per unit
  - `weight_total` (decimal) - Total weight
  - `total_price` (decimal) - Total price
  - `qr_code_data` (text) - QR code data
  - `status` (text) - Status (default: 'submitted')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `batch_documents`
  - `id` (uuid, primary key)
  - `batch_id` (uuid) - Reference to collector_batches
  - `file_name` (text)
  - `file_url` (text)
  - `file_type` (text)
  - `uploaded_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Collectors can create and view their own batches
  - Proper access control for document uploads and viewing
*/

CREATE TABLE IF NOT EXISTS collector_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id uuid NOT NULL REFERENCES auth.users(id),
  batch_number text NOT NULL UNIQUE,
  seed_crop_name text NOT NULL,
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  harvest_date date NOT NULL,
  pesticide_used boolean DEFAULT false,
  pesticide_name text,
  pesticide_quantity text,
  price_per_unit decimal(10, 2) NOT NULL CHECK (price_per_unit >= 0),
  weight_total decimal(10, 2) NOT NULL CHECK (weight_total > 0),
  total_price decimal(10, 2) NOT NULL CHECK (total_price >= 0),
  qr_code_data text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batch_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES collector_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collector_batches_collector_id ON collector_batches(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_batches_batch_number ON collector_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_collector_batches_created_at ON collector_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_documents_batch_id ON batch_documents(batch_id);

ALTER TABLE collector_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors can view own batches"
  ON collector_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = collector_id);

CREATE POLICY "Collectors can create batches"
  ON collector_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = collector_id);

CREATE POLICY "Collectors can update own batches"
  ON collector_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = collector_id)
  WITH CHECK (auth.uid() = collector_id);

CREATE POLICY "Collectors can delete own batches"
  ON collector_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = collector_id);

CREATE POLICY "Users can view batch documents"
  ON batch_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = batch_documents.batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can upload documents"
  ON batch_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = batch_documents.batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can delete documents"
  ON batch_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = batch_documents.batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collector_batches_updated_at ON collector_batches;
CREATE TRIGGER update_collector_batches_updated_at
  BEFORE UPDATE ON collector_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();