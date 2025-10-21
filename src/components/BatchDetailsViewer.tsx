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
  FileText
} from 'lucide-react';
import {
  getFullSupplyChain,
  getPhaseLabel,
  getStatusLabel,
  FullSupplyChain
} from '../services/blockchainService';
import { fetchIPFSMetadata, getIPFSUrl, IPFSMetadata } from '../services/ipfsService';
import { QRCodeData } from '../services/qrCodeService';

interface BatchDetailsViewerProps {
  qrData: QRCodeData;
  onClose?: () => void;
}

export function BatchDetailsViewer({ qrData, onClose }: BatchDetailsViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplyChain, setSupplyChain] = useState<FullSupplyChain | null>(null);
  const [ipfsMetadata, setIpfsMetadata] = useState<IPFSMetadata | null>(null);

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

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Batch {batch.batchNumber}</h1>
              <p className="text-emerald-100 mt-1">Complete Supply Chain Verification</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
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
        {ipfsMetadata && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">IPFS Metadata Available</h3>
            </div>
            <a
              href={getIPFSUrl(qrData.ipfsHash!)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View on IPFS
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {collector && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Collection Phase</h3>
                <p className="text-sm text-gray-600">Collector: {formatAddress(collector.collectorAddress)}</p>
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
          </div>
        )}

        {tester && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Testing Phase</h3>
                <p className="text-sm text-gray-600">Tester: {formatAddress(tester.testerAddress)}</p>
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
          </div>
        )}

        {processor && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Factory className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Processing Phase</h3>
                <p className="text-sm text-gray-600">Processor: {formatAddress(processor.processorAddress)}</p>
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
          </div>
        )}

        {manufacturer && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Manufacturing Phase</h3>
                <p className="text-sm text-gray-600">Manufacturer: {formatAddress(manufacturer.manufacturerAddress)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Product Name</p>
                <p className="font-semibold text-gray-800">{manufacturer.productName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand Name</p>
                <p className="font-semibold text-gray-800">{manufacturer.brandName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Product Type</p>
                <p className="font-semibold text-gray-800">{manufacturer.productType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-semibold text-gray-800">{manufacturer.quantity} {manufacturer.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-800">{manufacturer.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Manufacture Date</p>
                <p className="font-semibold text-gray-800">{manufacturer.manufactureDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiry Date</p>
                <p className="font-semibold text-gray-800">{manufacturer.expiryDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Processor Rating</p>
                <p className="font-semibold text-gray-800">{manufacturer.processorRating}/10</p>
              </div>
            </div>
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
