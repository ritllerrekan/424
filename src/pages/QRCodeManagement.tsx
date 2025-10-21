import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { QrCode, Search, Download, Eye, Trash2, Upload, ArrowLeft, Package } from 'lucide-react';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { QRCodeScanner } from '../components/QRCodeScanner';
import { BatchCertificate } from '../components/BatchCertificate';
import {
  getQRCodesByUser,
  StoredQRCode,
  saveQRCode,
  getQRCodeStats,
  deleteQRCode
} from '../services/qrCodeStorage';
import { GeneratedQRCode, QRCodeData, getQRCodeIPFSUrl } from '../services/qrCodeService';

export function QRCodeManagement() {
  const { userId, userProfile } = useWeb3Auth();
  const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'list'>('generate');
  const [qrCodes, setQrCodes] = useState<StoredQRCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<{ total: number; phaseBreakdown: Record<string, number> }>({
    total: 0,
    phaseBreakdown: {}
  });
  const [selectedQRCode, setSelectedQRCode] = useState<StoredQRCode | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  useEffect(() => {
    if (userId) {
      loadUserQRCodes();
      loadStats();
    }
  }, [userId]);

  const loadUserQRCodes = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const codes = await getQRCodesByUser(userId);
      setQrCodes(codes);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!userId) return;
    try {
      const statsData = await getQRCodeStats(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleQRGenerated = async (qrCode: GeneratedQRCode) => {
    if (!userId) return;
    try {
      await saveQRCode(qrCode, userId);
      await loadUserQRCodes();
      await loadStats();
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert('Failed to save QR code to database');
    }
  };

  const handleScanSuccess = (data: QRCodeData) => {
    window.location.href = data.verificationUrl;
  };

  const handleDeleteQRCode = async (qrCodeId: string) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    try {
      await deleteQRCode(qrCodeId, userId);
      await loadUserQRCodes();
      await loadStats();
    } catch (error) {
      console.error('Error deleting QR code:', error);
      alert('Failed to delete QR code');
    }
  };

  const handleViewCertificate = (qrCode: StoredQRCode) => {
    setSelectedQRCode(qrCode);
    setShowCertificate(true);
  };

  const filteredQRCodes = qrCodes.filter(
    (qr) =>
      qr.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.batch_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const demoQRCode: GeneratedQRCode = {
    dataUrl: '',
    base64: '',
    qrData: {
      batchId: 'demo-batch-123',
      batchNumber: 'BATCH-2025-001',
      contractAddress: contractAddress,
      network: 'base-sepolia',
      phase: userProfile?.role || 'collection',
      timestamp: Date.now(),
      verificationUrl: `${window.location.origin}/verify/demo-batch-123`
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <Package className="w-8 h-8 text-emerald-600" />
                <span className="text-2xl font-bold text-gray-800">FoodTrace</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-600" />
              <span className="text-lg font-semibold text-gray-800">QR Code Management</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Management</h1>
          <p className="text-gray-600">
            Generate, scan, and manage QR codes for batch tracking
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total QR Codes</div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <QrCode className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          {Object.entries(stats.phaseBreakdown).map(([phase, count]) => (
            <div key={phase} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                </div>
                <QrCode className="w-10 h-10 text-blue-600" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'generate'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <QrCode className="w-5 h-5" />
            Generate QR Code
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'scan'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Search className="w-5 h-5" />
            Scan QR Code
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Eye className="w-5 h-5" />
            View All QR Codes
          </button>
        </div>

        {showCertificate && selectedQRCode ? (
          <div className="space-y-6">
            <button
              onClick={() => setShowCertificate(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to List
            </button>
            <BatchCertificate
              batchNumber={selectedQRCode.batch_number}
              phase={selectedQRCode.phase}
              qrCode={{
                dataUrl: selectedQRCode.qr_data_url,
                base64: selectedQRCode.qr_data_url.split(',')[1],
                ipfsHash: selectedQRCode.qr_ipfs_hash,
                qrData: {
                  batchId: selectedQRCode.batch_id,
                  batchNumber: selectedQRCode.batch_number,
                  contractAddress: selectedQRCode.contract_address,
                  network: selectedQRCode.network,
                  phase: selectedQRCode.phase,
                  timestamp: new Date(selectedQRCode.created_at).getTime(),
                  ipfsHash: selectedQRCode.metadata_ipfs_hash,
                  verificationUrl: selectedQRCode.verification_url
                }
              }}
              batchDetails={{
                collectorInfo: {
                  organization: userProfile?.organization
                }
              }}
            />
          </div>
        ) : (
          <>
            {activeTab === 'generate' && (
              <QRCodeGenerator
                batchId={`demo-batch-${Date.now()}`}
                batchNumber={`BATCH-${new Date().getFullYear()}-${String(qrCodes.length + 1).padStart(3, '0')}`}
                phase={userProfile?.role || 'collection'}
                contractAddress={contractAddress}
                additionalInfo={{
                  organization: userProfile?.organization,
                  date: new Date().toLocaleDateString()
                }}
                onQRGenerated={handleQRGenerated}
              />
            )}

            {activeTab === 'scan' && (
              <QRCodeScanner onScanSuccess={handleScanSuccess} />
            )}

            {activeTab === 'list' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by batch number or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading QR codes...</p>
                  </div>
                ) : filteredQRCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {searchTerm ? 'No matching QR codes found' : 'No QR codes yet'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm
                        ? 'Try a different search term'
                        : 'Generate your first QR code to get started'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setActiveTab('generate')}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Generate QR Code
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQRCodes.map((qr) => (
                      <div
                        key={qr.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {qr.batch_number}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {qr.phase.toUpperCase()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleViewCertificate(qr)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Certificate"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQRCode(qr.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 flex items-center justify-center mb-3">
                          <img
                            src={qr.qr_data_url}
                            alt="QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="text-gray-800">
                              {new Date(qr.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {qr.qr_ipfs_hash && (
                            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                              <Upload className="w-3 h-3 text-purple-600" />
                              <a
                                href={getQRCodeIPFSUrl(qr.qr_ipfs_hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-700 text-xs truncate"
                              >
                                View on IPFS
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
