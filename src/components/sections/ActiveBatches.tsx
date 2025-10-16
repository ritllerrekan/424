import { useEffect, useState } from 'react';
import { Package, MapPin, Thermometer, Droplets } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Batch, BatchPhase } from '../../lib/supabase';

export const ActiveBatches = () => {
  const { userProfile } = useAuth();
  const [batches, setBatches] = useState<(Batch & { phases?: BatchPhase[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBatches();
  }, [userProfile]);

  const fetchActiveBatches = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const batchesWithPhases = await Promise.all(
          data.map(async (batch) => {
            const { data: phases } = await supabase
              .from('batch_phases')
              .select('*')
              .eq('batch_id', batch.id)
              .order('created_at', { ascending: true });

            return { ...batch, phases: phases || [] };
          })
        );

        setBatches(batchesWithPhases);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'collection': return 'bg-blue-100 text-blue-700';
      case 'testing': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-orange-100 text-orange-700';
      case 'manufacturing': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-emerald-600">Loading active batches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Active Batches</h1>
          <p className="text-emerald-700 mt-2">Track ongoing food supply chain batches</p>
        </div>
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Create New Batch
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-12 text-center">
          <Package className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Active Batches</h3>
          <p className="text-emerald-700">Create a new batch to start tracking</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-emerald-900">{batch.product_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(batch.current_phase)}`}>
                      {batch.current_phase}
                    </span>
                  </div>
                  <p className="text-emerald-700 text-sm">Batch #{batch.batch_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-900">{batch.quantity}</p>
                  <p className="text-emerald-700 text-sm">{batch.unit}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-emerald-700">
                  <Package className="w-4 h-4" />
                  <span>Batch {batch.batch_number}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-emerald-700">
                  <MapPin className="w-4 h-4" />
                  <span>{batch.phases?.[0]?.location || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-emerald-700">
                  <Thermometer className="w-4 h-4" />
                  <span>{batch.phases?.[0]?.temperature || 0}°C</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-emerald-700">
                  <Droplets className="w-4 h-4" />
                  <span>{batch.phases?.[0]?.humidity || 0}%</span>
                </div>
              </div>

              <div className="border-t border-emerald-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {['collection', 'testing', 'processing', 'manufacturing'].map((phase) => {
                      const phaseData = batch.phases?.find(p => p.phase_type === phase);
                      const isActive = batch.current_phase === phase;
                      const isCompleted = phaseData?.status === 'completed';

                      return (
                        <div
                          key={phase}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            isCompleted
                              ? 'bg-green-100 text-green-700'
                              : isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {phase}
                        </div>
                      );
                    })}
                  </div>
                  <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>

              {batch.blockchain_tx_hash && (
                <div className="mt-4 pt-4 border-t border-emerald-100">
                  <p className="text-xs text-emerald-600 font-mono">
                    Blockchain: {batch.blockchain_tx_hash.substring(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
