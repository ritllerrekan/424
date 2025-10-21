/*
  # QR Code Metadata Storage

  1. New Tables
    - `qr_codes`
      - `id` (uuid, primary key)
      - `batch_id` (text, indexed) - References the batch ID
      - `batch_number` (text) - Human-readable batch number
      - `phase` (text) - Supply chain phase (collection, testing, processing, manufacturing)
      - `qr_data_url` (text) - Base64 QR code data URL
      - `qr_ipfs_hash` (text, nullable) - IPFS hash where QR code image is stored
      - `label_ipfs_hash` (text, nullable) - IPFS hash for printable label
      - `contract_address` (text) - Smart contract address
      - `network` (text) - Blockchain network
      - `verification_url` (text) - URL for batch verification
      - `metadata_ipfs_hash` (text, nullable) - IPFS hash of batch metadata
      - `created_by` (uuid) - References Web3Auth user who generated the QR code
      - `created_at` (timestamptz) - When QR code was generated
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `qr_codes` table
    - Add policy for authenticated users to read all QR codes
    - Add policy for authenticated users to create QR codes
    - Add policy for users to update their own QR codes
  
  3. Indexes
    - Index on `batch_id` for fast batch lookups
    - Index on `batch_number` for searching
    - Index on `created_by` for user-specific queries
    - Index on `created_at` for time-based queries
  
  4. Notes
    - QR codes are publicly readable to allow verification
    - Users can only update QR codes they created
    - Tracks both regular QR codes and printable labels
    - Stores both local data URL and IPFS references
*/

CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL,
  batch_number text NOT NULL,
  phase text NOT NULL,
  qr_data_url text NOT NULL,
  qr_ipfs_hash text,
  label_ipfs_hash text,
  contract_address text NOT NULL,
  network text NOT NULL DEFAULT 'base-sepolia',
  verification_url text NOT NULL,
  metadata_ipfs_hash text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_id ON qr_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_number ON qr_codes(batch_number);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_by ON qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at);

CREATE POLICY "QR codes are publicly readable"
  ON qr_codes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create QR codes"
  ON qr_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own QR codes"
  ON qr_codes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
