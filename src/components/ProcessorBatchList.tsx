import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Scale, FileText } from 'lucide-react';
import { GlassCard, GlassButton } from './glass';
import { getProcessorBatches, ProcessorBatch } from '../services/processorBatchService';

interface ProcessorBatchListProps {
  userId: string;
  onViewDetails: (batch: ProcessorBatch) => void;
}

export function ProcessorBatchList({ userId, onViewDetails }: ProcessorBatchListProps) {
  const [batches, setBatches] = useState<ProcessorBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, [userId]);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await getProcessorBatches(userId);
      setBatches(data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent"></div>
          <p className="text-white/60 mt-4">Loading batches...</p>
        </div>
      </GlassCard>
    );
  }

  if (batches.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">No processing batches found</p>
          <p className="text-white/40 text-sm mt-2">Create your first processing batch to get started</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <GlassCard key={batch.id} className="hover:border-emerald-400/40 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Scale className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{batch.processing_type}</h3>
                  <p className="text-sm text-white/60">
                    {new Date(batch.processing_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-white/60 mb-1">Input Weight</p>
                  <p className="text-sm font-semibold text-white">{batch.input_weight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Output Weight</p>
                  <p className="text-sm font-semibold text-white">{batch.output_weight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Conversion
                  </p>
                  <p className="text-sm font-semibold text-emerald-400">
                    {batch.conversion_ratio.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Quality Rating</p>
                  <p className="text-sm font-semibold text-amber-400">
                    {batch.tester_rating}/5 ⭐
                  </p>
                </div>
              </div>

              {batch.chemicals_additives_used && (
                <div className="mt-3 p-2 bg-white/5 rounded">
                  <p className="text-xs text-white/60">Chemicals/Additives:</p>
                  <p className="text-sm text-white/80 line-clamp-2">{batch.chemicals_additives_used}</p>
                </div>
              )}
            </div>

            <div className="flex md:flex-col gap-2">
              <GlassButton
                onClick={() => onViewDetails(batch)}
                variant="secondary"
                size="sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Details</span>
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
