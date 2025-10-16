import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'collector' | 'tester' | 'processor' | 'manufacturer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization: string;
  phone: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  batch_number: string;
  product_name: string;
  quantity: number;
  unit: string;
  current_phase: 'collection' | 'testing' | 'processing' | 'manufacturing' | 'completed';
  status: 'active' | 'completed' | 'rejected';
  blockchain_tx_hash: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BatchPhase {
  id: string;
  batch_id: string;
  phase_type: 'collection' | 'testing' | 'processing' | 'manufacturing';
  handler_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  location: string;
  temperature: number;
  humidity: number;
  quality_score: number;
  notes: string;
  blockchain_tx_hash: string;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  batch_id: string | null;
  transaction_type: 'batch_created' | 'phase_update' | 'test_recorded' | 'transfer';
  blockchain_tx_hash: string;
  gas_used: number;
  status: 'pending' | 'confirmed' | 'failed';
  metadata: Record<string, any>;
  created_at: string;
}

export interface WasteMetric {
  id: string;
  user_id: string;
  batch_id: string | null;
  waste_amount: number;
  waste_unit: string;
  waste_reason: string;
  cost_impact: number;
  prevention_notes: string;
  recorded_at: string;
  created_at: string;
}
