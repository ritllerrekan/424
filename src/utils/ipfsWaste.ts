import { WasteMetricIPFSData } from '../types/waste';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export async function uploadWasteMetadataToIPFS(
  wasteData: WasteMetricIPFSData
): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  try {
    const metadata = {
      pinataContent: wasteData,
      pinataMetadata: {
        name: `waste-metric-${wasteData.batch_id}-${Date.now()}`,
        keyvalues: {
          batch_id: wasteData.batch_id,
          phase: wasteData.phase,
          category: wasteData.waste_details.category,
          recorded_at: wasteData.metadata.recorded_at
        }
      }
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`IPFS upload failed: ${errorData}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading waste metadata to IPFS:', error);
    throw error;
  }
}

export async function fetchWasteMetadataFromIPFS(
  ipfsCid: string
): Promise<WasteMetricIPFSData> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const data = await response.json();
    return data as WasteMetricIPFSData;
  } catch (error) {
    console.error('Error fetching waste metadata from IPFS:', error);
    throw error;
  }
}

export function generateWasteIPFSMetadata(
  batchId: string,
  phase: string,
  wasteDetails: {
    quantity: number;
    unit: string;
    category: string;
    reason: string;
  },
  financialImpact: {
    cost: number;
    currency: string;
  },
  prevention: {
    notes: string;
    recommendations: string[];
  },
  metadata: {
    recordedBy: string;
    recordedAt: string;
    gpsLocation?: { latitude: number; longitude: number };
    environmentalConditions?: {
      temperature?: number;
      humidity?: number;
      weather?: string;
    };
  }
): WasteMetricIPFSData {
  return {
    batch_id: batchId,
    phase: phase as any,
    waste_details: {
      quantity: wasteDetails.quantity,
      unit: wasteDetails.unit,
      category: wasteDetails.category as any,
      reason: wasteDetails.reason
    },
    financial_impact: {
      cost: financialImpact.cost,
      currency: financialImpact.currency
    },
    prevention: {
      notes: prevention.notes,
      recommendations: prevention.recommendations
    },
    metadata: {
      recorded_by: metadata.recordedBy,
      recorded_at: metadata.recordedAt,
      gps_location: metadata.gpsLocation,
      environmental_conditions: metadata.environmentalConditions
    }
  };
}
