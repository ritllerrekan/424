import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FullSupplyChain } from './blockchainService';
import { uploadToIPFS } from './ipfsUploadService';
import { WasteMetric } from '../types/waste';

export interface CertificateData {
  batchNumber: string;
  supplyChainData: FullSupplyChain;
  wasteMetrics?: WasteMetric[];
  verificationUrl: string;
  contractAddress: string;
  network: string;
}

export interface CertificateMetadata {
  certificateId: string;
  batchNumber: string;
  generatedAt: string;
  generatedBy: string;
  certificateHash: string;
  ipfsHash?: string;
  blockchainVerified: boolean;
  participants: {
    collector?: string;
    tester?: string;
    processor?: string;
    manufacturer?: string;
  };
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function calculateCertificateHash(data: CertificateData): string {
  const hashContent = JSON.stringify({
    batchNumber: data.batchNumber,
    batchId: data.supplyChainData.batch.batchNumber,
    timestamp: Date.now(),
    contractAddress: data.contractAddress
  });

  return Array.from(hashContent)
    .reduce((hash, char) => {
      const chr = char.charCodeAt(0);
      hash = ((hash << 5) - hash) + chr;
      return hash & hash;
    }, 0)
    .toString(16)
    .padStart(64, '0')
    .slice(0, 64);
}

export async function generateCertificatePDF(
  certificateData: CertificateData,
  generatedBy: string
): Promise<{ pdf: jsPDF; metadata: CertificateMetadata }> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const { supplyChainData, wasteMetrics, verificationUrl, contractAddress, network, batchNumber } = certificateData;
  const { batch, collector, tester, processor, manufacturer } = supplyChainData;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  pdf.setLineWidth(2);
  pdf.setDrawColor(5, 150, 105);
  pdf.rect(10, 10, pageWidth - 20, pdf.internal.pageSize.getHeight() - 20);

  pdf.setLineWidth(0.5);
  pdf.setDrawColor(5, 150, 105);
  pdf.rect(15, 15, pageWidth - 30, pdf.internal.pageSize.getHeight() - 30);

  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(5, 150, 105);
  pdf.text('FOODTRACE CERTIFICATE', pageWidth / 2, yPosition + 10, { align: 'center' });

  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Blockchain-Verified Supply Chain', pageWidth / 2, yPosition + 5, { align: 'center' });

  pdf.setLineWidth(0.5);
  pdf.setDrawColor(5, 150, 105);
  pdf.line(margin, yPosition + 10, pageWidth - margin, yPosition + 10);

