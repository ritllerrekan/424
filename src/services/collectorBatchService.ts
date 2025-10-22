import { createClient } from '@supabase/supabase-js';
import { CollectorBatchData } from '../components/CollectorBatchForm';
import { uploadMultipleFilesToIPFS } from './ipfsUploadService';
import { notifyBatchUpdate, notifyWasteThreshold, notifyTransactionConfirmation } from './notificationService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface CollectorBatch {
  id: string;
  collector_id: string;
  batch_number: string;
  seed_crop_name: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  weather_condition: string;
  temperature: number | null;
  harvest_date: string;
  pesticide_used: boolean;
  pesticide_name: string;
  pesticide_quantity: string;
  price_per_unit: number;
  weight_total: number;
  total_price: number;
  qr_code_data: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BatchDocument {
  id: string;
  batch_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export async function createCollectorBatch(
  batchData: CollectorBatchData & { transactionHash?: string },
  wasteAmount: number = 0
): Promise<string> {
  try {
    let documentUrls: string[] = [];

    if (batchData.documents && batchData.documents.length > 0) {
      const files = batchData.documents.map(doc => doc.file);
      documentUrls = await uploadMultipleFilesToIPFS(files);
    }

    const { data: batch, error: batchError } = await supabase
      .from('collector_batches')
      .insert({
        collector_id: batchData.collectorId,
        batch_number: batchData.batchNumber,
        seed_crop_name: batchData.seedCropName,
        gps_latitude: batchData.gpsLatitude,
        gps_longitude: batchData.gpsLongitude,
        weather_condition: batchData.weatherCondition,
        temperature: batchData.temperature,
        harvest_date: batchData.harvestDate,
        pesticide_used: batchData.pesticideUsed,
        pesticide_name: batchData.pesticideName || null,
        pesticide_quantity: batchData.pesticideQuantity || null,
        price_per_unit: batchData.pricePerUnit,
        weight_total: batchData.weightTotal,
        total_price: batchData.totalPrice,
        qr_code_data: batchData.transactionHash || batchData.ipfsHash || '',
        status: 'submitted'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    if (documentUrls.length > 0 && batch) {
      const documents = batchData.documents.map((doc, index) => ({
        batch_id: batch.id,
        file_name: doc.file.name,
        file_url: documentUrls[index],
        file_type: doc.type
      }));

      const { error: docsError } = await supabase
        .from('batch_documents')
        .insert(documents);

      if (docsError) {
        console.error('Error uploading documents:', docsError);
      }
    }

    if (wasteAmount > 0 && batch) {
      await supabase.from('waste_metrics').insert({
        batch_id: batch.batch_number,
        phase: 'collection',
        waste_amount: wasteAmount,
        waste_type: 'spoilage',
        recorded_by: batchData.collectorId,
        recorded_at: new Date().toISOString()
      });

      if (wasteAmount > 50) {
        await notifyWasteThreshold(batchData.collectorId, wasteAmount, 50);
      }
    }

    await notifyBatchUpdate(
      batchData.collectorId,
      batch.id,
      batch.batch_number,
      'Collection'
    );

    if (batchData.transactionHash) {
      await notifyTransactionConfirmation(
        batchData.collectorId,
        batchData.transactionHash,
        batch.batch_number
      );
    }

    return batch.id;
  } catch (error) {
    console.error('Error creating collector batch:', error);
    throw error;
  }
}

export async function getCollectorBatches(collectorId: string): Promise<CollectorBatch[]> {
  try {
    const { data, error } = await supabase
      .from('collector_batches')
      .select('*')
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as CollectorBatch[];
  } catch (error) {
    console.error('Error fetching collector batches:', error);
    return [];
  }
}

export async function getBatchDocuments(batchId: string): Promise<BatchDocument[]> {
  try {
    const { data, error } = await supabase
      .from('batch_documents')
      .select('*')
      .eq('batch_id', batchId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return data as BatchDocument[];
  } catch (error) {
    console.error('Error fetching batch documents:', error);
    return [];
  }
}

export async function updateBatchStatus(batchId: string, status: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('collector_batches')
      .update({ status })
      .eq('id', batchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating batch status:', error);
    throw error;
  }
}

export async function deleteBatch(batchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('collector_batches')
      .delete()
      .eq('id', batchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting batch:', error);
    throw error;
  }
}
