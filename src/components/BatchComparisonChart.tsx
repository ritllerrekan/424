import { useState, useEffect } from 'react';
import { GitCompare, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { WasteMetric } from '../types/waste';
import { getWasteMetricsByBatch } from '../services/wasteService';

interface BatchComparisonChartProps {
  batchIds: string[];
}

export function BatchComparisonChart({ batchIds }: BatchComparisonChartProps) {
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    loadComparisonData();
  }, [batchIds]);

  const loadComparisonData = async () => {
    if (batchIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const batchDataPromises = batchIds.slice(0, 5).map(async (batchId) => {
        const metrics = await getWasteMetricsByBatch(batchId);
        const totalWaste = metrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0);
        const totalCost = metrics.reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0);

        return {
          batch: batchId.slice(0, 8),
          fullBatchId: batchId,
          waste: parseFloat(totalWaste.toFixed(2)),
          cost: parseFloat(totalCost.toFixed(2)),
          incidents: metrics.length
        };
      });

      const data = await Promise.all(batchDataPromises);
      setComparisonData(data);
    } catch (error) {
      console.error('Error loading batch comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (comparisonData.length === 0) {
    return (
      <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-emerald-600" />
          Batch Comparison
        </h3>
        <div className="text-center py-12">
          <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No batches to compare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <GitCompare className="w-5 h-5 text-emerald-600" />
        Batch Comparison {comparisonData.length > 1 ? `(${comparisonData.length} batches)` : ''}
      </h3>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Waste by Batch</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="batch" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}
                formatter={(value: number, name: string) => [
                  name === 'waste' ? `${value} kg` : value,
                  name === 'waste' ? 'Waste' : 'Incidents'
                ]}
              />
              <Legend />
              <Bar dataKey="waste" fill="#10b981" name="Waste (kg)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Impact by Batch</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="batch" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}
                formatter={(value: number) => [`$${value}`, 'Cost']}
              />
              <Legend />
              <Bar dataKey="cost" fill="#ef4444" name="Cost ($)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {comparisonData.map((batch) => (
          <div
            key={batch.fullBatchId}
            className="backdrop-blur-md bg-white/60 rounded-lg p-3 border border-gray-200/50"
          >
            <p className="text-xs font-medium text-gray-500 mb-1">Batch {batch.batch}</p>
            <p className="text-lg font-bold text-emerald-600">{batch.waste} kg</p>
            <p className="text-xs text-gray-600">{batch.incidents} incidents</p>
            <p className="text-xs text-red-600 font-semibold">${batch.cost}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
