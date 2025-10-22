import { createClient } from '@supabase/supabase-js';
import { CertificateMetadata } from './certificateService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface StoredCertificate {
  id: string;
  certificate_id: string;
  batch_number: string;
  batch_id: string;
  generated_by: string;
  generated_at: string;
  certificate_hash: string;
  ipfs_hash?: string;
  blockchain_verified: boolean;
  participants: {
    collector?: string;
    tester?: string;
    processor?: string;
    manufacturer?: string;
  };
  metadata?: Record<string, any>;
  created_at: string;
}

export async function saveCertificateMetadata(
  batchId: string,
  metadata: CertificateMetadata
): Promise<StoredCertificate | null> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping certificate storage');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('batch_certificates')
      .insert({
        certificate_id: metadata.certificateId,
        batch_number: metadata.batchNumber,
        batch_id: batchId,
        generated_by: metadata.generatedBy,
        generated_at: metadata.generatedAt,
        certificate_hash: metadata.certificateHash,
        ipfs_hash: metadata.ipfsHash,
        blockchain_verified: metadata.blockchainVerified,
        participants: metadata.participants
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving certificate metadata:', error);
      return null;
    }

    return data as StoredCertificate;
  } catch (error) {
    console.error('Error saving certificate:', error);
    return null;
  }
}

export async function getCertificateByBatchNumber(
  batchNumber: string
): Promise<StoredCertificate[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('batch_certificates')
      .select('*')
      .eq('batch_number', batchNumber)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }

    return data as StoredCertificate[];
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return [];
  }
}

export async function getCertificateByCertificateId(
  certificateId: string
): Promise<StoredCertificate | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('batch_certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (error) {
      console.error('Error fetching certificate:', error);
      return null;
    }

    return data as StoredCertificate;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return null;
  }
}

export async function getCertificatesByUser(
  userId: string
): Promise<StoredCertificate[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('batch_certificates')
      .select('*')
      .eq('generated_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user certificates:', error);
      return [];
    }

    return data as StoredCertificate[];
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return [];
  }
}

export async function verifyCertificateByHash(
  certificateHash: string,
  batchNumber: string
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('batch_certificates')
      .select('certificate_hash, batch_number, blockchain_verified')
      .eq('certificate_hash', certificateHash)
      .eq('batch_number', batchNumber)
      .single();

    if (error) {
      return false;
    }

    return data?.blockchain_verified === true;
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return false;
  }
}

export async function getAllCertificates(): Promise<StoredCertificate[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('batch_certificates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching all certificates:', error);
      return [];
    }

    return data as StoredCertificate[];
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    return [];
  }
}
