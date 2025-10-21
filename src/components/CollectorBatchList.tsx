import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, Leaf, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { GlassCard, GlassButton } from './glass';
import { CollectorBatch, getCollectorBatches, deleteBatch } from '../services/collectorBatchService';

interface CollectorBatchListProps {
  userId: string;
  onViewDetails: (batch: CollectorBatch) => void;
}

export function CollectorBatchList({ userId, onViewDetails }: CollectorBatchListProps) {
  const [batches, setBatches] = useState<CollectorBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, [userId]);

  const loadBatches = async () => {
    try {
      setIsLoading(true);
      const data = await getCollectorBatches(userId);
      setBatches(data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      await deleteBatch(batchId);
      await loadBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Failed to delete batch');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading batches...</p>
        </div>
      </GlassCard>
    );
  }

  if (batches.length === 0) {
    return (
      <GlassCard className="p-8">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Batches Yet</h3>
          <p className="text-white/70">Create your first collection batch to get started</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <GlassCard key={batch.id} className="p-6 hover:bg-white/10 transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{batch.batch_number}</h3>
                  <p className="text-sm text-white/60">{batch.seed_crop_name}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(batch.harvest_date).toLocaleDateString()}</span>
                </div>

                {batch.gps_latitude && batch.gps_longitude && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {batch.gps_latitude.toFixed(4)}, {batch.gps_longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Package className="w-4 h-4" />
                  <span>{batch.weight_total} kg</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(batch.status)}`}>
                  {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                </div>

                {batch.pesticide_used && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Pesticide Used</span>
                  </div>
                )}

                {batch.weather_condition && (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Leaf className="w-4 h-4" />
                    <span>{batch.weather_condition}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <GlassButton
                onClick={() => onViewDetails(batch)}
                variant="secondary"
                size="sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View</span>
              </GlassButton>
              <GlassButton
                onClick={() => handleDelete(batch.id)}
                variant="secondary"
                size="sm"
                className="hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
