import { createClient } from '@supabase/supabase-js';
import { GeneratedQRCode } from './qrCodeService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface StoredQRCode {
  id: string;
  batch_id: string;
  batch_number: string;
  phase: string;
  qr_data_url: string;
  qr_ipfs_hash?: string;
  label_ipfs_hash?: string;
  contract_address: string;
  network: string;
  verification_url: string;
  metadata_ipfs_hash?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function saveQRCode(
  qrCode: GeneratedQRCode,
  userId: string
): Promise<StoredQRCode> {
  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      batch_id: qrCode.qrData.batchId,
      batch_number: qrCode.qrData.batchNumber,
      phase: qrCode.qrData.phase,
      qr_data_url: qrCode.dataUrl,
      qr_ipfs_hash: qrCode.ipfsHash,
      contract_address: qrCode.qrData.contractAddress,
      network: qrCode.qrData.network,
      verification_url: qrCode.qrData.verificationUrl,
      metadata_ipfs_hash: qrCode.qrData.ipfsHash,
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data as StoredQRCode;
}

export async function updateQRCodeIPFS(
  qrCodeId: string,
  ipfsHash: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('qr_codes')
    .update({
      qr_ipfs_hash: ipfsHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', qrCodeId)
    .eq('created_by', userId);

  if (error) throw error;
}

export async function updateLabelIPFS(
  qrCodeId: string,
  labelIpfsHash: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('qr_codes')
    .update({
      label_ipfs_hash: labelIpfsHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', qrCodeId)
    .eq('created_by', userId);

  if (error) throw error;
}

export async function getQRCodeByBatchId(
  batchId: string
): Promise<StoredQRCode | null> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error) throw error;
  return data as StoredQRCode | null;
}

export async function getQRCodesByUser(
  userId: string
): Promise<StoredQRCode[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as StoredQRCode[];
}

export async function getAllQRCodes(): Promise<StoredQRCode[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as StoredQRCode[];
}

export async function searchQRCodesByBatchNumber(
  batchNumber: string
): Promise<StoredQRCode[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .ilike('batch_number', `%${batchNumber}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as StoredQRCode[];
}

export async function deleteQRCode(
  qrCodeId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', qrCodeId)
    .eq('created_by', userId);

  if (error) throw error;
}

export async function getQRCodeStats(userId?: string) {
  let query = supabase
    .from('qr_codes')
    .select('phase', { count: 'exact' });

  if (userId) {
    query = query.eq('created_by', userId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const phaseBreakdown = data?.reduce((acc: Record<string, number>, item) => {
    acc[item.phase] = (acc[item.phase] || 0) + 1;
    return acc;
  }, {});

  return {
    total: count || 0,
    phaseBreakdown: phaseBreakdown || {}
  };
}
