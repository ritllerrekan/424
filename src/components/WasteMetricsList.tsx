import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Calendar, FileText, TrendingDown } from 'lucide-react';
import { WasteMetric, WASTE_CATEGORIES } from '../types/waste';
import { getWasteMetricsByBatch } from '../services/wasteService';

interface WasteMetricsListProps {
  batchId: string;
}

export function WasteMetricsList({ batchId }: WasteMetricsListProps) {
  const [wasteMetrics, setWasteMetrics] = useState<WasteMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWasteMetrics();
  }, [batchId]);

  const loadWasteMetrics = async () => {
    try {
      setIsLoading(true);
      const metrics = await getWasteMetricsByBatch(batchId);
      setWasteMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load waste metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = WASTE_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const totalWaste = wasteMetrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0);
  const totalCost = wasteMetrics.reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center">Loading waste metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (wasteMetrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No waste recorded for this batch</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Waste</p>
              <p className="text-xl font-bold text-gray-800">
                {totalWaste.toFixed(2)} {wasteMetrics[0]?.waste_unit || 'kg'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cost Impact</p>
              <p className="text-xl font-bold text-gray-800">
                ${totalCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Waste Records</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {wasteMetrics.map((metric) => (
            <div key={metric.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      {getCategoryLabel(metric.waste_category)}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded uppercase">
                      {metric.phase}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    {metric.waste_quantity} {metric.waste_unit}
                  </p>
                  <p className="text-sm text-gray-600">{metric.waste_reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">
                    ${parseFloat(metric.cost_impact.toString()).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(metric.recorded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {metric.prevention_notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-1">Prevention Notes</p>
                      <p className="text-xs text-blue-700 whitespace-pre-line">{metric.prevention_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {metric.ipfs_cid && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">IPFS:</span>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${metric.ipfs_cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-mono"
                  >
                    {metric.ipfs_cid.substring(0, 12)}...
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
