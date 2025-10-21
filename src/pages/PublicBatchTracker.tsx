import { useState } from 'react';
import { Package, Search, Camera } from 'lucide-react';
import { QRCodeScanner } from '../components/QRCodeScanner';
import { BatchDetailsViewer } from '../components/BatchDetailsViewer';
import { QRCodeData } from '../services/qrCodeService';
import { GlassCard, GlassButton, GlassInput } from '../components/glass';

export function PublicBatchTracker() {
  const [batchId, setBatchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;

    setSearching(true);
    try {
      const qrData: QRCodeData = {
        batchId: batchId.trim(),
        batchNumber: batchId.trim(),
        contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'base-sepolia',
        phase: 'unknown',
        timestamp: Date.now(),
        verificationUrl: `${window.location.origin}/verify/${batchId.trim()}`
      };
      setScannedData(qrData);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleScanSuccess = (data: QRCodeData) => {
    setScannedData(data);
    setShowScanner(false);
  };

  const handleCloseBatchDetails = () => {
    setScannedData(null);
    setBatchId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-glass relative z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Package className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-2xl font-bold text-white">FoodTrace</span>
            <span className="text-sm text-white/60 ml-2">Public Tracker</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 relative z-10">
        {scannedData ? (
          <BatchDetailsViewer qrData={scannedData} onClose={handleCloseBatchDetails} />
        ) : (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-4">Track Your Food</h1>
            <p className="text-xl text-white/80">
              Enter a batch ID to see the complete journey of your food from farm to table
            </p>
          </div>

          <GlassCard className="animate-scale-in">
            {!showScanner ? (
              <>
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <GlassInput
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="Enter batch ID or scan QR code"
                    icon={<Search className="w-5 h-5" />}
                  />
                </div>
                <GlassButton
                  type="submit"
                  disabled={searching || !batchId.trim()}
                  variant="accent"
                  size="lg"
                >
                  {searching ? 'Searching...' : 'Track'}
                </GlassButton>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <GlassButton
                onClick={() => setShowScanner(true)}
                variant="primary"
                fullWidth
              >
                <Camera className="w-5 h-5" />
                Scan QR Code Instead
              </GlassButton>
            </div>
              </>
            ) : (
              <div>
                <QRCodeScanner
                  onScanSuccess={handleScanSuccess}
                  showManualEntry={false}
                  showFileUpload={true}
                />
                <GlassButton
                  onClick={() => setShowScanner(false)}
                  variant="secondary"
                  fullWidth
                  className="mt-4"
                >
                  Back to Manual Entry
                </GlassButton>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">How to track</h3>
              <ol className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center text-sm font-semibold border border-emerald-400/30">
                    1
                  </span>
                  <span>Find the batch ID on your product label or QR code</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center text-sm font-semibold border border-emerald-400/30">
                    2
                  </span>
                  <span>Enter the batch ID in the search box above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center text-sm font-semibold border border-emerald-400/30">
                    3
                  </span>
                  <span>View the complete supply chain history and quality information</span>
                </li>
              </ol>
            </div>
          </GlassCard>
        </div>
        )}
      </div>
    </div>
  );
}
