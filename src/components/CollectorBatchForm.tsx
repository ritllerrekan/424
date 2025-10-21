import { useState } from 'react';
import { MapPin, Cloud, Droplets, Calendar, Package, DollarSign, FileText, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from './glass';
import { uploadToIPFS, uploadFileToIPFS } from '../services/ipfsUploadService';
import { useBiconomy } from '../contexts/BiconomyContext';
import { ethers } from 'ethers';

interface CollectorBatchFormProps {
  onSubmit: (batchData: CollectorBatchData) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

export interface CollectorBatchData {
  collectorId: string;
  batchNumber: string;
  seedCropName: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  weatherCondition: string;
  temperature: number | null;
  harvestDate: string;
  pesticideUsed: boolean;
  pesticideName: string;
  pesticideQuantity: string;
  pricePerUnit: number;
  weightTotal: number;
  totalPrice: number;
  documents: Array<{ file: File; type: string }>;
  ipfsHash?: string;
}

export function CollectorBatchForm({ onSubmit, onCancel, userId }: CollectorBatchFormProps) {
  const { sendTransaction, loading: biconomyLoading } = useBiconomy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; type: string }>>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [formData, setFormData] = useState<CollectorBatchData>({
    collectorId: userId,
    batchNumber: `BATCH-${Date.now()}`,
    seedCropName: '',
    gpsLatitude: null,
    gpsLongitude: null,
    weatherCondition: '',
    temperature: null,
    harvestDate: new Date().toISOString().split('T')[0],
    pesticideUsed: false,
    pesticideName: '',
    pesticideQuantity: '',
    pricePerUnit: 0,
    weightTotal: 0,
    totalPrice: 0,
    documents: []
  });

  const handleInputChange = (field: keyof CollectorBatchData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'pricePerUnit' || field === 'weightTotal') {
        updated.totalPrice = (updated.pricePerUnit || 0) * (updated.weightTotal || 0);
      }

      return updated;
    });
  };

  const captureGPSLocation = () => {
    setIsCapturingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsCapturingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          gpsLatitude: position.coords.latitude,
          gpsLongitude: position.coords.longitude
        }));
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please check your browser permissions.');
        setIsCapturingLocation(false);
      }
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      file,
      type: file.type
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.seedCropName || formData.weightTotal <= 0 || formData.pricePerUnit <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('uploading');
    setBlockchainStatus('idle');
    setStatusMessage('Uploading photos to IPFS...');

    try {
      let documentIpfsHashes: string[] = [];

      if (uploadedFiles.length > 0) {
        for (const fileData of uploadedFiles) {
          const hash = await uploadFileToIPFS(fileData.file);
          documentIpfsHashes.push(hash);
        }
      }

      const metadata = {
        batchNumber: formData.batchNumber,
        seedCropName: formData.seedCropName,
        gpsLatitude: formData.gpsLatitude,
        gpsLongitude: formData.gpsLongitude,
        weatherCondition: formData.weatherCondition,
        temperature: formData.temperature,
        harvestDate: formData.harvestDate,
        pesticideUsed: formData.pesticideUsed,
        pesticideName: formData.pesticideName,
        pesticideQuantity: formData.pesticideQuantity,
        pricePerUnit: formData.pricePerUnit,
        weightTotal: formData.weightTotal,
        totalPrice: formData.totalPrice,
        documents: documentIpfsHashes,
        timestamp: new Date().toISOString()
      };

      setStatusMessage('Uploading metadata to IPFS...');
      const ipfsHash = await uploadToIPFS(metadata);
      setUploadStatus('success');
      setStatusMessage('Upload successful! Submitting to blockchain...');

      setBlockchainStatus('submitting');
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      const gpsLatInt = formData.gpsLatitude ? Math.floor(formData.gpsLatitude * 1000000) : 0;
      const gpsLonInt = formData.gpsLongitude ? Math.floor(formData.gpsLongitude * 1000000) : 0;
      const tempInt = formData.temperature ? Math.floor(formData.temperature * 10) : 0;
      const pricePerUnitWei = ethers.parseEther(formData.pricePerUnit.toString());
      const totalPriceWei = ethers.parseEther(formData.totalPrice.toString());

      const contractInterface = new ethers.Interface([
        'function addCollectorData(string,int256,int256,string,int16,uint8,string,string,bool,string,string,uint256,uint256,uint256,string) returns (uint256)'
      ]);

      const txData = contractInterface.encodeFunctionData('addCollectorData', [
        formData.batchNumber,
        gpsLatInt,
        gpsLonInt,
        formData.weatherCondition || '',
        tempInt,
        0,
        formData.harvestDate,
        formData.seedCropName,
        formData.pesticideUsed,
        formData.pesticideName || '',
        formData.pesticideQuantity || '',
        pricePerUnitWei,
        Math.floor(formData.weightTotal * 1000),
        totalPriceWei,
        ipfsHash
      ]);

      const txHash = await sendTransaction(contractAddress, txData);
      setTransactionHash(txHash);
      setBlockchainStatus('success');
      setStatusMessage('Transaction confirmed on blockchain!');

      const dataWithIPFS = {
        ...formData,
        documents: uploadedFiles,
        ipfsHash,
        transactionHash: txHash
      };

      await onSubmit(dataWithIPFS);

      setTimeout(() => {
        setUploadStatus('idle');
        setBlockchainStatus('idle');
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting batch:', error);
      setUploadStatus('error');
      setBlockchainStatus('error');
      setStatusMessage('Failed to create batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Collection Batch</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Batch Number
            </label>
            <GlassInput
              value={formData.batchNumber}
              onChange={(e) => handleInputChange('batchNumber', e.target.value)}
              placeholder="Auto-generated"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Seed/Crop Name *
            </label>
            <GlassInput
              value={formData.seedCropName}
              onChange={(e) => handleInputChange('seedCropName', e.target.value)}
              placeholder="e.g., Wheat, Rice, Corn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Harvest Date *
            </label>
            <GlassInput
              type="date"
              value={formData.harvestDate}
              onChange={(e) => handleInputChange('harvestDate', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              GPS Location
            </label>
            <div className="flex gap-2">
              <GlassInput
                value={formData.gpsLatitude || ''}
                placeholder="Latitude"
                readOnly
              />
              <GlassInput
                value={formData.gpsLongitude || ''}
                placeholder="Longitude"
                readOnly
              />
              <GlassButton
                type="button"
                onClick={captureGPSLocation}
                disabled={isCapturingLocation}
                variant="secondary"
              >
                {isCapturingLocation ? 'Capturing...' : 'Capture'}
              </GlassButton>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Cloud className="w-4 h-4 inline mr-2" />
              Weather Condition
            </label>
            <select
              value={formData.weatherCondition}
              onChange={(e) => handleInputChange('weatherCondition', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all"
            >
              <option value="">Select weather</option>
              <option value="Sunny">Sunny</option>
              <option value="Cloudy">Cloudy</option>
              <option value="Rainy">Rainy</option>
              <option value="Overcast">Overcast</option>
              <option value="Foggy">Foggy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Droplets className="w-4 h-4 inline mr-2" />
              Temperature (°C)
            </label>
            <GlassInput
              type="number"
              value={formData.temperature || ''}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || null)}
              placeholder="e.g., 25"
              step="0.1"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pesticide Information</h3>

          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pesticideUsed}
                onChange={(e) => handleInputChange('pesticideUsed', e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
              />
              <span className="text-white/80">Pesticide was used</span>
            </label>
          </div>

          {formData.pesticideUsed && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Pesticide Name
                </label>
                <GlassInput
                  value={formData.pesticideName}
                  onChange={(e) => handleInputChange('pesticideName', e.target.value)}
                  placeholder="Enter pesticide name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Quantity Used
                </label>
                <GlassInput
                  value={formData.pesticideQuantity}
                  onChange={(e) => handleInputChange('pesticideQuantity', e.target.value)}
                  placeholder="e.g., 500ml, 2kg"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pricing & Weight</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Price Per Unit *
              </label>
              <GlassInput
                type="number"
                value={formData.pricePerUnit || ''}
                onChange={(e) => handleInputChange('pricePerUnit', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Package className="w-4 h-4 inline mr-2" />
                Total Weight (kg) *
              </label>
              <GlassInput
                type="number"
                value={formData.weightTotal || ''}
                onChange={(e) => handleInputChange('weightTotal', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Total Price
              </label>
              <GlassInput
                type="number"
                value={formData.totalPrice.toFixed(2)}
                readOnly
                className="bg-white/5"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Documents & Photos</h3>

          <div className="mb-4">
            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border-2 border-dashed border-white/20 rounded-xl hover:border-emerald-400/50 hover:bg-white/10 transition-all">
                <Upload className="w-5 h-5 text-white/60" />
                <span className="text-white/80">Upload Photos or Documents</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span className="text-white/80 text-sm">{file.file.name}</span>
                    <span className="text-white/40 text-xs">
                      ({(file.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {(uploadStatus !== 'idle' || blockchainStatus !== 'idle') && (
          <div className="border-t border-white/10 pt-6">
            <div className="bg-white/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {uploadStatus === 'uploading' && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                  )}
                  {uploadStatus === 'success' && (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  )}
                  {uploadStatus === 'error' && (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white mb-1">
                    {uploadStatus === 'uploading' && 'Uploading to IPFS'}
                    {uploadStatus === 'success' && 'IPFS Upload Complete'}
                    {uploadStatus === 'error' && 'Upload Failed'}
                  </div>
                  {uploadStatus === 'success' && (
                    <div className="text-xs text-white/60">Photos and metadata stored on IPFS</div>
                  )}
                </div>
              </div>

              {blockchainStatus !== 'idle' && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {blockchainStatus === 'submitting' && (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    )}
                    {blockchainStatus === 'success' && (
                      <CheckCircle className="w-8 h-8 text-blue-400" />
                    )}
                    {blockchainStatus === 'error' && (
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">
                      {blockchainStatus === 'submitting' && 'Submitting to Blockchain'}
                      {blockchainStatus === 'success' && 'Blockchain Confirmed'}
                      {blockchainStatus === 'error' && 'Blockchain Submission Failed'}
                    </div>
                    {transactionHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {statusMessage && (
                <div className="text-sm text-white/80 text-center mt-2">
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <GlassButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="accent"
            disabled={isSubmitting || biconomyLoading}
            className="flex-1"
          >
            {isSubmitting ? 'Creating Batch...' : 'Create Batch'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
