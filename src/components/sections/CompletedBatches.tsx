import { useEffect, useState } from 'react';
import { CheckCircle, Package, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Batch } from '../../lib/supabase';

export const CompletedBatches = () => {
  const { userProfile } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedBatches();
  }, [userProfile]);

  const fetchCompletedBatches = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching completed batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-emerald-600">Loading completed batches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Completed Batches</h1>
        <p className="text-emerald-700 mt-2">View history of completed supply chain batches</p>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Completed Batches</h3>
          <p className="text-emerald-700">Completed batches will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-emerald-900">{batch.product_name}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-emerald-700">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Batch #{batch.batch_number}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Completed {formatDate(batch.updated_at)}</span>
                      </div>
                    </div>
                    {batch.blockchain_tx_hash && (
                      <p className="text-xs text-emerald-600 font-mono mt-2">
                        Blockchain: {batch.blockchain_tx_hash.substring(0, 30)}...
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-900">{batch.quantity}</p>
                  <p className="text-emerald-700 text-sm">{batch.unit}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-100">
                <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                  View Complete History
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
