import QRCode from 'qrcode';
import { uploadToIPFS } from '../utils/ipfsWaste';

const BLOCKCHAIN_NETWORK = 'base-sepolia';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export interface QRCodeData {
  batchId: string;
  batchNumber: string;
  contractAddress: string;
  network: string;
  phase: string;
  timestamp: number;
  ipfsHash?: string;
  verificationUrl: string;
}

export interface GeneratedQRCode {
  dataUrl: string;
  base64: string;
  ipfsHash?: string;
  qrData: QRCodeData;
}

export async function generateBatchQRCode(
  batchId: string,
  batchNumber: string,
  phase: string,
  contractAddress: string,
  ipfsMetadataHash?: string
): Promise<GeneratedQRCode> {
  const qrData: QRCodeData = {
    batchId,
    batchNumber,
    contractAddress,
    network: BLOCKCHAIN_NETWORK,
    phase,
    timestamp: Date.now(),
    ipfsHash: ipfsMetadataHash,
    verificationUrl: `${window.location.origin}/verify/${batchId}`
  };

  const qrDataString = JSON.stringify(qrData);

  const dataUrl = await QRCode.toDataURL(qrDataString, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });

  const base64 = dataUrl.split(',')[1];

  return {
    dataUrl,
    base64,
    qrData
  };
}

export async function generateHighResQRCode(
  batchId: string,
  batchNumber: string,
  phase: string,
  contractAddress: string,
  ipfsMetadataHash?: string,
  size: number = 2048
): Promise<GeneratedQRCode> {
  const qrData: QRCodeData = {
    batchId,
    batchNumber,
    contractAddress,
    network: BLOCKCHAIN_NETWORK,
    phase,
    timestamp: Date.now(),
    ipfsHash: ipfsMetadataHash,
    verificationUrl: `${window.location.origin}/verify/${batchId}`
  };

  const qrDataString = JSON.stringify(qrData);

  const dataUrl = await QRCode.toDataURL(qrDataString, {
    width: size,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });

  const base64 = dataUrl.split(',')[1];

  return {
    dataUrl,
    base64,
    qrData
  };
}

export async function uploadQRCodeToIPFS(qrCode: GeneratedQRCode): Promise<string> {
  try {
    const buffer = Buffer.from(qrCode.base64, 'base64');

    const file = new File([buffer], `qr-${qrCode.qrData.batchId}.png`, {
      type: 'image/png'
    });

    const ipfsHash = await uploadToIPFS(file);

    return ipfsHash;
  } catch (error) {
    console.error('Error uploading QR code to IPFS:', error);
    throw error;
  }
}

export function getQRCodeIPFSUrl(ipfsHash: string): string {
  return `${IPFS_GATEWAY}${ipfsHash}`;
}

export async function generateQRCodeWithIPFS(
  batchId: string,
  batchNumber: string,
  phase: string,
  contractAddress: string,
  ipfsMetadataHash?: string
): Promise<GeneratedQRCode> {
  const qrCode = await generateHighResQRCode(
    batchId,
    batchNumber,
    phase,
    contractAddress,
    ipfsMetadataHash
  );

  try {
    const ipfsHash = await uploadQRCodeToIPFS(qrCode);
    qrCode.ipfsHash = ipfsHash;
  } catch (error) {
    console.error('Failed to upload QR code to IPFS:', error);
  }

  return qrCode;
}

export function decodeQRData(qrDataString: string): QRCodeData | null {
  try {
    const parsed = JSON.parse(qrDataString);

    if (!parsed.batchId || !parsed.batchNumber || !parsed.contractAddress) {
      console.error('Missing required QR data fields');
      return null;
    }

    return parsed as QRCodeData;
  } catch (error) {
    console.error('Error decoding QR data:', error);
    return null;
  }
}

export async function validateQRCode(qrData: QRCodeData): Promise<boolean> {
  try {
    if (!qrData.batchId || !qrData.contractAddress || !qrData.network) {
      return false;
    }

    const expectedNetwork = BLOCKCHAIN_NETWORK;
    if (qrData.network !== expectedNetwork) {
      console.warn('QR code network mismatch:', qrData.network, 'vs', expectedNetwork);
    }

    const timeDifference = Date.now() - qrData.timestamp;
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (timeDifference > oneYear || timeDifference < -oneYear) {
      console.warn('QR code timestamp is suspicious:', new Date(qrData.timestamp));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating QR code:', error);
    return false;
  }
}

export function extractBatchIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const verifyIndex = pathParts.indexOf('verify');

    if (verifyIndex !== -1 && pathParts.length > verifyIndex + 1) {
      return pathParts[verifyIndex + 1];
    }

    return null;
  } catch (error) {
    console.error('Error extracting batch ID from URL:', error);
    return null;
  }
}

export async function generateQRDataUrl(data: QRCodeData): Promise<string> {
  const qrDataString = JSON.stringify(data);

  return await QRCode.toDataURL(qrDataString, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });
}

export async function generatePrintableLabel(
  batchId: string,
  batchNumber: string,
  phase: string,
  contractAddress: string,
  additionalInfo?: {
    productName?: string;
    organization?: string;
    date?: string;
  }
): Promise<string> {
  const qrCode = await generateHighResQRCode(
    batchId,
    batchNumber,
    phase,
    contractAddress,
    undefined,
    1024
  );

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  const qrImage = new Image();
  qrImage.src = qrCode.dataUrl;

  await new Promise((resolve) => {
    qrImage.onload = resolve;
  });

  const qrSize = 500;
  const qrX = 80;
  const qrY = 150;
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('FoodTrace Supply Chain', 80, 100);

  const infoX = qrX + qrSize + 60;
  let infoY = 200;
  const lineHeight = 60;

  ctx.font = 'bold 32px Arial';
  ctx.fillText('Batch Information', infoX, infoY);
  infoY += lineHeight;

  ctx.font = '28px Arial';
  ctx.fillText(`Batch #: ${batchNumber}`, infoX, infoY);
  infoY += lineHeight;

  ctx.fillText(`Phase: ${phase.toUpperCase()}`, infoX, infoY);
  infoY += lineHeight;

  if (additionalInfo?.productName) {
    ctx.fillText(`Product: ${additionalInfo.productName}`, infoX, infoY);
    infoY += lineHeight;
  }

  if (additionalInfo?.organization) {
    ctx.fillText(`Org: ${additionalInfo.organization}`, infoX, infoY);
    infoY += lineHeight;
  }

  if (additionalInfo?.date) {
    ctx.fillText(`Date: ${additionalInfo.date}`, infoX, infoY);
    infoY += lineHeight;
  }

  ctx.font = '20px monospace';
  const shortAddress = `${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}`;
  ctx.fillText(`Contract: ${shortAddress}`, infoX, infoY);
  infoY += 50;

  ctx.font = '18px Arial';
  ctx.fillText(`Network: ${BLOCKCHAIN_NETWORK}`, infoX, infoY);

  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Scan QR code to verify on blockchain', canvas.width / 2, canvas.height - 80);

  return canvas.toDataURL('image/png');
}

export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printQRLabel(dataUrl: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print QR Label</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <img src="${dataUrl}" alt="QR Code Label" onload="window.print(); window.close();" />
    </body>
    </html>
  `);
  printWindow.document.close();
}
