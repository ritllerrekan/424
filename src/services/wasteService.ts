import { createClient } from '@supabase/supabase-js';
import { WasteMetric, WasteMetricInput, WastePreventionInsight } from '../types/waste';
import { uploadWasteMetadataToIPFS, generateWasteIPFSMetadata } from '../utils/ipfsWaste';
import { notifyWasteThreshold } from './notificationService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function recordWasteMetric(
  wasteInput: WasteMetricInput,
  userId: string,
  additionalMetadata?: {
    gpsLocation?: { latitude: number; longitude: number };
    environmentalConditions?: {
      temperature?: number;
      humidity?: number;
      weather?: string;
    };
  }
): Promise<WasteMetric> {
  try {
    const ipfsMetadata = generateWasteIPFSMetadata(
      wasteInput.batch_id,
      wasteInput.phase,
      {
        quantity: wasteInput.waste_quantity,
        unit: wasteInput.waste_unit,
        category: wasteInput.waste_category,
        reason: wasteInput.waste_reason
      },
      {
        cost: wasteInput.cost_impact || 0,
        currency: wasteInput.currency || 'USD'
      },
      {
        notes: wasteInput.prevention_notes || '',
        recommendations: extractRecommendations(wasteInput.prevention_notes || '')
      },
      {
        recordedBy: userId,
        recordedAt: new Date().toISOString(),
        gpsLocation: additionalMetadata?.gpsLocation,
        environmentalConditions: additionalMetadata?.environmentalConditions
      }
    );

    const ipfsCid = await uploadWasteMetadataToIPFS(ipfsMetadata);

    const { data, error } = await supabase
      .from('waste_metrics')
      .insert({
        batch_id: wasteInput.batch_id,
        phase: wasteInput.phase,
        recorded_by: userId,
        waste_quantity: wasteInput.waste_quantity,
        waste_unit: wasteInput.waste_unit,
        waste_category: wasteInput.waste_category,
        waste_reason: wasteInput.waste_reason,
        cost_impact: wasteInput.cost_impact || 0,
        currency: wasteInput.currency || 'USD',
        prevention_notes: wasteInput.prevention_notes,
        ipfs_cid: ipfsCid
      })
      .select()
      .single();

    if (error) throw error;

    if (wasteInput.waste_quantity > 50) {
      await notifyWasteThreshold(userId, wasteInput.waste_quantity, 50);
    }

    return data as WasteMetric;
  } catch (error) {
    console.error('Error recording waste metric:', error);
    throw error;
  }
}

export async function getWasteMetricsByBatch(batchId: string): Promise<WasteMetric[]> {
  try {
    const { data, error } = await supabase
      .from('waste_metrics')
      .select('*')
      .eq('batch_id', batchId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data as WasteMetric[];
  } catch (error) {
    console.error('Error fetching waste metrics:', error);
    throw error;
  }
}

export async function getWasteMetricsByPhase(
  phase: string,
  userId: string
): Promise<WasteMetric[]> {
  try {
    const { data, error } = await supabase
      .from('waste_metrics')
      .select('*')
      .eq('phase', phase)
      .eq('recorded_by', userId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data as WasteMetric[];
  } catch (error) {
    console.error('Error fetching waste metrics by phase:', error);
    throw error;
  }
}

export async function getWasteMetricsByCategory(
  category: string,
  userId: string
): Promise<WasteMetric[]> {
  try {
    const { data, error } = await supabase
      .from('waste_metrics')
      .select('*')
      .eq('waste_category', category)
      .eq('recorded_by', userId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data as WasteMetric[];
  } catch (error) {
    console.error('Error fetching waste metrics by category:', error);
    throw error;
  }
}

export async function getWasteInsights(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WastePreventionInsight[]> {
  try {
    let query = supabase
      .from('waste_prevention_insights')
      .select('*')
      .eq('organization_id', organizationId);

    if (startDate) {
      query = query.gte('period_start', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('period_end', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as WastePreventionInsight[];
  } catch (error) {
    console.error('Error fetching waste insights:', error);
    throw error;
  }
}

export async function calculateWasteSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('waste_metrics')
      .select('waste_quantity, waste_unit, cost_impact, waste_category, phase')
      .eq('recorded_by', userId);

    if (error) throw error;

    const summary = {
      totalWasteQuantity: 0,
      totalCostImpact: 0,
      wasteByCategory: {} as Record<string, number>,
      wasteByPhase: {} as Record<string, number>,
      incidentCount: data.length
    };

    data.forEach((metric) => {
      summary.totalWasteQuantity += parseFloat(metric.waste_quantity.toString());
      summary.totalCostImpact += parseFloat(metric.cost_impact.toString());

      summary.wasteByCategory[metric.waste_category] =
        (summary.wasteByCategory[metric.waste_category] || 0) +
        parseFloat(metric.waste_quantity.toString());

      summary.wasteByPhase[metric.phase] =
        (summary.wasteByPhase[metric.phase] || 0) +
        parseFloat(metric.waste_quantity.toString());
    });

    return summary;
  } catch (error) {
    console.error('Error calculating waste summary:', error);
    throw error;
  }
}

export async function getUniqueBatchIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('waste_metrics')
      .select('batch_id')
      .eq('recorded_by', userId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    const uniqueBatchIds = Array.from(new Set(data.map(item => item.batch_id)));
    return uniqueBatchIds;
  } catch (error) {
    console.error('Error fetching unique batch IDs:', error);
    throw error;
  }
}

function extractRecommendations(preventionNotes: string): string[] {
  const recommendations: string[] = [];

  const lines = preventionNotes.split('\n').filter(line => line.trim());

  lines.forEach(line => {
    if (line.match(/^[-*•]\s/) || line.toLowerCase().includes('recommend')) {
      recommendations.push(line.replace(/^[-*•]\s/, '').trim());
    }
  });

  if (recommendations.length === 0 && preventionNotes.trim()) {
    recommendations.push(preventionNotes.trim());
  }

  return recommendations;
}
