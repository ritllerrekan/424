/*
  # Create Manufacturer Batches System

  ## Overview
  This migration creates the necessary tables for manufacturers to update products with manufacturing details,
  including batch lookup via ID or QR, GPS location, weather data, product information (name, manufacture date,
  expiry date), rating of previous chain (processor), and document uploads.

  ## New Tables
  
  ### `manufacturer_batches`
  Main table for storing manufacturer batch information
  - `id` (uuid, primary key) - Unique identifier
  - `processor_batch_id` (uuid) - Reference to processor_batches being manufactured
  - `manufacturer_id` (uuid) - Reference to user who manufactured the batch
  - `gps_latitude` (decimal) - Auto-captured GPS latitude
  - `gps_longitude` (decimal) - Auto-captured GPS longitude
  - `weather_condition` (text) - Auto-captured weather
  - `temperature` (decimal) - Auto-captured temperature
  - `product_name` (text) - Name of the manufactured product
  - `manufacture_date` (date) - Date of manufacture
  - `expiry_date` (date) - Expiry date of the product
  - `processor_rating` (integer) - Rating given to processor (1-5)
  - `processor_rating_notes` (text, nullable) - Optional notes for rating
  - `qr_code_data` (text) - Generated QR code data for this manufacture
  - `status` (text) - Manufacturing status (completed, shipped, etc.)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `manufacturer_documents`
  Table for storing uploaded documents related to manufacturing
  - `id` (uuid, primary key) - Unique identifier
  - `manufacturer_batch_id` (uuid) - Reference to manufacturer_batches
  - `file_name` (text) - Name of the uploaded file
  - `file_url` (text) - URL to the stored file
  - `file_type` (text) - Type of file (image, pdf, etc.)
  - `uploaded_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable RLS on all tables
  - Manufacturers can create and view their own manufactured batches
  - Manufacturers can upload documents for their own manufactured products
  - Processors can view manufacturing of their batches
  - Other roles can view based on supply chain permissions

  ## Indexes
  - Index on manufacturer_id for fast lookup
  - Index on processor_batch_id for finding manufacturing for a batch
  - Index on created_at for chronological queries
*/

-- Create manufacturer_batches table
CREATE TABLE IF NOT EXISTS manufacturer_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_batch_id uuid NOT NULL REFERENCES processor_batches(id) ON DELETE CASCADE,
  manufacturer_id uuid NOT NULL REFERENCES auth.users(id),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  weather_condition text,
  temperature decimal(5, 2),
  product_name text NOT NULL,
  manufacture_date date NOT NULL,
  expiry_date date NOT NULL,
  processor_rating integer NOT NULL CHECK (processor_rating >= 1 AND processor_rating <= 5),
  processor_rating_notes text,
  qr_code_data text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (expiry_date > manufacture_date)
);

-- Create manufacturer_documents table
CREATE TABLE IF NOT EXISTS manufacturer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_batch_id uuid NOT NULL REFERENCES manufacturer_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manufacturer_batches_manufacturer_id ON manufacturer_batches(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_batches_processor_batch_id ON manufacturer_batches(processor_batch_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_batches_created_at ON manufacturer_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manufacturer_documents_manufacturer_batch_id ON manufacturer_documents(manufacturer_batch_id);

-- Enable RLS
ALTER TABLE manufacturer_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manufacturer_batches

-- Manufacturers can view their own manufactured batches
CREATE POLICY "Manufacturers can view own manufactured batches"
  ON manufacturer_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = manufacturer_id);

-- Processors can view manufacturing of their batches
CREATE POLICY "Processors can view manufacturing of their batches"
  ON manufacturer_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM processor_batches
      WHERE processor_batches.id = manufacturer_batches.processor_batch_id
      AND processor_batches.processor_id = auth.uid()
    )
  );

-- Manufacturers can insert their own manufactured batches
CREATE POLICY "Manufacturers can create manufactured batches"
  ON manufacturer_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manufacturer_id);

-- Manufacturers can update their own manufactured batches
CREATE POLICY "Manufacturers can update own manufactured batches"
  ON manufacturer_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = manufacturer_id)
  WITH CHECK (auth.uid() = manufacturer_id);

-- Manufacturers can delete their own manufactured batches
CREATE POLICY "Manufacturers can delete own manufactured batches"
  ON manufacturer_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = manufacturer_id);

-- RLS Policies for manufacturer_documents

-- Users can view documents for manufactured batches they have access to
CREATE POLICY "Users can view manufacturer documents"
  ON manufacturer_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM manufacturer_batches
      WHERE manufacturer_batches.id = manufacturer_documents.manufacturer_batch_id
      AND (
        manufacturer_batches.manufacturer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM processor_batches
          WHERE processor_batches.id = manufacturer_batches.processor_batch_id
          AND processor_batches.processor_id = auth.uid()
        )
      )
    )
  );

-- Manufacturers can insert documents for their own manufactured batches
CREATE POLICY "Manufacturers can upload documents for own manufacturing"
  ON manufacturer_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM manufacturer_batches
      WHERE manufacturer_batches.id = manufacturer_documents.manufacturer_batch_id
      AND manufacturer_batches.manufacturer_id = auth.uid()
    )
  );

-- Manufacturers can delete documents for their own manufactured batches
CREATE POLICY "Manufacturers can delete documents for own manufacturing"
  ON manufacturer_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM manufacturer_batches
      WHERE manufacturer_batches.id = manufacturer_documents.manufacturer_batch_id
      AND manufacturer_batches.manufacturer_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at for manufacturer_batches
DROP TRIGGER IF EXISTS update_manufacturer_batches_updated_at ON manufacturer_batches;
CREATE TRIGGER update_manufacturer_batches_updated_at
  BEFORE UPDATE ON manufacturer_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();