/*
  # Create Processor Batches System

  ## Overview
  This migration creates the necessary tables for processors to submit processing information,
  including batch lookup via ID or QR, GPS location, weather data, processing details,
  weight conversion ratios, chemicals/additives used, rating of previous chain (tester),
  and document uploads.

  ## New Tables
  
  ### `processor_batches`
  Main table for storing processor batch submissions
  - `id` (uuid, primary key) - Unique identifier
  - `tester_batch_id` (uuid) - Reference to tester_batches being processed
  - `processor_id` (uuid) - Reference to user who processed the batch
  - `gps_latitude` (decimal) - Auto-captured GPS latitude
  - `gps_longitude` (decimal) - Auto-captured GPS longitude
  - `weather_condition` (text) - Auto-captured weather
  - `temperature` (decimal) - Auto-captured temperature
  - `processing_date` (timestamptz) - When processing was performed
  - `processing_type` (text) - Type of processing performed
  - `input_weight` (decimal) - Weight of input material
  - `output_weight` (decimal) - Weight of output material
  - `conversion_ratio` (decimal) - Conversion or loss ratio
  - `chemicals_additives_used` (text) - Chemicals or additives used
  - `tester_rating` (integer) - Rating given to tester (1-5)
  - `tester_rating_notes` (text, nullable) - Optional notes for rating
  - `qr_code_data` (text) - Generated QR code data for this processing
  - `status` (text) - Processing status (completed, verified, etc.)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `processor_documents`
  Table for storing uploaded documents related to processing
  - `id` (uuid, primary key) - Unique identifier
  - `processor_batch_id` (uuid) - Reference to processor_batches
  - `file_name` (text) - Name of the uploaded file
  - `file_url` (text) - URL to the stored file
  - `file_type` (text) - Type of file (image, pdf, etc.)
  - `uploaded_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable RLS on all tables
  - Processors can create and view their own processing batches
  - Processors can upload documents for their own processing
  - Testers can view processing on their batches
  - Other roles can view based on supply chain permissions

  ## Indexes
  - Index on processor_id for fast lookup
  - Index on tester_batch_id for finding processing for a batch
  - Index on created_at for chronological queries
*/

CREATE TABLE IF NOT EXISTS processor_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_batch_id uuid NOT NULL REFERENCES tester_batches(id) ON DELETE CASCADE,
  processor_id uuid NOT NULL REFERENCES auth.users(id),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  processing_date timestamptz NOT NULL DEFAULT now(),
  processing_type text NOT NULL,
  input_weight decimal(10, 2) NOT NULL CHECK (input_weight > 0),
  output_weight decimal(10, 2) NOT NULL CHECK (output_weight > 0),
  conversion_ratio decimal(5, 2) NOT NULL,
  chemicals_additives_used text NOT NULL,
  tester_rating integer NOT NULL CHECK (tester_rating >= 1 AND tester_rating <= 5),
  tester_rating_notes text,
  qr_code_data text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_batch_id uuid NOT NULL REFERENCES processor_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processor_batches_processor_id ON processor_batches(processor_id);
CREATE INDEX IF NOT EXISTS idx_processor_batches_tester_batch_id ON processor_batches(tester_batch_id);
CREATE INDEX IF NOT EXISTS idx_processor_batches_created_at ON processor_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processor_documents_processor_batch_id ON processor_documents(processor_batch_id);

ALTER TABLE processor_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE processor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Processors can view own processing batches"
  ON processor_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = processor_id);

CREATE POLICY "Testers can view processing on their batches"
  ON processor_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tester_batches
      WHERE tester_batches.id = processor_batches.tester_batch_id
      AND tester_batches.tester_id = auth.uid()
    )
  );

CREATE POLICY "Processors can create processing batches"
  ON processor_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = processor_id);

CREATE POLICY "Processors can update own processing batches"
  ON processor_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = processor_id)
  WITH CHECK (auth.uid() = processor_id);

CREATE POLICY "Processors can delete own processing batches"
  ON processor_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = processor_id);

CREATE POLICY "Users can view processor documents"
  ON processor_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM processor_batches
      WHERE processor_batches.id = processor_documents.processor_batch_id
      AND (
        processor_batches.processor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tester_batches
          WHERE tester_batches.id = processor_batches.tester_batch_id
          AND tester_batches.tester_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Processors can upload documents for own processing"
  ON processor_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM processor_batches
      WHERE processor_batches.id = processor_documents.processor_batch_id
      AND processor_batches.processor_id = auth.uid()
    )
  );

CREATE POLICY "Processors can delete documents for own processing"
  ON processor_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM processor_batches
      WHERE processor_batches.id = processor_documents.processor_batch_id
      AND processor_batches.processor_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_processor_batches_updated_at ON processor_batches;
CREATE TRIGGER update_processor_batches_updated_at
  BEFORE UPDATE ON processor_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();