import { useState } from 'react';
import { Package, Search, Camera } from 'lucide-react';
import { QRCodeScanner } from '../components/QRCodeScanner';
import { BatchDetailsViewer } from '../components/BatchDetailsViewer';
import { QRCodeData } from '../services/qrCodeService';

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-800">FoodTrace</span>
            <span className="text-sm text-gray-500 ml-2">Public Tracker</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {scannedData ? (
          <BatchDetailsViewer qrData={scannedData} onClose={handleCloseBatchDetails} />
        ) : (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Track Your Food</h1>
            <p className="text-xl text-gray-600">
              Enter a batch ID to see the complete journey of your food from farm to table
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!showScanner ? (
              <>
            <form onSubmit={handleSearch}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="Enter batch ID or scan QR code"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !batchId.trim()}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {searching ? 'Searching...' : 'Track'}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowScanner(true)}
                className="w-full px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan QR Code Instead
              </button>
            </div>
              </>
            ) : (
              <div>
                <QRCodeScanner
                  onScanSuccess={handleScanSuccess}
                  showManualEntry={false}
                  showFileUpload={true}
                />
                <button
                  onClick={() => setShowScanner(false)}
                  className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Manual Entry
                </button>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">How to track</h3>
              <ol className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span>Find the batch ID on your product label or QR code</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span>Enter the batch ID in the search box above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span>View the complete supply chain history and quality information</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
