import { useState, useEffect } from 'react';
import {
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Package
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { WasteMetric, WastePhase, WasteCategory, WASTE_CATEGORIES } from '../types/waste';
import { calculateWasteSummary } from '../services/wasteService';
import { useWeb3Auth } from '../contexts/Web3AuthContext';

interface WasteMetricsDashboardProps {
  wasteMetrics: WasteMetric[];
  onRecordWaste?: () => void;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function WasteMetricsDashboard({ wasteMetrics, onRecordWaste }: WasteMetricsDashboardProps) {
  const { userId } = useWeb3Auth();
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [selectedPhase, setSelectedPhase] = useState<WastePhase | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory | 'all'>('all');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadSummary();
    }
  }, [userId]);

  const loadSummary = async () => {
    if (!userId) return;
    try {
      const data = await calculateWasteSummary(userId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const filteredMetrics = wasteMetrics.filter(metric => {
    const metricDate = new Date(metric.recorded_at);

    if (dateRange.start && metricDate < dateRange.start) return false;
    if (dateRange.end && metricDate > dateRange.end) return false;
    if (selectedPhase !== 'all' && metric.phase !== selectedPhase) return false;
    if (selectedCategory !== 'all' && metric.waste_category !== selectedCategory) return false;

    return true;
  });

  const totalWaste = filteredMetrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0);
  const totalCost = filteredMetrics.reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0);
  const avgWastePerIncident = filteredMetrics.length > 0 ? totalWaste / filteredMetrics.length : 0;

  const wasteByCategory = WASTE_CATEGORIES.map(cat => ({
    name: cat.label,
    value: filteredMetrics
      .filter(m => m.waste_category === cat.value)
      .reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0)
  })).filter(item => item.value > 0);

  const wasteByPhase = ['collection', 'testing', 'processing', 'manufacturing'].map(phase => ({
    name: phase.charAt(0).toUpperCase() + phase.slice(1),
    waste: filteredMetrics
      .filter(m => m.phase === phase)
      .reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0),
    cost: filteredMetrics
      .filter(m => m.phase === phase)
      .reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0)
  })).filter(item => item.waste > 0);

  const wasteTrends = filteredMetrics.reduce((acc, metric) => {
    const date = new Date(metric.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);

    if (existing) {
      existing.waste += parseFloat(metric.waste_quantity.toString());
      existing.cost += parseFloat(metric.cost_impact.toString());
    } else {
      acc.push({
        date,
        waste: parseFloat(metric.waste_quantity.toString()),
        cost: parseFloat(metric.cost_impact.toString())
      });
    }

    return acc;
  }, [] as Array<{ date: string; waste: number; cost: number }>).slice(-14);

  const topRecommendations = filteredMetrics
    .filter(m => m.prevention_notes)
    .slice(0, 5);

  const getCategoryLabel = (category: string) => {
    const cat = WASTE_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg">
              <TrendingDown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Waste Metrics Dashboard</h2>
              <p className="text-sm text-gray-600">Track, analyze, and reduce waste across your supply chain</p>
            </div>
          </div>
          {onRecordWaste && (
            <button
              onClick={onRecordWaste}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Record Waste
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="backdrop-blur-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-700">Total Waste</span>
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalWaste.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">kg recorded</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700">Total Cost Impact</span>
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">${totalCost.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">financial loss</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-700">Total Incidents</span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{filteredMetrics.length}</p>
            <p className="text-xs text-gray-600 mt-1">waste events</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Avg Per Incident</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{avgWastePerIncident.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">kg per event</p>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/50 rounded-xl p-4 border border-gray-200/50 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phase</label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value as WastePhase | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
              >
                <option value="all">All Phases</option>
                <option value="collection">Collection</option>
                <option value="testing">Testing</option>
                <option value="processing">Processing</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as WasteCategory | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
              >
                <option value="all">All Categories</option>
                {WASTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredMetrics.length === 0 ? (
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Waste Data</h3>
          <p className="text-gray-600">No waste metrics match your current filters</p>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Waste Trends Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wasteTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="waste" stroke="#10b981" strokeWidth={2} name="Waste (kg)" />
                  <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Waste by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={wasteByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)} kg`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {wasteByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Waste & Cost by Phase
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wasteByPhase}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="waste" fill="#10b981" name="Waste (kg)" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" fill="#ef4444" name="Cost ($)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {topRecommendations.length > 0 && (
            <div className="backdrop-blur-lg bg-gradient-to-br from-amber-50/70 to-amber-100/50 rounded-2xl shadow-xl border border-amber-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                Prevention Recommendations
              </h3>
              <div className="space-y-4">
                {topRecommendations.map((metric) => (
                  <div key={metric.id} className="backdrop-blur-md bg-white/80 rounded-xl p-4 border border-amber-200/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          {getCategoryLabel(metric.waste_category)}
                        </span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded uppercase">
                          {metric.phase}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">
                          ${parseFloat(metric.cost_impact.toString()).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {metric.waste_quantity} {metric.waste_unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {metric.prevention_notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Waste Records</h3>
            <div className="space-y-3">
              {filteredMetrics.slice(0, 10).map((metric) => (
                <div
                  key={metric.id}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-4 border border-gray-200/50 hover:bg-white/80 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          {getCategoryLabel(metric.waste_category)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded uppercase">
                          {metric.phase}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(metric.recorded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        {metric.waste_quantity} {metric.waste_unit}
                      </p>
                      <p className="text-sm text-gray-600">{metric.waste_reason}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-red-600">
                        ${parseFloat(metric.cost_impact.toString()).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
