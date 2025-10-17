/*
  # Create Collector Batches System

  ## Overview
  Creates tables for waste collectors to log collected batches with GPS, weather data, and documents.

  ## New Tables
  
  ### `collector_batches`
  - `id` (uuid, primary key)
  - `collector_id` (uuid) - User who collected
  - `gps_latitude` (decimal)
  - `gps_longitude` (decimal)
  - `weather_condition` (text)
  - `temperature` (decimal)
  - `waste_type` (text)
  - `quantity` (decimal)
  - `pickup_location` (text)
  - `collection_date` (timestamptz)
  - `qr_code_data` (text)
  - `status` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `collector_documents`
  - `id` (uuid, primary key)
  - `collector_batch_id` (uuid)
  - `file_name` (text)
  - `file_url` (text)
  - `file_type` (text)
  - `uploaded_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Collectors can create and view their own batches
*/

CREATE TABLE IF NOT EXISTS collector_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id uuid NOT NULL REFERENCES auth.users(id),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  waste_type text NOT NULL,
  quantity decimal(10, 2) NOT NULL CHECK (quantity > 0),
  pickup_location text NOT NULL,
  collection_date timestamptz NOT NULL DEFAULT now(),
  qr_code_data text,
  status text DEFAULT 'collected',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collector_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_batch_id uuid NOT NULL REFERENCES collector_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collector_batches_collector_id ON collector_batches(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_batches_created_at ON collector_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collector_documents_collector_batch_id ON collector_documents(collector_batch_id);

ALTER TABLE collector_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE collector_documents ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view collector documents"
  ON collector_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = collector_documents.collector_batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can upload documents"
  ON collector_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = collector_documents.collector_batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can delete documents"
  ON collector_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = collector_documents.collector_batch_id
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