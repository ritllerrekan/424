import { Download, Share2 } from 'lucide-react';
import { GeneratedQRCode } from '../services/qrCodeService';

interface BatchCertificateProps {
  batchNumber: string;
  phase: string;
  qrCode: GeneratedQRCode;
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
  phase,
  qrCode,
  batchDetails
}: BatchCertificateProps) {
  const generateCertificatePDF = async () => {
    const certificateElement = document.getElementById('certificate-content');
    if (!certificateElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download certificate');
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background: white;
        }
        .certificate {
          max-width: 800px;
          margin: 0 auto;
          border: 8px double #059669;
          padding: 40px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #059669;
          padding-bottom: 20px;
        }
        .title {
          font-size: 36px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          color: #6b7280;
        }
        .content {
          display: grid;
          grid-template-columns: 1fr 250px;
          gap: 30px;
          margin: 30px 0;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .info-value {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 15px;
        }
        .qr-section {
          text-align: center;
        }
        .qr-section img {
          width: 200px;
          height: 200px;
          border: 2px solid #e5e7eb;
          padding: 10px;
        }
        .qr-label {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .blockchain-info {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .blockchain-label {
          font-weight: bold;
          font-size: 12px;
          color: #374151;
        }
        .blockchain-value {
          font-family: monospace;
          font-size: 11px;
          color: #6b7280;
          word-break: break-all;
        }
        @media print {
          body { padding: 0; }
          @page { margin: 20mm; }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch Certificate - ${batchNumber}</title>
        ${styles}
      </head>
      <body>
        ${certificateElement.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
            onClick={generateCertificatePDF}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

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
        </div>

        <div className="footer">
          <p>This certificate is digitally verified on the blockchain</p>
          <p style={{ marginTop: '5px' }}>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
