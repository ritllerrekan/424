import { useState, useEffect } from 'react';
import { Package, Eye, Trash2, QrCode, Download } from 'lucide-react';
import { getManufacturerBatches, deleteManufacturerBatch, ManufacturerBatch } from '../services/manufacturerBatchService';
import { GlassCard, GlassButton } from './glass';
import QRCode from 'qrcode';

interface Props {
  userId: string;
  onViewDetails: (batch: ManufacturerBatch) => void;
}

export function ManufacturerBatchList({ userId, onViewDetails }: Props) {
  const [batches, setBatches] = useState<ManufacturerBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, [userId]);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await getManufacturerBatches(userId);
      setBatches(data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this manufactured product?')) {
      return;
    }

    setDeletingId(batchId);
    try {
      await deleteManufacturerBatch(batchId);
      await loadBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Failed to delete batch. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateQR = async (batch: ManufacturerBatch) => {
    setGeneratingQR(batch.id);
    try {
      const qrData = JSON.stringify({
        batchId: batch.id,
        productName: batch.product_name,
        brandName: batch.brand_name,
        manufactureDate: batch.manufacture_date,
        expiryDate: batch.expiry_date,
        quantity: batch.quantity,
        unit: batch.unit
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `product-qr-${batch.product_name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setGeneratingQR(null);
    }
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/60 mt-4">Loading manufactured products...</p>
        </div>
      </GlassCard>
    );
  }

  if (batches.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Products Yet</h3>
          <p className="text-white/60">
            You haven't manufactured any products yet. Create your first product to get started.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <GlassCard key={batch.id} className="animate-fade-in hover:scale-[1.01] transition-transform">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{batch.product_name}</h3>
                  <p className="text-sm text-white/60">{batch.brand_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-white/60">Type:</span>
                  <p className="text-white font-medium">{batch.product_type}</p>
                </div>
                <div>
                  <span className="text-white/60">Quantity:</span>
                  <p className="text-white font-medium">{batch.quantity} {batch.unit}</p>
                </div>
                <div>
                  <span className="text-white/60">Manufactured:</span>
                  <p className="text-white font-medium">
                    {new Date(batch.manufacture_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Expires:</span>
                  <p className="text-white font-medium">
                    {new Date(batch.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium">
                  {batch.status}
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                  {batch.location}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <GlassButton
                onClick={() => onViewDetails(batch)}
                variant="accent"
                size="sm"
              >
                <Eye className="w-4 h-4" />
                View
              </GlassButton>
              <GlassButton
                onClick={() => handleGenerateQR(batch)}
                variant="secondary"
                size="sm"
                disabled={generatingQR === batch.id}
              >
                {generatingQR === batch.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </>
                )}
              </GlassButton>
              <GlassButton
                onClick={() => handleDelete(batch.id)}
                variant="secondary"
                size="sm"
                disabled={deletingId === batch.id}
              >
                {deletingId === batch.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