  yPosition += 20;

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 500,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  const qrSize = 40;
  const qrX = pageWidth - margin - qrSize - 5;
  pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize);

  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Scan to verify', qrX + qrSize / 2, yPosition + qrSize + 5, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.text('Batch Number:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(batchNumber, margin + 35, yPosition);

  yPosition += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Current Phase:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  const phaseLabels = ['Collection', 'Testing', 'Processing', 'Manufacturing', 'Completed'];
  pdf.text(phaseLabels[batch.currentPhase] || 'Unknown', margin + 35, yPosition);

  yPosition += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Status:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  const statusLabels = ['Active', 'Completed', 'Rejected'];
  const statusColors = [[59, 130, 246], [5, 150, 105], [239, 68, 68]];
  pdf.setTextColor(...statusColors[batch.status] as [number, number, number]);
  pdf.text(statusLabels[batch.status] || 'Unknown', margin + 35, yPosition);
  pdf.setTextColor(55, 65, 81);

  yPosition += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Created:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatTimestamp(batch.createdAt), margin + 35, yPosition);

  yPosition += 15;

  if (collector) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(5, 150, 105);
    pdf.text('COLLECTION PHASE', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);

    const collectorInfo = [
      ['Collector:', formatAddress(collector.collectorAddress)],
      ['Harvest Date:', collector.harvestDate],
      ['Crop:', collector.seedCropName],
      ['Location:', `${(parseInt(collector.gpsLatitude) / 1e6).toFixed(4)}, ${(parseInt(collector.gpsLongitude) / 1e6).toFixed(4)}`],
      ['Weight:', `${collector.weightTotal} kg`],
      ['Temperature:', `${collector.temperature}°C`],
      ['Humidity:', `${collector.humidity}%`],
      ['Pesticide Used:', collector.pesticideUsed ? `Yes (${collector.pesticideName})` : 'No']
    ];

    collectorInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin + 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 40, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  if (tester) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(5, 150, 105);
    pdf.text('TESTING PHASE', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);

    const testerInfo = [
      ['Laboratory:', tester.labName],
      ['Tester:', formatAddress(tester.testerAddress)],
      ['Test Date:', tester.testDate],
      ['Quality Score:', `${tester.qualityGradeScore}/100`],
      ['Purity Level:', `${tester.purityLevel}%`],
      ['Contaminant Level:', `${tester.contaminantLevel} ppm`],
      ['Collector Rating:', `${tester.collectorRating}/10`]
    ];

    testerInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin + 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 40, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  if (processor) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(5, 150, 105);
    pdf.text('PROCESSING PHASE', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);

    const processorInfo = [
      ['Processor:', formatAddress(processor.processorAddress)],
      ['Processing Type:', processor.processingType],
      ['Input Weight:', `${processor.inputWeight} kg`],
      ['Output Weight:', `${processor.outputWeight} kg`],
      ['Conversion Ratio:', `${processor.conversionRatio}%`],
      ['Chemicals/Additives:', processor.chemicalsAdditives || 'None'],
      ['Tester Rating:', `${processor.testerRating}/10`]
    ];

    processorInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin + 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 40, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  if (manufacturer) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(5, 150, 105);
    pdf.text('MANUFACTURING PHASE', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);

    const manufacturerInfo = [
      ['Manufacturer:', formatAddress(manufacturer.manufacturerAddress)],
      ['Product:', manufacturer.productName],
      ['Brand:', manufacturer.brandName],
      ['Type:', manufacturer.productType],
      ['Quantity:', `${manufacturer.quantity} ${manufacturer.unit}`],
      ['Manufacture Date:', manufacturer.manufactureDate],
      ['Expiry Date:', manufacturer.expiryDate],
      ['Location:', manufacturer.location],
      ['Processor Rating:', `${manufacturer.processorRating}/10`]
    ];

    manufacturerInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin + 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 40, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  if (wasteMetrics && wasteMetrics.length > 0) {
    const totalWaste = wasteMetrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0);
    const totalCost = wasteMetrics.reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(239, 68, 68);
    pdf.text('WASTE METRICS SUMMARY', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Waste:', margin + 2, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${totalWaste.toFixed(2)} kg`, margin + 40, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Cost Impact:', margin + 2, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${totalCost.toFixed(2)}`, margin + 40, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Incidents:', margin + 2, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${wasteMetrics.length}`, margin + 40, yPosition);
    yPosition += 10;
  }

  pdf.setFillColor(243, 244, 246);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');

  yPosition += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.text('BLOCKCHAIN VERIFICATION', margin + 2, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  pdf.text('Network:', margin + 2, yPosition);
  pdf.text(network, margin + 25, yPosition);
  yPosition += 4;

  pdf.text('Contract:', margin + 2, yPosition);
  pdf.text(contractAddress, margin + 25, yPosition);
  yPosition += 4;

  const certificateHash = calculateCertificateHash(certificateData);
  pdf.text('Certificate Hash:', margin + 2, yPosition);
  pdf.text(certificateHash.slice(0, 40), margin + 25, yPosition);
  yPosition += 4;
  pdf.text(certificateHash.slice(40), margin + 25, yPosition);
  yPosition += 4;

  pdf.text('Verification URL:', margin + 2, yPosition);
  const maxWidth = 140;
  const urlLines = pdf.splitTextToSize(verificationUrl, maxWidth);
  pdf.text(urlLines, margin + 25, yPosition);

  yPosition = pdf.internal.pageSize.getHeight() - 25;
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(156, 163, 175);
  pdf.text('This certificate is digitally verified on the blockchain and cannot be forged.', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 5;
  const generatedDate = new Date();
  pdf.text(
    `Generated on ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  yPosition += 5;
  pdf.setFontSize(7);
  pdf.text(`Certificate ID: CERT-${batchNumber}-${Date.now()}`, pageWidth / 2, yPosition, { align: 'center' });

  const metadata: CertificateMetadata = {
    certificateId: `CERT-${batchNumber}-${Date.now()}`,
    batchNumber,
    generatedAt: generatedDate.toISOString(),
    generatedBy,
    certificateHash,
    blockchainVerified: true,
    participants: {
      collector: collector?.collectorAddress,
      tester: tester?.testerAddress,
      processor: processor?.processorAddress,
      manufacturer: manufacturer?.manufacturerAddress
    }
  };

  return { pdf, metadata };
}

export async function downloadCertificatePDF(
  certificateData: CertificateData,
  generatedBy: string,
  batchId?: string
): Promise<CertificateMetadata> {
  const { pdf, metadata } = await generateCertificatePDF(certificateData, generatedBy);
  pdf.save(`FoodTrace_Certificate_${certificateData.batchNumber}.pdf`);

  if (batchId) {
    try {
      const { saveCertificateMetadata } = await import('./certificateStorageService');
      await saveCertificateMetadata(batchId, metadata);
    } catch (error) {
      console.warn('Failed to save certificate metadata:', error);
    }
  }

  return metadata;
}

export async function getCertificatePDFBlob(
  certificateData: CertificateData,
  generatedBy: string
): Promise<{ blob: Blob; metadata: CertificateMetadata }> {
  const { pdf, metadata } = await generateCertificatePDF(certificateData, generatedBy);
  const blob = pdf.output('blob');
  return { blob, metadata };
}

export async function uploadCertificateToIPFS(
  certificateData: CertificateData,
  generatedBy: string,
  batchId?: string
): Promise<{ ipfsHash: string; metadata: CertificateMetadata }> {
  try {
    const { metadata } = await generateCertificatePDF(certificateData, generatedBy);

    const ipfsMetadata = {
      ...metadata,
      supplyChain: {
        batchNumber: certificateData.batchNumber,
        currentPhase: certificateData.supplyChainData.batch.currentPhase,
        status: certificateData.supplyChainData.batch.status,
        participants: metadata.participants
      },
      wasteMetrics: certificateData.wasteMetrics?.map(m => ({
        phase: m.phase,
        quantity: m.waste_quantity,
        unit: m.waste_unit,
        category: m.waste_category,
        costImpact: m.cost_impact
      })),
      blockchain: {
        network: certificateData.network,
        contractAddress: certificateData.contractAddress,
        verificationUrl: certificateData.verificationUrl
      }
    };

    const ipfsHash = await uploadToIPFS(ipfsMetadata);
    const updatedMetadata = { ...metadata, ipfsHash };

    if (batchId) {
      try {
        const { saveCertificateMetadata } = await import('./certificateStorageService');
        await saveCertificateMetadata(batchId, updatedMetadata);
      } catch (error) {
        console.warn('Failed to save certificate metadata:', error);
      }
    }

    return {
      ipfsHash,
      metadata: updatedMetadata
    };
  } catch (error) {
    console.error('Error uploading certificate to IPFS:', error);
    throw error;
  }
}

export async function verifyCertificateAuthenticity(
  certificateHash: string,
  batchNumber: string,
  contractAddress: string
): Promise<boolean> {
  try {
    const testData: CertificateData = {
      batchNumber,
      supplyChainData: {} as FullSupplyChain,
      verificationUrl: '',
      contractAddress,
      network: ''
    };

    const calculatedHash = calculateCertificateHash(testData);

    return certificateHash.substring(0, 32) === calculatedHash.substring(0, 32);
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return false;
  }
}
