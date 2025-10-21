import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, StopCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { decodeQRData, QRCodeData } from '../services/qrCodeService';

interface QRCodeScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
  onScanError?: (error: string) => void;
}

export function QRCodeScanner({ onScanSuccess, onScanError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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
        (decodedText) => {
          const qrData = decodeQRData(decodedText);
          if (qrData) {
            setScanSuccess(true);
            onScanSuccess(qrData);
            stopScanning();
          } else {
            setScanError('Invalid QR code format');
            onScanError?.('Invalid QR code format');
          }
        },
        (errorMessage) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Camera className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-800">Scan QR Code</h2>
      </div>

      {!isScanning ? (
        <div className="text-center py-8">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Scan a batch QR code to view its details
          </p>
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Camera className="w-5 h-5" />
            Start Scanning
          </button>
          {hasPermission === false && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Camera Permission Required
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please allow camera access in your browser settings to scan QR codes.
                  </p>
                </div>
              </div>
            </div>
          )}
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
