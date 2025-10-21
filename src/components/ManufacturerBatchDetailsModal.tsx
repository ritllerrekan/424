import { useState, useEffect } from 'react';
import { X, MapPin, Thermometer, Package, Calendar, Star, FileText, Download } from 'lucide-react';
import { ManufacturerBatch, getManufacturerDocuments, ManufacturerDocument } from '../services/manufacturerBatchService';
import { GlassModal, GlassButton } from './glass';
import QRCode from 'qrcode';

interface Props {
  batch: ManufacturerBatch;
  onClose: () => void;
}

export function ManufacturerBatchDetailsModal({ batch, onClose }: Props) {
  const [documents, setDocuments] = useState<ManufacturerDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    loadDocuments();
    generateQRCode();
  }, [batch.id]);

  const loadDocuments = async () => {
    try {
      const docs = await getManufacturerDocuments(batch.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        batchId: batch.id,
        productName: batch.product_name,
        brandName: batch.brand_name,
        manufactureDate: batch.manufacture_date,
        expiryDate: batch.expiry_date,
        quantity: batch.quantity,
        unit: batch.unit,
        location: batch.location
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `product-qr-${batch.product_name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <GlassModal onClose={onClose} title="Product Details">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{batch.product_name}</h3>
              <p className="text-white/70">{batch.brand_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Type:</span>
              <p className="text-white font-medium">{batch.product_type}</p>
            </div>
            <div>
              <span className="text-white/60">Status:</span>
              <p className="text-white font-medium capitalize">{batch.status}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-300" />
              <span className="text-white/80 font-medium">Product Info</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-white/60">Quantity:</span>
                <p className="text-white font-medium">{batch.quantity} {batch.unit}</p>
              </div>
              <div>
                <span className="text-white/60">Location:</span>
                <p className="text-white font-medium">{batch.location}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-emerald-300" />
              <span className="text-white/80 font-medium">Dates</span>
            </div>
            <div className="space-y-2 text-sm">
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
          </div>

          {batch.gps_latitude && batch.gps_longitude && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-amber-300" />
                <span className="text-white/80 font-medium">Location</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-white/60">GPS Coordinates:</span>
                  <p className="text-white font-mono text-xs">
                    {batch.gps_latitude.toFixed(6)}, {batch.gps_longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-5 h-5 text-red-300" />
              <span className="text-white/80 font-medium">Conditions</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-white/60">Weather:</span>
                <p className="text-white font-medium">{batch.weather_condition}</p>
              </div>
              {batch.temperature && (
                <div>
                  <span className="text-white/60">Temperature:</span>
                  <p className="text-white font-medium">{batch.temperature}°C</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-400/20">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            <span className="text-white/80 font-medium">Processor Rating</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= batch.processor_rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-white/30'
                }`}
              />
            ))}
            <span className="text-white/80 ml-2">
              {batch.processor_rating}/5
            </span>
          </div>
          {batch.processor_rating_notes && (
            <p className="text-white/70 text-sm mt-3 italic">
              "{batch.processor_rating_notes}"
            </p>
          )}
        </div>

        {qrCodeUrl && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
            <h4 className="text-white font-medium mb-4">Product QR Code</h4>
            <img
              src={qrCodeUrl}
              alt="Product QR Code"
              className="mx-auto mb-4 rounded-lg bg-white p-4"
              style={{ maxWidth: '300px' }}
            />
            <GlassButton onClick={downloadQRCode} size="sm">
              <Download className="w-4 h-4" />
              Download QR Code
            </GlassButton>
          </div>
        )}

        {documents.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-300" />
              <span className="text-white/80 font-medium">Documents</span>
            </div>
            <div className="space-y-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-white/60" />
                    <div>
                      <p className="text-white text-sm">{doc.file_name}</p>
                      <p className="text-white/40 text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <GlassButton onClick={onClose} variant="secondary">
            <X className="w-4 h-4" />
            Close
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
