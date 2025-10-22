/*
  # Notification System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (text) - Web3Auth user identifier
      - `type` (text) - Type of notification (batch_update, quality_issue, waste_threshold, transaction_confirmation)
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `severity` (text) - Severity level (info, warning, error, success)
      - `is_read` (boolean) - Whether notification has been read
      - `metadata` (jsonb) - Additional data (batch_id, transaction_hash, etc.)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on `notifications` table
    - Add policy for authenticated users to read their own notifications
    - Add policy for authenticated users to update their own notifications
    - Add policy for authenticated users to delete their own notifications
  
  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for sorting
    - Index on is_read for filtering unread notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('batch_update', 'quality_issue', 'waste_threshold', 'transaction_confirmation', 'batch_rejection', 'phase_change')),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = current_user);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = current_user)
  WITH CHECK (user_id = current_user);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = current_user);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;