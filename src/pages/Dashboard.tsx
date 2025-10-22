import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Package, LogOut, Plus, List, TrendingDown, History, QrCode, Bot, Sparkles } from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { WasteMetricForm } from '../components/WasteMetricForm';
import { WasteMetricsList } from '../components/WasteMetricsList';
import { WasteMetricsDashboard } from '../components/WasteMetricsDashboard';
import { BatchComparisonChart } from '../components/BatchComparisonChart';
import { TransactionHistory } from '../components/TransactionHistory';
import { CollectorBatchForm, CollectorBatchData } from '../components/CollectorBatchForm';
import { CollectorBatchList } from '../components/CollectorBatchList';
import { BatchDetailsModal } from '../components/BatchDetailsModal';
import { ProcessorBatchForm, ProcessorBatchFormData } from '../components/ProcessorBatchForm';
import { ProcessorBatchList } from '../components/ProcessorBatchList';
import { ProcessorBatchDetailsModal } from '../components/ProcessorBatchDetailsModal';
import { ManufacturerBatchForm, ManufacturerBatchFormData } from '../components/ManufacturerBatchForm';
import { ManufacturerBatchList } from '../components/ManufacturerBatchList';
import { ManufacturerBatchDetailsModal } from '../components/ManufacturerBatchDetailsModal';
import { AIChatAssistant } from '../components/AIChatAssistant';
import { AIInsightsWidget } from '../components/AIInsightsWidget';
import { WastePatternAnalysis } from '../components/WastePatternAnalysis';
import { WasteMetric, WastePhase } from '../types/waste';
import { recordWasteMetric, getUniqueBatchIds } from '../services/wasteService';
import { createCollectorBatch, CollectorBatch } from '../services/collectorBatchService';
import { createProcessorBatch, ProcessorBatch } from '../services/processorBatchService';
import { createManufacturerBatch, ManufacturerBatch } from '../services/manufacturerBatchService';
import { createClient } from '@supabase/supabase-js';
import { GlassCard, GlassButton } from '../components/glass';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function Dashboard() {
  const { userProfile, logout, walletAddress, userId } = useWeb3Auth();
  const [activeTab, setActiveTab] = useState<'view' | 'create' | 'waste' | 'transactions' | 'ai'>('view');
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteMetrics, setWasteMetrics] = useState<WasteMetric[]>([]);
  const [isLoadingWaste, setIsLoadingWaste] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<CollectorBatch | null>(null);
  const [selectedProcessorBatch, setSelectedProcessorBatch] = useState<ProcessorBatch | null>(null);
  const [selectedManufacturerBatch, setSelectedManufacturerBatch] = useState<ManufacturerBatch | null>(null);
  const [wasteAmount, setWasteAmount] = useState<number>(0);
  const [showAIChat, setShowAIChat] = useState(false);

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

  const handleCreateBatch = async (batchData: CollectorBatchData) => {
    if (!userId) return;
    try {
      await createCollectorBatch(batchData, wasteAmount);
      setActiveTab('view');
      setWasteAmount(0);
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  };

  const handleCreateProcessorBatch = async (batchData: ProcessorBatchFormData) => {
    if (!userId) return;
    try {
      await createProcessorBatch(batchData, wasteAmount);
      setActiveTab('view');
      setWasteAmount(0);
    } catch (error) {
      console.error('Error creating processor batch:', error);
      throw error;
    }
  };

  const handleCreateManufacturerBatch = async (batchData: ManufacturerBatchFormData) => {
    if (!userId) return;
    try {
      await createManufacturerBatch(batchData, wasteAmount);
      setActiveTab('view');
      setWasteAmount(0);
    } catch (error) {
      console.error('Error creating manufacturer batch:', error);
      throw error;
    }
  };

  const getRoleDisplay = () => {
    if (!userProfile?.role) return 'User';
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-glass sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Package className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-2xl font-bold text-white">FoodTrace</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-white">{userProfile?.full_name}</div>
                <div className="text-xs text-white/60">{getRoleDisplay()}</div>
              </div>
              <NotificationCenter />
              <GlassButton
                onClick={() => window.location.href = '/qr'}
                variant="secondary"
                size="sm"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR Codes</span>
              </GlassButton>
              <GlassButton
                onClick={handleLogout}
                variant="secondary"
                size="sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/70">
            Welcome back, {userProfile?.full_name || 'User'}! Manage your batches and track your supply chain.
          </p>
        </div>

        <GlassCard className="mb-6 animate-slide-up">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-400/20">
              <div className="text-sm text-white/60 mb-1">Organization</div>
              <div className="text-lg font-semibold text-white">{userProfile?.organization || 'Not set'}</div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-400/20">
              <div className="text-sm text-white/60 mb-1">Wallet Address</div>
              <div className="text-sm font-mono text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-400/20">
              <div className="text-sm text-white/60 mb-1">Role</div>
              <div className="text-lg font-semibold text-white">{getRoleDisplay()}</div>
            </div>
          </div>
        </GlassCard>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <GlassButton
            onClick={() => setActiveTab('view')}
            variant={activeTab === 'view' ? 'accent' : 'secondary'}
          >
            <List className="w-5 h-5" />
            View Batches
          </GlassButton>
          <GlassButton
            onClick={() => setActiveTab('create')}
            variant={activeTab === 'create' ? 'accent' : 'secondary'}
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </GlassButton>
          <GlassButton
            onClick={() => setActiveTab('waste')}
            variant={activeTab === 'waste' ? 'accent' : 'secondary'}
          >
            <TrendingDown className="w-5 h-5" />
            Waste Metrics
          </GlassButton>
          <GlassButton
            onClick={() => setActiveTab('ai')}
            variant={activeTab === 'ai' ? 'accent' : 'secondary'}
          >
            <Sparkles className="w-5 h-5" />
            AI Insights
          </GlassButton>
          <GlassButton
            onClick={() => setActiveTab('transactions')}
            variant={activeTab === 'transactions' ? 'accent' : 'secondary'}
          >
            <History className="w-5 h-5" />
            Transactions
          </GlassButton>
        </div>

        {activeTab === 'ai' ? (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WastePatternAnalysis userId={userId || ''} />
              </div>
              <div>
                <AIInsightsWidget
                  userId={userId || ''}
                  userRole={userProfile?.role || ''}
                  onOpenChat={() => setShowAIChat(true)}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'waste' ? (
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
        ) : activeTab === 'transactions' ? (
          <TransactionHistory />
        ) : activeTab === 'view' ? (
          userProfile?.role === 'manufacturer' ? (
            <ManufacturerBatchList
              userId={userId || ''}
              onViewDetails={(batch) => setSelectedManufacturerBatch(batch)}
            />
          ) : userProfile?.role === 'processor' ? (
            <ProcessorBatchList
              userId={userId || ''}
              onViewDetails={(batch) => setSelectedProcessorBatch(batch)}
            />
          ) : (
            <CollectorBatchList
              userId={userId || ''}
              onViewDetails={(batch) => setSelectedBatch(batch)}
            />
          )
        ) : (
          userProfile?.role === 'manufacturer' ? (
            <ManufacturerBatchForm
              onSubmit={handleCreateManufacturerBatch}
              onCancel={() => setActiveTab('view')}
              userId={userId || ''}
            />
          ) : userProfile?.role === 'processor' ? (
            <ProcessorBatchForm
              onSubmit={handleCreateProcessorBatch}
              onCancel={() => setActiveTab('view')}
              userId={userId || ''}
            />
          ) : (
            <CollectorBatchForm
              onSubmit={handleCreateBatch}
              onCancel={() => setActiveTab('view')}
              userId={userId || ''}
            />
          )
        )}

        {selectedBatch && (
          <BatchDetailsModal
            batch={selectedBatch}
            onClose={() => setSelectedBatch(null)}
          />
        )}

        {selectedProcessorBatch && (
          <ProcessorBatchDetailsModal
            batch={selectedProcessorBatch}
            onClose={() => setSelectedProcessorBatch(null)}
          />
        )}

        {selectedManufacturerBatch && (
          <ManufacturerBatchDetailsModal
            batch={selectedManufacturerBatch}
            onClose={() => setSelectedManufacturerBatch(null)}
          />
        )}

        <AIChatAssistant
          userId={userId || ''}
          userRole={userProfile?.role || ''}
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
        />

        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full shadow-glass shadow-blue-500/50 transition-all hover:scale-110 z-40 group"
        >
          <Bot className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="absolute right-full mr-3 px-3 py-2 bg-white/10 backdrop-blur-xl rounded-lg text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
            Ask AI Assistant
          </span>
        </button>
      </div>
    </div>
  );
}
