import { useState, useEffect } from 'react';
import {
  Package,
  MapPin,
  Thermometer,
  Droplets,
  Factory,
  FlaskConical,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  FileText,
  Clock,
  Shield,
  Award,
  Trash2,
  Download
} from 'lucide-react';
import {
  getFullSupplyChain,
  getPhaseLabel,
  getStatusLabel,
  FullSupplyChain
} from '../services/blockchainService';
import { fetchIPFSMetadata, getIPFSUrl, IPFSMetadata } from '../services/ipfsService';
import { QRCodeData, generateBatchQRCode } from '../services/qrCodeService';
import { getWasteMetricsByBatch } from '../services/wasteService';
import { WasteMetric } from '../types/waste';
import { BatchCertificate } from './BatchCertificate';

interface BatchDetailsViewerProps {
  qrData: QRCodeData;
  onClose?: () => void;
}

export function BatchDetailsViewer({ qrData, onClose }: BatchDetailsViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplyChain, setSupplyChain] = useState<FullSupplyChain | null>(null);
  const [ipfsMetadata, setIpfsMetadata] = useState<IPFSMetadata | null>(null);
  const [wasteMetrics, setWasteMetrics] = useState<WasteMetric[]>([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<any>(null);

  useEffect(() => {
    loadBatchData();
  }, [qrData.batchId]);

  const loadBatchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const chain = await getFullSupplyChain(qrData.batchId);

      if (!chain) {
        setError('Batch not found on blockchain');
        setLoading(false);
        return;
      }

      setSupplyChain(chain);

      if (qrData.ipfsHash) {
        const metadata = await fetchIPFSMetadata(qrData.ipfsHash);
        setIpfsMetadata(metadata);
      }

      try {
        const metrics = await getWasteMetricsByBatch(qrData.batchId);
        setWasteMetrics(metrics);
      } catch (err) {
        console.log('No waste metrics found');
      }

      try {
        const qrCode = await generateBatchQRCode(
          qrData.batchId,
          chain.batch.batchNumber,
          getPhaseLabel(chain.batch.currentPhase),
          chain.batch.currentPhase === 4 ? chain.manufacturer?.brandName : undefined
        );
        setGeneratedQRCode(qrCode);
      } catch (err) {
        console.log('QR code generation skipped');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading batch data:', err);
      setError(err.message || 'Failed to load batch data');
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatGPS = (lat: string, lon: string) => {
    const latNum = Number(lat) / 1000000;
    const lonNum = Number(lon) / 1000000;
    return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`;
  };

  const getPhaseWasteMetrics = (phase: string) => {
    return wasteMetrics.filter(m => m.phase === phase);
  };

  const calculateTotalWaste = (metrics: WasteMetric[]) => {
    return metrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
        <p className="text-center text-gray-600 mt-4">
          Loading batch data from blockchain...
        </p>
      </div>
    );
  }

  if (error || !supplyChain) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Error Loading Batch</h2>
        </div>
        <p className="text-gray-600 mb-6">{error || 'Batch data not available'}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const { batch, collector, tester, processor, manufacturer } = supplyChain;

  if (showCertificate && generatedQRCode) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowCertificate(false)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Details
        </button>
        <BatchCertificate
          batchNumber={batch.batchNumber}
          phase={getPhaseLabel(batch.currentPhase)}
          qrCode={generatedQRCode}
          batchDetails={{
            collectorInfo: collector ? {
              harvestDate: collector.harvestDate,
              seedCropName: collector.seedCropName
            } : undefined,
            testerInfo: tester ? {
              labName: tester.labName,
              testDate: tester.testDate,
              qualityScore: Number(tester.qualityGradeScore)
            } : undefined,
            processorInfo: processor ? {
              processingType: processor.processingType
            } : undefined,
            manufacturerInfo: manufacturer ? {
              productName: manufacturer.productName,
              brandName: manufacturer.brandName,
              manufactureDate: manufacturer.manufactureDate,
              expiryDate: manufacturer.expiryDate
            } : undefined
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Batch {batch.batchNumber}</h1>
              <p className="text-emerald-100 mt-1">Complete Supply Chain Verification</p>
            </div>
          </div>
          <div className="flex gap-2">
            {generatedQRCode && (
              <button
                onClick={() => setShowCertificate(true)}
                className="px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2 font-semibold"
              >
                <Download className="w-4 h-4" />
                Certificate
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-sm">Current Phase</p>
            <p className="text-xl font-semibold mt-1">{getPhaseLabel(batch.currentPhase)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-sm">Status</p>
            <p className="text-xl font-semibold mt-1">{getStatusLabel(batch.status)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-sm">Created</p>
            <p className="text-xl font-semibold mt-1">{formatDate(batch.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Blockchain Verified</h3>
            </div>
            <p className="text-sm text-gray-600">All data secured on Base Sepolia</p>
          </div>

          {batch.currentPhase === 4 && manufacturer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Complete Chain</h3>
              </div>
              <p className="text-sm text-gray-600">All phases verified</p>
            </div>
          )}

          {ipfsMetadata && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="font-semibold text-gray-800">IPFS Stored</h3>
              </div>
              <a
                href={getIPFSUrl(qrData.ipfsHash!)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                View Metadata
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {manufacturer && (
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">Final Product</h2>
                <p className="text-blue-700 font-semibold text-lg">{manufacturer.brandName}</p>
              </div>
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                <p className="text-xs uppercase tracking-wide">Manufacturing Phase</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Product Name</p>
                <p className="text-xl font-bold text-gray-800">{manufacturer.productName}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Product Type</p>
                <p className="text-xl font-bold text-gray-800">{manufacturer.productType}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Quantity</p>
                <p className="text-xl font-bold text-gray-800">{manufacturer.quantity} {manufacturer.unit}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="font-semibold text-gray-800">{manufacturer.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Manufacture Date</p>
                  <p className="font-semibold text-gray-800">{manufacturer.manufactureDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                <Clock className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-gray-600">Expiry Date</p>
                  <p className="font-semibold text-gray-800">{manufacturer.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                <Award className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-600">Processor Rating</p>
                  <p className="font-semibold text-gray-800">{manufacturer.processorRating}/10</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-3">
              <Clock className="w-4 h-4" />
              <span>Blockchain Timestamp: {formatDate(manufacturer.timestamp)}</span>
            </div>

            <div className="mt-3 text-sm text-gray-600 bg-white rounded-lg p-3">
              <p className="font-semibold mb-1">Manufacturer Address:</p>
              <p className="font-mono text-xs">{manufacturer.manufacturerAddress}</p>
            </div>

            {getPhaseWasteMetrics('manufacturing').length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-800">Waste Metrics</h4>
                </div>
                <div className="space-y-2">
                  {getPhaseWasteMetrics('manufacturing').map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{metric.waste_category}</span>
                      <span className="font-semibold text-gray-800">{metric.waste_quantity} {metric.waste_unit}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-amber-200">
                    <span className="text-sm font-semibold text-gray-800">
                      Total: {calculateTotalWaste(getPhaseWasteMetrics('manufacturing')).toFixed(2)} kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {collector && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Collection Phase</h3>
                  <p className="text-sm text-gray-600">Collector: {formatAddress(collector.collectorAddress)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatDate(collector.timestamp)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Crop Name</p>
                <p className="font-semibold text-gray-800">{collector.seedCropName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Harvest Date</p>
                <p className="font-semibold text-gray-800">{collector.harvestDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Weight</p>
                <p className="font-semibold text-gray-800">{collector.weightTotal} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="font-semibold text-gray-800">{collector.totalPrice} ETH</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatGPS(collector.gpsLatitude, collector.gpsLongitude)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-sm font-medium text-gray-800">{collector.temperature}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-sm font-medium text-gray-800">{collector.humidity}%</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pesticide Used</p>
                <p className="font-semibold text-gray-800">
                  {collector.pesticideUsed ? `Yes - ${collector.pesticideName}` : 'No'}
                </p>
              </div>
            </div>

            {getPhaseWasteMetrics('collection').length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-800">Waste Metrics</h4>
                </div>
                <div className="space-y-2">
                  {getPhaseWasteMetrics('collection').map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{metric.waste_category}</span>
                      <span className="font-semibold text-gray-800">{metric.waste_quantity} {metric.waste_unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tester && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Testing Phase</h3>
                  <p className="text-sm text-gray-600">Tester: {formatAddress(tester.testerAddress)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatDate(tester.timestamp)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Lab Name</p>
                <p className="font-semibold text-gray-800">{tester.labName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Test Date</p>
                <p className="font-semibold text-gray-800">{tester.testDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quality Grade Score</p>
                <p className="font-semibold text-gray-800">{tester.qualityGradeScore}/100</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purity Level</p>
                <p className="font-semibold text-gray-800">{tester.purityLevel}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contaminant Level</p>
                <p className="font-semibold text-gray-800">{tester.contaminantLevel} ppm</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Collector Rating</p>
                <p className="font-semibold text-gray-800">{tester.collectorRating}/10</p>
              </div>
            </div>

            {tester.collectorRatingNotes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Rating Notes</p>
                <p className="text-sm text-gray-800">{tester.collectorRatingNotes}</p>
              </div>
            )}

            {getPhaseWasteMetrics('testing').length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-800">Waste Metrics</h4>
                </div>
                <div className="space-y-2">
                  {getPhaseWasteMetrics('testing').map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{metric.waste_category}</span>
                      <span className="font-semibold text-gray-800">{metric.waste_quantity} {metric.waste_unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {processor && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Factory className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Processing Phase</h3>
                  <p className="text-sm text-gray-600">Processor: {formatAddress(processor.processorAddress)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatDate(processor.timestamp)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Processing Type</p>
                <p className="font-semibold text-gray-800">{processor.processingType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Ratio</p>
                <p className="font-semibold text-gray-800">{processor.conversionRatio}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Input Weight</p>
                <p className="font-semibold text-gray-800">{processor.inputWeight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Output Weight</p>
                <p className="font-semibold text-gray-800">{processor.outputWeight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chemicals/Additives</p>
                <p className="font-semibold text-gray-800">{processor.chemicalsAdditives || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tester Rating</p>
                <p className="font-semibold text-gray-800">{processor.testerRating}/10</p>
              </div>
            </div>

            {getPhaseWasteMetrics('processing').length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-800">Waste Metrics</h4>
                </div>
                <div className="space-y-2">
                  {getPhaseWasteMetrics('processing').map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{metric.waste_category}</span>
                      <span className="font-semibold text-gray-800">{metric.waste_quantity} {metric.waste_unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              All data verified on blockchain
            </p>
          </div>
          <p className="text-xs text-green-700 mt-2">
            This information is immutable and cryptographically secured on the Base Sepolia network.
          </p>
        </div>
      </div>
    </div>
  );
}
