import { useEffect, useState } from 'react';
import { Trash2, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, WasteMetric } from '../../lib/supabase';

export const WasteMetrics = () => {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState<WasteMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWaste, setTotalWaste] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    fetchWasteMetrics();
  }, [userProfile]);

  const fetchWasteMetrics = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('waste_metrics')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setMetrics(data);
        const waste = data.reduce((sum, m) => sum + m.waste_amount, 0);
        const cost = data.reduce((sum, m) => sum + m.cost_impact, 0);
        setTotalWaste(waste);
        setTotalCost(cost);
      }
    } catch (error) {
      console.error('Error fetching waste metrics:', error);
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
        <div className="text-emerald-600">Loading waste metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Waste Management Metrics</h1>
          <p className="text-emerald-700 mt-2">Track and reduce waste across your supply chain</p>
        </div>
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Record Waste
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{totalWaste.toFixed(1)}</h3>
          <p className="text-emerald-700 text-sm mt-1">Total Waste (kg)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">${totalCost.toFixed(2)}</h3>
          <p className="text-emerald-700 text-sm mt-1">Cost Impact</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">-12%</h3>
          <p className="text-emerald-700 text-sm mt-1">Reduction vs Last Month</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-3">AI Waste Reduction Recommendations</h2>
        <div className="space-y-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="font-semibold mb-1">Optimize Storage Temperature</h4>
            <p className="text-emerald-50 text-sm">
              Maintaining consistent temperature between 2-4°C could reduce spoilage by 15%
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="font-semibold mb-1">Improve Batch Rotation</h4>
            <p className="text-emerald-50 text-sm">
              Implementing FIFO system could prevent 20% of expiration-related waste
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="font-semibold mb-1">Predictive Quality Monitoring</h4>
            <p className="text-emerald-50 text-sm">
              Early detection of quality issues could save approximately $500/month
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
        <h2 className="text-xl font-bold text-emerald-900 mb-4">Waste History</h2>
        {metrics.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <p className="text-emerald-700">No waste records yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="border border-emerald-100 rounded-lg p-4 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-emerald-900">{metric.waste_amount} {metric.waste_unit}</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        ${metric.cost_impact}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-700 mb-2">{metric.waste_reason}</p>
                    {metric.prevention_notes && (
                      <p className="text-xs text-emerald-600 italic">{metric.prevention_notes}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2 text-xs text-emerald-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(metric.recorded_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
