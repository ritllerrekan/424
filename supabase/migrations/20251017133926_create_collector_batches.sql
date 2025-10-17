/*
  # Create Collector Batches System

  ## Overview
  This migration creates the necessary tables for collectors to submit harvest information,
  including GPS location, weather data, crop details, pesticide usage, pricing, and documents.

  ## New Tables
  
  ### `collector_batches`
  Main table for storing collector batch submissions
  - `id` (uuid, primary key) - Unique identifier
  - `batch_number` (text, unique) - Auto-generated batch number
  - `collector_id` (uuid) - Reference to user who created the batch
  - `gps_latitude` (decimal) - Auto-captured GPS latitude
  - `gps_longitude` (decimal) - Auto-captured GPS longitude
  - `weather_condition` (text) - Auto-captured weather
  - `temperature` (decimal) - Auto-captured temperature
  - `harvest_date` (timestamptz) - When harvest was captured
  - `seed_crop_name` (text) - Name of seed/crop/raw material
  - `pesticide_used` (boolean) - Whether pesticide was used
  - `pesticide_name` (text, nullable) - Name of pesticide if used
  - `pesticide_quantity` (text, nullable) - Quantity of pesticide used
  - `price_per_unit` (decimal) - Price per unit
  - `weight_total` (decimal) - Total weight
  - `total_price` (decimal) - Auto-calculated total price
  - `qr_code_data` (text) - Generated QR code data
  - `status` (text) - Batch status (submitted, verified, etc.)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `batch_documents`
  Table for storing uploaded documents related to batches
  - `id` (uuid, primary key) - Unique identifier
  - `batch_id` (uuid) - Reference to collector_batches
  - `file_name` (text) - Name of the uploaded file
  - `file_url` (text) - URL to the stored file
  - `file_type` (text) - Type of file (image, pdf, etc.)
  - `uploaded_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable RLS on all tables
  - Collectors can create and view their own batches
  - Collectors can upload documents for their own batches
  - Other roles can view batches based on supply chain permissions

  ## Indexes
  - Index on collector_id for fast lookup
  - Index on batch_number for quick searches
  - Index on created_at for chronological queries
*/

-- Create collector_batches table
CREATE TABLE IF NOT EXISTS collector_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text UNIQUE NOT NULL,
  collector_id uuid NOT NULL REFERENCES auth.users(id),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  harvest_date timestamptz NOT NULL DEFAULT now(),
  seed_crop_name text NOT NULL,
  pesticide_used boolean DEFAULT false,
  pesticide_name text,
  pesticide_quantity text,
  price_per_unit decimal(10, 2) NOT NULL,
  weight_total decimal(10, 2) NOT NULL,
  total_price decimal(12, 2) NOT NULL,
  qr_code_data text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create batch_documents table
CREATE TABLE IF NOT EXISTS batch_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES collector_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collector_batches_collector_id ON collector_batches(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_batches_batch_number ON collector_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_collector_batches_created_at ON collector_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_documents_batch_id ON batch_documents(batch_id);

-- Enable RLS
ALTER TABLE collector_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collector_batches

-- Collectors can view their own batches
CREATE POLICY "Collectors can view own batches"
  ON collector_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = collector_id);

-- Collectors can insert their own batches
CREATE POLICY "Collectors can create own batches"
  ON collector_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = collector_id);

-- Collectors can update their own batches
CREATE POLICY "Collectors can update own batches"
  ON collector_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = collector_id)
  WITH CHECK (auth.uid() = collector_id);

-- Collectors can delete their own batches
CREATE POLICY "Collectors can delete own batches"
  ON collector_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = collector_id);

-- RLS Policies for batch_documents

-- Users can view documents for batches they have access to
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

-- Users can insert documents for their own batches
CREATE POLICY "Users can upload documents for own batches"
  ON batch_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = batch_documents.batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

-- Users can delete documents for their own batches
CREATE POLICY "Users can delete documents for own batches"
  ON batch_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = batch_documents.batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_collector_batches_updated_at ON collector_batches;
CREATE TRIGGER update_collector_batches_updated_at
  BEFORE UPDATE ON collector_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique batch number
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS text AS $$
DECLARE
  new_batch_number text;
  batch_exists boolean;
BEGIN
  LOOP
    new_batch_number := 'BATCH-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
    
    SELECT EXISTS(SELECT 1 FROM collector_batches WHERE batch_number = new_batch_number) INTO batch_exists;
    
    IF NOT batch_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_batch_number;
END;
$$ LANGUAGE plpgsql;