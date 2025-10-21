import { useState } from 'react';
import { QrCode, Download, Printer, Upload, CheckCircle, Loader } from 'lucide-react';
import {
  generateBatchQRCode,
  generatePrintableLabel,
  downloadQRCode,
  printQRLabel,
  uploadQRCodeToIPFS,
  getQRCodeIPFSUrl,
  GeneratedQRCode
} from '../services/qrCodeService';

interface QRCodeGeneratorProps {
  batchId: string;
  batchNumber: string;
  phase: string;
  contractAddress: string;
  ipfsMetadataHash?: string;
  additionalInfo?: {
    productName?: string;
    organization?: string;
    date?: string;
  };
  onQRGenerated?: (qrCode: GeneratedQRCode) => void;
}

export function QRCodeGenerator({
  batchId,
  batchNumber,
  phase,
  contractAddress,
  ipfsMetadataHash,
  additionalInfo,
  onQRGenerated
}: QRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<GeneratedQRCode | null>(null);
  const [printableLabel, setPrintableLabel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [ipfsUploadSuccess, setIpfsUploadSuccess] = useState(false);

  const handleGenerateQRCode = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateBatchQRCode(
        batchId,
        batchNumber,
        phase,
        contractAddress,
        ipfsMetadataHash
      );
      setQrCode(generated);
      onQRGenerated?.(generated);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePrintableLabel = async () => {
    setIsGenerating(true);
    try {
      const label = await generatePrintableLabel(
        batchId,
        batchNumber,
        phase,
        contractAddress,
        additionalInfo
      );
      setPrintableLabel(label);
    } catch (error) {
      console.error('Error generating printable label:', error);
      alert('Failed to generate printable label');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadToIPFS = async () => {
    if (!qrCode) return;

    setIsUploadingToIPFS(true);
    setIpfsUploadSuccess(false);
    try {
      const ipfsHash = await uploadQRCodeToIPFS(qrCode);
      const updatedQRCode = { ...qrCode, ipfsHash };
      setQrCode(updatedQRCode);
      setIpfsUploadSuccess(true);
      onQRGenerated?.(updatedQRCode);
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      alert('Failed to upload QR code to IPFS');
    } finally {
      setIsUploadingToIPFS(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCode) return;
    downloadQRCode(qrCode.dataUrl, `qr-code-${batchNumber}.png`);
  };

  const handleDownloadLabel = () => {
    if (!printableLabel) return;
    downloadQRCode(printableLabel, `label-${batchNumber}.png`);
  };

  const handlePrintLabel = () => {
    if (!printableLabel) return;
    printQRLabel(printableLabel);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <QrCode className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-800">QR Code Generator</h2>
      </div>

      {!qrCode ? (
        <div className="text-center py-8">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Generate a QR code for batch {batchNumber}
          </p>
          <button
            onClick={handleGenerateQRCode}
            disabled={isGenerating}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Generate QR Code
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
                <img
                  src={qrCode.dataUrl}
                  alt="Batch QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadQRCode}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleUploadToIPFS}
                  disabled={isUploadingToIPFS || !!qrCode.ipfsHash}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingToIPFS ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : qrCode.ipfsHash ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload to IPFS
                    </>
                  )}
                </button>
              </div>
              {ipfsUploadSuccess && qrCode.ipfsHash && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Successfully uploaded to IPFS
                  </p>
                  <a
                    href={getQRCodeIPFSUrl(qrCode.ipfsHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-700 break-all"
                  >
                    {getQRCodeIPFSUrl(qrCode.ipfsHash)}
                  </a>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  QR Code Data
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Batch Number:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {qrCode.qrData.batchNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phase:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {qrCode.qrData.phase}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Network:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {qrCode.qrData.network}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contract:</span>
                    <span className="ml-2 font-mono text-xs text-gray-800">
                      {qrCode.qrData.contractAddress.slice(0, 10)}...
                      {qrCode.qrData.contractAddress.slice(-8)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Verification URL:</span>
                    <a
                      href={qrCode.qrData.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-blue-600 hover:text-blue-700 break-all"
                    >
                      {qrCode.qrData.verificationUrl}
                    </a>
                  </div>
                  {qrCode.qrData.ipfsHash && (
                    <div>
                      <span className="text-gray-600">Metadata IPFS:</span>
                      <span className="ml-2 font-mono text-xs text-gray-800">
                        {qrCode.qrData.ipfsHash.slice(0, 10)}...
                        {qrCode.qrData.ipfsHash.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Printable Label
            </h3>
            {!printableLabel ? (
              <button
                onClick={handleGeneratePrintableLabel}
                disabled={isGenerating}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Label...
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Generate Printable Label
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={printableLabel}
                    alt="Printable Label"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadLabel}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Label
                  </button>
                  <button
                    onClick={handlePrintLabel}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Label
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
