import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, StopCircle, AlertCircle, CheckCircle, Upload, Keyboard } from 'lucide-react';
import { decodeQRData, QRCodeData, validateQRCode } from '../services/qrCodeService';

interface QRCodeScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
  onScanError?: (error: string) => void;
  showManualEntry?: boolean;
  showFileUpload?: boolean;
}

export function QRCodeScanner({
  onScanSuccess,
  onScanError,
  showManualEntry = true,
  showFileUpload = true
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBatchId, setManualBatchId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanError(null);
      setScanSuccess(false);

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          const qrData = decodeQRData(decodedText);
          if (qrData) {
            const isValid = await validateQRCode(qrData);
            if (isValid) {
              setScanSuccess(true);
              onScanSuccess(qrData);
              stopScanning();
            } else {
              setScanError('QR code validation failed - data may be tampered');
              onScanError?.('Invalid QR code data');
            }
          } else {
            setScanError('Invalid QR code format');
            onScanError?.('Invalid QR code format');
          }
        },
        () => {
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setHasPermission(false);
      setScanError(
        error.message || 'Failed to start camera. Please check permissions.'
      );
      onScanError?.(error.message || 'Failed to start camera');
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setScanError(null);
      setScanSuccess(false);

      const html5QrCode = new Html5Qrcode('qr-file-reader');

      const decodedText = await html5QrCode.scanFile(file, false);
      const qrData = decodeQRData(decodedText);

      if (qrData) {
        const isValid = await validateQRCode(qrData);
        if (isValid) {
          setScanSuccess(true);
          onScanSuccess(qrData);
        } else {
          setScanError('QR code validation failed');
          onScanError?.('Invalid QR code data');
        }
      } else {
        setScanError('Invalid QR code format');
        onScanError?.('Invalid QR code format');
      }
    } catch (error: any) {
      console.error('Error scanning file:', error);
      setScanError('Failed to scan QR code from file');
      onScanError?.('Failed to scan file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBatchId.trim()) return;

    try {
      const qrData: QRCodeData = {
        batchId: manualBatchId.trim(),
        batchNumber: manualBatchId.trim(),
        contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'base-sepolia',
        phase: 'unknown',
        timestamp: Date.now(),
        verificationUrl: `${window.location.origin}/verify/${manualBatchId.trim()}`
      };

      setScanSuccess(true);
      onScanSuccess(qrData);
      setManualBatchId('');
      setShowManualInput(false);
    } catch (error) {
      setScanError('Invalid batch ID format');
      onScanError?.('Invalid batch ID');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Camera className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-800">Scan QR Code</h2>
      </div>

      {!isScanning && !showManualInput ? (
        <div className="text-center py-8">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Scan a batch QR code to view its details
          </p>

          <div className="space-y-3">
            <button
              onClick={startScanning}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              Start Camera Scanning
            </button>

            {showFileUpload && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-file-input"
                />
                <label
                  htmlFor="qr-file-input"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto cursor-pointer inline-flex"
                >
                  <Upload className="w-5 h-5" />
                  Upload QR Code Image
                </label>
                <div id="qr-file-reader" className="hidden"></div>
              </div>
            )}

            {showManualEntry && (
              <button
                onClick={() => setShowManualInput(true)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Keyboard className="w-5 h-5" />
                Enter Batch ID Manually
              </button>
            )}
          </div>

          {hasPermission === false && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Camera Permission Required
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please allow camera access in your browser settings to scan QR codes.
                    You can still upload an image or enter the batch ID manually.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : showManualInput ? (
        <div className="py-8">
          <div className="text-center mb-6">
            <Keyboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Manual Batch ID Entry</h3>
            <p className="text-gray-600 text-sm">
              Enter the batch ID from your product label
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-2">
                Batch ID
              </label>
              <input
                type="text"
                id="batchId"
                value={manualBatchId}
                onChange={(e) => setManualBatchId(e.target.value)}
                placeholder="e.g., BATCH-001 or 12345"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualBatchId('');
                  setScanError(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!manualBatchId.trim()}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lookup Batch
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            id="qr-reader"
            className="border-2 border-emerald-500 rounded-lg overflow-hidden"
          />
          <button
            onClick={stopScanning}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <StopCircle className="w-5 h-5" />
            Stop Scanning
          </button>
        </div>
      )}

      {scanError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Scan Error</p>
              <p className="text-xs text-red-700 mt-1">{scanError}</p>
            </div>
          </div>
        </div>
      )}

      {scanSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">
                QR Code Scanned Successfully
              </p>
              <p className="text-xs text-green-700 mt-1">
                Redirecting to batch details...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
