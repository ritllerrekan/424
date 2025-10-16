import { useEffect, useState } from 'react';
import { Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const RoleDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    activeBatches: 0,
    completedBatches: 0,
    pendingTasks: 0,
    qualityScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userProfile]);

  const fetchStats = async () => {
    if (!userProfile) return;

    try {
      const { data: activeBatches } = await supabase
        .from('batches')
        .select('id', { count: 'exact' })
        .eq('created_by', userProfile.id)
        .eq('status', 'active');

      const { data: completedBatches } = await supabase
        .from('batches')
        .select('id', { count: 'exact' })
        .eq('created_by', userProfile.id)
        .eq('status', 'completed');

      const { data: pendingPhases } = await supabase
        .from('batch_phases')
        .select('id', { count: 'exact' })
        .eq('handler_id', userProfile.id)
        .in('status', ['pending', 'in_progress']);

      setStats({
        activeBatches: activeBatches?.length || 0,
        completedBatches: completedBatches?.length || 0,
        pendingTasks: pendingPhases?.length || 0,
        qualityScore: 95,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleContent = () => {
    switch (userProfile?.role) {
      case 'collector':
        return {
          title: 'Collector Dashboard',
          description: 'Manage raw material collection and batch creation',
          color: 'emerald',
        };
      case 'tester':
        return {
          title: 'Tester Dashboard',
          description: 'Perform quality tests and record results',
          color: 'teal',
        };
      case 'processor':
        return {
          title: 'Processor Dashboard',
          description: 'Monitor processing conditions and quality',
          color: 'cyan',
        };
      case 'manufacturer':
        return {
          title: 'Manufacturer Dashboard',
          description: 'Track final production and distribution',
          color: 'emerald',
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Overview of your activities',
          color: 'emerald',
        };
    }
  };

  const roleContent = getRoleContent();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-emerald-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">{roleContent.title}</h1>
        <p className="text-emerald-700 mt-2">{roleContent.description}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{stats.activeBatches}</h3>
          <p className="text-emerald-700 text-sm mt-1">Active Batches</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{stats.completedBatches}</h3>
          <p className="text-emerald-700 text-sm mt-1">Completed Batches</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{stats.pendingTasks}</h3>
          <p className="text-emerald-700 text-sm mt-1">Pending Tasks</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{stats.qualityScore}%</h3>
          <p className="text-emerald-700 text-sm mt-1">Quality Score</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
        <h2 className="text-xl font-bold text-emerald-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left">
            <h3 className="font-semibold text-emerald-900 mb-1">Create New Batch</h3>
            <p className="text-sm text-emerald-700">Start tracking a new product batch</p>
          </button>
          <button className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left">
            <h3 className="font-semibold text-emerald-900 mb-1">View Pending Tasks</h3>
            <p className="text-sm text-emerald-700">Check your assigned tasks</p>
          </button>
          <button className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left">
            <h3 className="font-semibold text-emerald-900 mb-1">Generate Report</h3>
            <p className="text-sm text-emerald-700">Create activity summary</p>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Blockchain Integration</h2>
        <p className="text-emerald-50 mb-4">
          All your transactions are securely recorded on the blockchain for complete transparency and traceability.
        </p>
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-sm text-emerald-50">Network</p>
            <p className="font-semibold">Ethereum</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-sm text-emerald-50">Status</p>
            <p className="font-semibold">Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
};
