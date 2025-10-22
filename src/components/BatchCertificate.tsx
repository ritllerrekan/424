import { useState, useEffect } from 'react';
import { Download, Share2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { GeneratedQRCode } from '../services/qrCodeService';
import { FullSupplyChain } from '../services/blockchainService';
import { WasteMetric } from '../types/waste';
import {
  downloadCertificatePDF,
  uploadCertificateToIPFS,
  CertificateData,
  CertificateMetadata
} from '../services/certificateService';

interface BatchCertificateProps {
  batchNumber: string;
  batchId: string;
  phase: string;
  qrCode: GeneratedQRCode;
  supplyChainData: FullSupplyChain;
  wasteMetrics?: WasteMetric[];
  userAddress?: string;
  batchDetails: {
    collectorInfo?: {
      organization?: string;
      harvestDate?: string;
      seedCropName?: string;
      location?: string;
    };
    testerInfo?: {
      labName?: string;
      testDate?: string;
      qualityScore?: number;
    };
    processorInfo?: {
      organization?: string;
      processingType?: string;
    };
    manufacturerInfo?: {
      productName?: string;
      brandName?: string;
      manufactureDate?: string;
      expiryDate?: string;
    };
  };
}

export function BatchCertificate({
  batchNumber,
  batchId,
  phase,
  qrCode,
  supplyChainData,
  wasteMetrics,
  userAddress,
  batchDetails
}: BatchCertificateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [certificateMetadata, setCertificateMetadata] = useState<CertificateMetadata | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCertificateData = (): CertificateData => ({
    batchNumber,
    supplyChainData,
    wasteMetrics,
    verificationUrl: qrCode.qrData.verificationUrl,
    contractAddress: qrCode.qrData.contractAddress,
    network: qrCode.qrData.network
  });

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const certificateData = getCertificateData();
      const metadata = await downloadCertificatePDF(
        certificateData,
        userAddress || 'anonymous',
        batchId
      );

      setCertificateMetadata(metadata);
      alert('Certificate downloaded successfully!');
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError('Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadToIPFS = async () => {
    try {
      setIsUploading(true);
      setError(null);

      const certificateData = getCertificateData();
      const { ipfsHash: hash, metadata } = await uploadCertificateToIPFS(
        certificateData,
        userAddress || 'anonymous',
        batchId
      );

      setIpfsHash(hash);
      setCertificateMetadata(metadata);
      alert(`Certificate uploaded to IPFS!\nHash: ${hash}`);
    } catch (err) {
      console.error('Error uploading to IPFS:', err);
      setError('Failed to upload certificate to IPFS. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const shareCertificate = async () => {
    const shareData = {
      title: `FoodTrace Batch Certificate - ${batchNumber}`,
      text: `View batch ${batchNumber} certificate on FoodTrace blockchain supply chain`,
      url: qrCode.qrData.verificationUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(qrCode.qrData.verificationUrl);
        alert('Verification link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Batch Certificate</h2>
        <div className="flex gap-2">
          <button
            onClick={shareCertificate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleUploadToIPFS}
            disabled={isUploading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {certificateMetadata && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Certificate Generated Successfully</p>
              <p className="text-xs text-emerald-700 mt-1">
                Certificate ID: {certificateMetadata.certificateId}
              </p>
              <p className="text-xs text-emerald-700">
                Hash: {certificateMetadata.certificateHash.slice(0, 32)}...
              </p>
              {ipfsHash && (
                <p className="text-xs text-emerald-700 mt-1">
                  IPFS Hash: <a
                    href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-emerald-900"
                  >
                    {ipfsHash}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div id="certificate-content" className="certificate">
        <div className="header">
          <div className="title">FoodTrace Certificate</div>
          <div className="subtitle">Blockchain-Verified Supply Chain</div>
        </div>

        <div className="content">
          <div>
            <div className="info-section">
              <div className="info-label">Batch Number</div>
              <div className="info-value">{batchNumber}</div>
            </div>

            <div className="info-section">
              <div className="info-label">Current Phase</div>
              <div className="info-value">{phase.toUpperCase()}</div>
            </div>

            {batchDetails.collectorInfo && (
              <>
                <div className="info-section">
                  <div className="info-label">Collector Organization</div>
                  <div className="info-value">
                    {batchDetails.collectorInfo.organization || 'N/A'}
                  </div>
                </div>
                {batchDetails.collectorInfo.seedCropName && (
                  <div className="info-section">
                    <div className="info-label">Crop Type</div>
                    <div className="info-value">
                      {batchDetails.collectorInfo.seedCropName}
                    </div>
                  </div>
                )}
                {batchDetails.collectorInfo.harvestDate && (
                  <div className="info-section">
                    <div className="info-label">Harvest Date</div>
                    <div className="info-value">
                      {batchDetails.collectorInfo.harvestDate}
                    </div>
                  </div>
                )}
              </>
            )}

            {batchDetails.testerInfo && (
              <>
                <div className="info-section">
                  <div className="info-label">Testing Laboratory</div>
                  <div className="info-value">
                    {batchDetails.testerInfo.labName || 'N/A'}
                  </div>
                </div>
                {batchDetails.testerInfo.qualityScore && (
                  <div className="info-section">
                    <div className="info-label">Quality Score</div>
                    <div className="info-value">
                      {batchDetails.testerInfo.qualityScore}/100
                    </div>
                  </div>
                )}
              </>
            )}

            {batchDetails.manufacturerInfo && (
              <>
                <div className="info-section">
                  <div className="info-label">Product Name</div>
                  <div className="info-value">
                    {batchDetails.manufacturerInfo.productName || 'N/A'}
                  </div>
                </div>
                {batchDetails.manufacturerInfo.brandName && (
                  <div className="info-section">
                    <div className="info-label">Brand</div>
                    <div className="info-value">
                      {batchDetails.manufacturerInfo.brandName}
                    </div>
                  </div>
                )}
                {batchDetails.manufacturerInfo.manufactureDate && (
                  <div className="info-section">
                    <div className="info-label">Manufacture Date</div>
                    <div className="info-value">
                      {batchDetails.manufacturerInfo.manufactureDate}
                    </div>
                  </div>
                )}
                {batchDetails.manufacturerInfo.expiryDate && (
                  <div className="info-section">
                    <div className="info-label">Expiry Date</div>
                    <div className="info-value">
                      {batchDetails.manufacturerInfo.expiryDate}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="qr-section">
            <img
              src={qrCode.dataUrl}
              alt="Batch QR Code"
            />
            <div className="qr-label">Scan to verify on blockchain</div>
          </div>
        </div>

        {wasteMetrics && wasteMetrics.length > 0 && (
          <div className="waste-summary" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#991b1b', marginBottom: '10px' }}>Waste Metrics Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <div className="info-label" style={{ fontSize: '12px' }}>Total Waste</div>
                <div className="info-value" style={{ fontSize: '14px', color: '#dc2626' }}>
                  {wasteMetrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0).toFixed(2)} kg
                </div>
              </div>
              <div>
                <div className="info-label" style={{ fontSize: '12px' }}>Cost Impact</div>
                <div className="info-value" style={{ fontSize: '14px', color: '#dc2626' }}>
                  ${wasteMetrics.reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="info-label" style={{ fontSize: '12px' }}>Incidents</div>
                <div className="info-value" style={{ fontSize: '14px', color: '#dc2626' }}>
                  {wasteMetrics.length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="blockchain-info">
          <div style={{ marginBottom: '10px' }}>
            <div className="blockchain-label">Network</div>
            <div className="blockchain-value">{qrCode.qrData.network}</div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div className="blockchain-label">Smart Contract</div>
            <div className="blockchain-value">{qrCode.qrData.contractAddress}</div>
          </div>
          <div>
            <div className="blockchain-label">Verification URL</div>
            <div className="blockchain-value">{qrCode.qrData.verificationUrl}</div>
          </div>
          {qrCode.ipfsHash && (
            <div style={{ marginTop: '10px' }}>
              <div className="blockchain-label">QR Code IPFS Hash</div>
              <div className="blockchain-value">{qrCode.ipfsHash}</div>
            </div>
          )}
          {certificateMetadata && (
            <div style={{ marginTop: '10px' }}>
              <div className="blockchain-label">Certificate Hash</div>
              <div className="blockchain-value">{certificateMetadata.certificateHash}</div>
            </div>
          )}
        </div>

        {supplyChainData.collector && supplyChainData.tester && supplyChainData.processor && supplyChainData.manufacturer && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '10px' }}>Participant Signatures</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#374151' }}>Collector</div>
                <div style={{ color: '#6b7280', fontFamily: 'monospace' }}>{supplyChainData.collector.collectorAddress.slice(0, 10)}...</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#374151' }}>Tester</div>
                <div style={{ color: '#6b7280', fontFamily: 'monospace' }}>{supplyChainData.tester.testerAddress.slice(0, 10)}...</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#374151' }}>Processor</div>
                <div style={{ color: '#6b7280', fontFamily: 'monospace' }}>{supplyChainData.processor.processorAddress.slice(0, 10)}...</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#374151' }}>Manufacturer</div>
                <div style={{ color: '#6b7280', fontFamily: 'monospace' }}>{supplyChainData.manufacturer.manufacturerAddress.slice(0, 10)}...</div>
              </div>
            </div>
          </div>
        )}

        <div className="footer">
          <p>This certificate is digitally verified on the blockchain and cannot be forged</p>
          <p style={{ marginTop: '5px' }}>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          {certificateMetadata && (
            <p style={{ marginTop: '5px', fontSize: '10px' }}>
              Certificate ID: {certificateMetadata.certificateId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
