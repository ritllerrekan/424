import { createClient } from '@supabase/supabase-js';
import { uploadMultipleFilesToIPFS } from './ipfsUploadService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ProcessorBatch {
  id: string;
  tester_batch_id: string;
  processor_id: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  weather_condition: string;
  temperature: number | null;
  processing_date: string;
  processing_type: string;
  input_weight: number;
  output_weight: number;
  conversion_ratio: number;
  chemicals_additives_used: string;
  tester_rating: number;
  tester_rating_notes: string;
  qr_code_data: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessorDocument {
  id: string;
  processor_batch_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface ProcessorBatchData {
  processorId: string;
  testerBatchId: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  weatherCondition: string;
  temperature: number | null;
  processingDate: string;
  processingType: string;
  inputWeight: number;
  outputWeight: number;
  chemicalsAdditivesUsed: string;
  testerRating: number;
  testerRatingNotes: string;
  documents?: { file: File; type: string }[];
  transactionHash?: string;
  ipfsHash?: string;
}

export async function createProcessorBatch(
  batchData: ProcessorBatchData,
  wasteAmount: number = 0
): Promise<string> {
  try {
    const conversionRatio = (batchData.outputWeight / batchData.inputWeight) * 100;

    let documentUrls: string[] = [];

    if (batchData.documents && batchData.documents.length > 0) {
      const files = batchData.documents.map(doc => doc.file);
      documentUrls = await uploadMultipleFilesToIPFS(files);
    }

    const { data: batch, error: batchError } = await supabase
      .from('processor_batches')
      .insert({
        tester_batch_id: batchData.testerBatchId,
        processor_id: batchData.processorId,
        gps_latitude: batchData.gpsLatitude,
        gps_longitude: batchData.gpsLongitude,
        weather_condition: batchData.weatherCondition,
        temperature: batchData.temperature,
        processing_date: batchData.processingDate,
        processing_type: batchData.processingType,
        input_weight: batchData.inputWeight,
        output_weight: batchData.outputWeight,
        conversion_ratio: conversionRatio,
        chemicals_additives_used: batchData.chemicalsAdditivesUsed,
        tester_rating: batchData.testerRating,
        tester_rating_notes: batchData.testerRatingNotes,
        qr_code_data: batchData.transactionHash || batchData.ipfsHash || '',
        status: 'completed'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    if (documentUrls.length > 0 && batch) {
      const documents = batchData.documents!.map((doc, index) => ({
        processor_batch_id: batch.id,
        file_name: doc.file.name,
        file_url: documentUrls[index],
        file_type: doc.type
      }));

      const { error: docsError } = await supabase
        .from('processor_documents')
        .insert(documents);

      if (docsError) {
        console.error('Error uploading documents:', docsError);
      }
    }

    if (wasteAmount > 0 && batch) {
      await supabase.from('waste_metrics').insert({
        batch_id: batch.id,
        phase: 'processing',
        waste_amount: wasteAmount,
        waste_type: 'processing_loss',
        recorded_by: batchData.processorId,
        recorded_at: new Date().toISOString()
      });
    }

    return batch.id;
  } catch (error) {
    console.error('Error creating processor batch:', error);
    throw error;
  }
}

export async function getProcessorBatches(processorId: string): Promise<ProcessorBatch[]> {
  try {
    const { data, error } = await supabase
      .from('processor_batches')
      .select('*')
      .eq('processor_id', processorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as ProcessorBatch[];
  } catch (error) {
    console.error('Error fetching processor batches:', error);
    return [];
  }
}

export async function getProcessorDocuments(batchId: string): Promise<ProcessorDocument[]> {
  try {
    const { data, error } = await supabase
      .from('processor_documents')
      .select('*')
      .eq('processor_batch_id', batchId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return data as ProcessorDocument[];
  } catch (error) {
    console.error('Error fetching processor documents:', error);
    return [];
  }
}

export async function updateProcessorBatchStatus(batchId: string, status: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('processor_batches')
      .update({ status })
      .eq('id', batchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating processor batch status:', error);
    throw error;
  }
}

export async function deleteProcessorBatch(batchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('processor_batches')
      .delete()
      .eq('id', batchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting processor batch:', error);
    throw error;
  }
}

export async function getTesterBatches(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('tester_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching tester batches:', error);
    return [];
  }
}
