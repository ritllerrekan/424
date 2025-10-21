/*
  # Create Transaction Cache System

  1. New Tables
    - `transaction_cache`
      - `id` (text, primary key) - Unique identifier (txHash-batchId)
      - `transaction_hash` (text, indexed) - Blockchain transaction hash
      - `block_number` (bigint) - Block number
      - `block_timestamp` (bigint) - Block timestamp (unix)
      - `from_address` (text) - Sender address
      - `to_address` (text) - Contract address
      - `value` (text) - Transaction value in wei
      - `gas_used` (text) - Gas consumed
      - `gas_price` (text) - Gas price in wei
      - `status` (text) - Transaction status (pending/confirmed/failed)
      - `event_type` (text, indexed) - Event type
      - `batch_id` (text, indexed) - Associated batch ID
      - `batch_number` (text) - Batch number
      - `phase` (text) - Supply chain phase
      - `actor` (text) - Address that performed action
      - `description` (text) - Human-readable description
      - `user_id` (text, indexed) - User who owns/initiated transaction
      - `metadata` (jsonb) - Additional event metadata
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `transaction_cache` table
    - Add policy for users to read their own transactions
    - Add policy for users to insert their own transactions
    - Add policy for users to update their own transactions

  3. Indexes
    - Index on transaction_hash for quick lookups
    - Index on block_number for range queries
    - Index on event_type for filtering
    - Index on batch_id for batch-specific queries
    - Index on user_id for user-specific queries
    - Composite index on (user_id, block_timestamp) for sorted user transactions
*/

CREATE TABLE IF NOT EXISTS transaction_cache (
  id text PRIMARY KEY,
  transaction_hash text NOT NULL,
  block_number bigint NOT NULL DEFAULT 0,
  block_timestamp bigint NOT NULL DEFAULT 0,
  from_address text NOT NULL,
  to_address text NOT NULL,
  value text NOT NULL DEFAULT '0',
  gas_used text NOT NULL DEFAULT '0',
  gas_price text NOT NULL DEFAULT '0',
  status text NOT NULL DEFAULT 'pending',
  event_type text NOT NULL,
  batch_id text,
  batch_number text,
  phase text,
  actor text,
  description text NOT NULL,
  user_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_hash 
  ON transaction_cache(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_block 
  ON transaction_cache(block_number DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_event_type 
  ON transaction_cache(event_type);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_batch_id 
  ON transaction_cache(batch_id);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_user_id 
  ON transaction_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_user_timestamp 
  ON transaction_cache(user_id, block_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_cache_status 
  ON transaction_cache(status);

ALTER TABLE transaction_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transaction_cache
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transaction_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own transactions"
  ON transaction_cache
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION update_transaction_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_cache_updated_at
  BEFORE UPDATE ON transaction_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_cache_updated_at();
