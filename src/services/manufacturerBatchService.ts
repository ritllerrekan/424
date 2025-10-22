import { createClient } from '@supabase/supabase-js';
import { uploadMultipleFilesToIPFS } from './ipfsUploadService';
import { notifyBatchUpdate, notifyWasteThreshold, notifyTransactionConfirmation } from './notificationService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ManufacturerBatch {
  id: string;
  processor_batch_id: string;
  manufacturer_id: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  weather_condition: string;
  temperature: number | null;
  product_name: string;
  brand_name: string;
  product_type: string;
  quantity: number;
  unit: string;
  location: string;
  manufacture_date: string;
  expiry_date: string;
  processor_rating: number;
  processor_rating_notes: string;
  qr_code_data: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ManufacturerDocument {
  id: string;
  manufacturer_batch_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface ManufacturerBatchData {
  manufacturerId: string;
  processorBatchId: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  weatherCondition: string;
  temperature: number | null;
  productName: string;
  brandName: string;
  productType: string;
  quantity: number;
  unit: string;
  location: string;
  manufactureDate: string;
  expiryDate: string;
  processorRating: number;
  processorRatingNotes: string;
  documents?: { file: File; type: string }[];
  transactionHash?: string;
  ipfsHash?: string;
}

export async function createManufacturerBatch(
  batchData: ManufacturerBatchData,
  wasteAmount: number = 0
): Promise<string> {
  try {
    let documentUrls: string[] = [];

    if (batchData.documents && batchData.documents.length > 0) {
      const files = batchData.documents.map(doc => doc.file);
      documentUrls = await uploadMultipleFilesToIPFS(files);
    }

    const { data: batch, error: batchError } = await supabase
      .from('manufacturer_batches')
      .insert({
        processor_batch_id: batchData.processorBatchId,
        manufacturer_id: batchData.manufacturerId,
        gps_latitude: batchData.gpsLatitude,
        gps_longitude: batchData.gpsLongitude,
        weather_condition: batchData.weatherCondition,
        temperature: batchData.temperature,
        product_name: batchData.productName,
        brand_name: batchData.brandName,
        product_type: batchData.productType,
        quantity: batchData.quantity,
        unit: batchData.unit,
        location: batchData.location,
        manufacture_date: batchData.manufactureDate,
        expiry_date: batchData.expiryDate,
        processor_rating: batchData.processorRating,
        processor_rating_notes: batchData.processorRatingNotes,
        qr_code_data: batchData.transactionHash || batchData.ipfsHash || '',
        status: 'completed'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    if (documentUrls.length > 0 && batch) {
      const documents = batchData.documents!.map((doc, index) => ({
        manufacturer_batch_id: batch.id,
        file_name: doc.file.name,
        file_url: documentUrls[index],
        file_type: doc.type
      }));

      const { error: docsError } = await supabase
        .from('manufacturer_documents')
        .insert(documents);

      if (docsError) {
        console.error('Error uploading documents:', docsError);
      }
    }

    if (wasteAmount > 0 && batch) {
      await supabase.from('waste_metrics').insert({
        batch_id: batch.id,
        phase: 'manufacturing',
        waste_amount: wasteAmount,
        waste_type: 'manufacturing_loss',
        recorded_by: batchData.manufacturerId,
        recorded_at: new Date().toISOString()
      });

      if (wasteAmount > 50) {
        await notifyWasteThreshold(batchData.manufacturerId, wasteAmount, 50);
      }
    }

    await notifyBatchUpdate(
      batchData.manufacturerId,
      batch.id,
      batchData.productName,
      'Manufacturing'
    );

    if (batchData.transactionHash) {
      await notifyTransactionConfirmation(
        batchData.manufacturerId,
        batchData.transactionHash,
        batchData.productName
      );
    }

    return batch.id;
  } catch (error) {
    console.error('Error creating manufacturer batch:', error);
    throw error;
  }
}

export async function getManufacturerBatches(manufacturerId: string): Promise<ManufacturerBatch[]> {
  try {
    const { data, error } = await supabase
      .from('manufacturer_batches')
      .select('*')
      .eq('manufacturer_id', manufacturerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as ManufacturerBatch[];
  } catch (error) {
    console.error('Error fetching manufacturer batches:', error);
    return [];
  }
}

export async function getManufacturerDocuments(batchId: string): Promise<ManufacturerDocument[]> {
  try {
    const { data, error } = await supabase
      .from('manufacturer_documents')
      .select('*')
      .eq('manufacturer_batch_id', batchId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return data as ManufacturerDocument[];
  } catch (error) {
    console.error('Error fetching manufacturer documents:', error);
    return [];
  }
}

export async function updateManufacturerBatchStatus(batchId: string, status: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('manufacturer_batches')
      .update({ status })
      .eq('id', batchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating manufacturer batch status:', error);
    throw error;
  }
}

export async function deleteManufacturerBatch(batchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('manufacturer_batches')
      .delete()
      .eq('id', batchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting manufacturer batch:', error);
    throw error;
  }
}

export async function getProcessorBatches(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('processor_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching processor batches:', error);
    return [];
  }
}
