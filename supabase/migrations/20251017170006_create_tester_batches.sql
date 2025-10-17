/*
  # Create Tester Batches System

  ## Overview
  This migration creates the necessary tables for testers to submit quality testing information,
  including batch lookup via ID or QR, GPS location, weather data, test results, lab details,
  rating of previous chain (collector), and document uploads.

  ## New Tables
  
  ### `tester_batches`
  Main table for storing tester batch submissions
  - `id` (uuid, primary key) - Unique identifier
  - `collector_batch_id` (uuid) - Reference to collector_batches being tested
  - `tester_id` (uuid) - Reference to user who tested the batch
  - `gps_latitude` (decimal) - Auto-captured GPS latitude
  - `gps_longitude` (decimal) - Auto-captured GPS longitude
  - `weather_condition` (text) - Auto-captured weather
  - `temperature` (decimal) - Auto-captured temperature
  - `test_date` (timestamptz) - When test was performed
  - `quality_grade_score` (decimal) - Quality grade score (0-100)
  - `contaminant_level` (decimal) - Contaminant/residue level
  - `purity_level` (decimal) - Purity level percentage
  - `lab_name` (text) - Name of testing lab
  - `collector_rating` (integer) - Rating given to collector (1-5)
  - `collector_rating_notes` (text, nullable) - Optional notes for rating
  - `qr_code_data` (text) - Generated QR code data for this test
  - `status` (text) - Test status (completed, verified, etc.)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `tester_documents`
  Table for storing uploaded documents related to tests
  - `id` (uuid, primary key) - Unique identifier
  - `tester_batch_id` (uuid) - Reference to tester_batches
  - `file_name` (text) - Name of the uploaded file
  - `file_url` (text) - URL to the stored file
  - `file_type` (text) - Type of file (image, pdf, etc.)
  - `uploaded_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable RLS on all tables
  - Testers can create and view their own test batches
  - Testers can upload documents for their own tests
  - Collectors can view tests on their batches
  - Other roles can view based on supply chain permissions

  ## Indexes
  - Index on tester_id for fast lookup
  - Index on collector_batch_id for finding tests for a batch
  - Index on created_at for chronological queries
*/

-- Create tester_batches table
CREATE TABLE IF NOT EXISTS tester_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_batch_id uuid NOT NULL REFERENCES collector_batches(id) ON DELETE CASCADE,
  tester_id uuid NOT NULL REFERENCES auth.users(id),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  test_date timestamptz NOT NULL DEFAULT now(),
  quality_grade_score decimal(5, 2) NOT NULL CHECK (quality_grade_score >= 0 AND quality_grade_score <= 100),
  contaminant_level decimal(10, 4) NOT NULL,
  purity_level decimal(5, 2) NOT NULL CHECK (purity_level >= 0 AND purity_level <= 100),
  lab_name text NOT NULL,
  collector_rating integer NOT NULL CHECK (collector_rating >= 1 AND collector_rating <= 5),
  collector_rating_notes text,
  qr_code_data text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tester_documents table
CREATE TABLE IF NOT EXISTS tester_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_batch_id uuid NOT NULL REFERENCES tester_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tester_batches_tester_id ON tester_batches(tester_id);
CREATE INDEX IF NOT EXISTS idx_tester_batches_collector_batch_id ON tester_batches(collector_batch_id);
CREATE INDEX IF NOT EXISTS idx_tester_batches_created_at ON tester_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tester_documents_tester_batch_id ON tester_documents(tester_batch_id);

-- Enable RLS
ALTER TABLE tester_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tester_batches

-- Testers can view their own test batches
CREATE POLICY "Testers can view own test batches"
  ON tester_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = tester_id);

-- Collectors can view tests on their batches
CREATE POLICY "Collectors can view tests on their batches"
  ON tester_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = tester_batches.collector_batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

-- Testers can insert their own test batches
CREATE POLICY "Testers can create test batches"
  ON tester_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tester_id);

-- Testers can update their own test batches
CREATE POLICY "Testers can update own test batches"
  ON tester_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = tester_id)
  WITH CHECK (auth.uid() = tester_id);

-- Testers can delete their own test batches
CREATE POLICY "Testers can delete own test batches"
  ON tester_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = tester_id);

-- RLS Policies for tester_documents

-- Users can view documents for test batches they have access to
CREATE POLICY "Users can view tester documents"
  ON tester_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tester_batches
      WHERE tester_batches.id = tester_documents.tester_batch_id
      AND (
        tester_batches.tester_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM collector_batches
          WHERE collector_batches.id = tester_batches.collector_batch_id
          AND collector_batches.collector_id = auth.uid()
        )
      )
    )
  );

-- Testers can insert documents for their own test batches
CREATE POLICY "Testers can upload documents for own tests"
  ON tester_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tester_batches
      WHERE tester_batches.id = tester_documents.tester_batch_id
      AND tester_batches.tester_id = auth.uid()
    )
  );

-- Testers can delete documents for their own test batches
CREATE POLICY "Testers can delete documents for own tests"
  ON tester_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tester_batches
      WHERE tester_batches.id = tester_documents.tester_batch_id
      AND tester_batches.tester_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at for tester_batches
DROP TRIGGER IF EXISTS update_tester_batches_updated_at ON tester_batches;
CREATE TRIGGER update_tester_batches_updated_at
  BEFORE UPDATE ON tester_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();