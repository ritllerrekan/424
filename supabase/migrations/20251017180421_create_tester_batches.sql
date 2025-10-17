/*
  # Create Tester Batches System

  ## Overview
  Creates tables for testers to log quality testing with ratings and lab information.

  ## New Tables
  
  ### `tester_batches`
  - `id` (uuid, primary key)
  - `collector_batch_id` (uuid) - Reference to collector batch
  - `tester_id` (uuid) - User who tested
  - `gps_latitude` (decimal)
  - `gps_longitude` (decimal)
  - `weather_condition` (text)
  - `temperature` (decimal)
  - `quality_grade_score` (integer)
  - `quality_grade_notes` (text)
  - `lab_name` (text)
  - `collector_rating` (integer)
  - `collector_rating_notes` (text)
  - `qr_code_data` (text)
  - `status` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `tester_documents`
  - `id` (uuid, primary key)
  - `tester_batch_id` (uuid)
  - `file_name` (text)
  - `file_url` (text)
  - `file_type` (text)
  - `uploaded_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Testers can create and view their own batches
  - Collectors can view testing on their batches
*/

CREATE TABLE IF NOT EXISTS tester_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_batch_id uuid NOT NULL REFERENCES collector_batches(id) ON DELETE CASCADE,
  tester_id uuid NOT NULL REFERENCES auth.users(id),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  quality_grade_score integer NOT NULL CHECK (quality_grade_score >= 1 AND quality_grade_score <= 10),
  quality_grade_notes text,
  lab_name text NOT NULL,
  collector_rating integer NOT NULL CHECK (collector_rating >= 1 AND collector_rating <= 5),
  collector_rating_notes text,
  qr_code_data text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tester_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_batch_id uuid NOT NULL REFERENCES tester_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tester_batches_tester_id ON tester_batches(tester_id);
CREATE INDEX IF NOT EXISTS idx_tester_batches_collector_batch_id ON tester_batches(collector_batch_id);
CREATE INDEX IF NOT EXISTS idx_tester_batches_created_at ON tester_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tester_documents_tester_batch_id ON tester_documents(tester_batch_id);

ALTER TABLE tester_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Testers can view own batches"
  ON tester_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = tester_id);

CREATE POLICY "Collectors can view testing on their batches"
  ON tester_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collector_batches
      WHERE collector_batches.id = tester_batches.collector_batch_id
      AND collector_batches.collector_id = auth.uid()
    )
  );

CREATE POLICY "Testers can create batches"
  ON tester_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tester_id);

CREATE POLICY "Testers can update own batches"
  ON tester_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = tester_id)
  WITH CHECK (auth.uid() = tester_id);

CREATE POLICY "Testers can delete own batches"
  ON tester_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = tester_id);

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

CREATE POLICY "Testers can upload documents"
  ON tester_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tester_batches
      WHERE tester_batches.id = tester_documents.tester_batch_id
      AND tester_batches.tester_id = auth.uid()
    )
  );

CREATE POLICY "Testers can delete documents"
  ON tester_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tester_batches
      WHERE tester_batches.id = tester_documents.tester_batch_id
      AND tester_batches.tester_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_tester_batches_updated_at ON tester_batches;
CREATE TRIGGER update_tester_batches_updated_at
  BEFORE UPDATE ON tester_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();