import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Package, LogOut, Plus, List, TrendingDown } from 'lucide-react';
import { WasteMetricForm } from '../components/WasteMetricForm';
import { WasteMetricsList } from '../components/WasteMetricsList';
import { WasteMetricsDashboard } from '../components/WasteMetricsDashboard';
import { BatchComparisonChart } from '../components/BatchComparisonChart';
import { WasteMetric, WastePhase } from '../types/waste';
import { recordWasteMetric, getUniqueBatchIds } from '../services/wasteService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function Dashboard() {
  const { userProfile, logout, walletAddress, userId } = useWeb3Auth();
  const [activeTab, setActiveTab] = useState<'view' | 'create' | 'waste'>('view');
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteMetrics, setWasteMetrics] = useState<WasteMetric[]>([]);
  const [isLoadingWaste, setIsLoadingWaste] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      loadUserWasteMetrics();
    }
  }, [userId]);

  const loadUserWasteMetrics = async () => {
    if (!userId) return;
    try {
      setIsLoadingWaste(true);
      const { data, error } = await supabase
        .from('waste_metrics')
        .select('*')
        .eq('recorded_by', userId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setWasteMetrics(data as WasteMetric[]);

      const uniqueBatchIds = await getUniqueBatchIds(userId);
      setBatchIds(uniqueBatchIds);
    } catch (error) {
      console.error('Error loading waste metrics:', error);
    } finally {
      setIsLoadingWaste(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRecordWaste = async (wasteData: any) => {
    if (!userId) return;
    try {
      await recordWasteMetric(wasteData, userId);
      setShowWasteForm(false);
      await loadUserWasteMetrics();
    } catch (error) {
      console.error('Error recording waste:', error);
      throw error;
    }
  };

  const getRoleDisplay = () => {
    if (!userProfile?.role) return 'User';
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-800">FoodTrace</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{userProfile?.full_name}</div>
                <div className="text-xs text-gray-500">{getRoleDisplay()}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.full_name || 'User'}! Manage your batches and track your supply chain.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Organization</div>
              <div className="text-lg font-semibold text-gray-800">{userProfile?.organization || 'Not set'}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Wallet Address</div>
              <div className="text-sm font-mono text-gray-800">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Role</div>
              <div className="text-lg font-semibold text-gray-800">{getRoleDisplay()}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'view'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <List className="w-5 h-5" />
            View Batches
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'waste'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
            Waste Metrics
          </button>
        </div>

        {activeTab === 'waste' ? (
          showWasteForm ? (
            <WasteMetricForm
              batchId="demo-batch-id"
              phase={userProfile?.role === 'collector' ? 'collection' :
                     userProfile?.role === 'tester' ? 'testing' :
                     userProfile?.role === 'processor' ? 'processing' : 'manufacturing'}
              onSubmit={handleRecordWaste}
              onCancel={() => setShowWasteForm(false)}
            />
          ) : (
            <div className="space-y-6">
              <WasteMetricsDashboard
                wasteMetrics={wasteMetrics}
                onRecordWaste={() => setShowWasteForm(true)}
              />
              {batchIds.length > 1 && (
                <BatchComparisonChart batchIds={batchIds} />
              )}
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            {activeTab === 'view' ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Batches Yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first batch</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Create Batch
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create New Batch</h3>
                <p className="text-gray-600 mb-6">Batch creation form coming soon</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
