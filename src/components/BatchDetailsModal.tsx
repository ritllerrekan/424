import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Thermometer, Cloud, Package, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { GlassModal, GlassButton } from './glass';
import { CollectorBatch, BatchDocument, getBatchDocuments } from '../services/collectorBatchService';

interface BatchDetailsModalProps {
  batch: CollectorBatch;
  onClose: () => void;
}

export function BatchDetailsModal({ batch, onClose }: BatchDetailsModalProps) {
  const [documents, setDocuments] = useState<BatchDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [batch.id]);

  const loadDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const docs = await getBatchDocuments(batch.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  return (
    <GlassModal onClose={onClose}>
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900/95 backdrop-blur-xl p-6 -m-6 mb-0 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Batch Details</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Package className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{batch.batch_number}</h3>
                <p className="text-white/60">{batch.seed_crop_name}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-white/60 mb-1">Status</div>
                <div className="text-white font-medium capitalize">{batch.status}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Created</div>
                <div className="text-white font-medium">
                  {new Date(batch.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Harvest Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm text-white/60">Harvest Date</div>
                  <div className="text-white">
                    {new Date(batch.harvest_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {batch.gps_latitude && batch.gps_longitude && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm text-white/60">GPS Location</div>
                    <div className="text-white text-sm">
                      {batch.gps_latitude.toFixed(6)}, {batch.gps_longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              )}

              {batch.weather_condition && (
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-sm text-white/60">Weather</div>
                    <div className="text-white">{batch.weather_condition}</div>
                  </div>
                </div>
              )}

              {batch.temperature && (
                <div className="flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-sm text-white/60">Temperature</div>
                    <div className="text-white">{batch.temperature}°C</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {batch.pesticide_used && (
            <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-400/30">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h4 className="text-lg font-semibold text-white">Pesticide Information</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {batch.pesticide_name && (
                  <div>
                    <div className="text-sm text-white/60 mb-1">Pesticide Name</div>
                    <div className="text-white">{batch.pesticide_name}</div>
                  </div>
                )}
                {batch.pesticide_quantity && (
                  <div>
                    <div className="text-sm text-white/60 mb-1">Quantity Used</div>
                    <div className="text-white">{batch.pesticide_quantity}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Pricing & Weight</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm text-white/60">Price Per Unit</div>
                  <div className="text-white font-medium">${batch.price_per_unit}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm text-white/60">Total Weight</div>
                  <div className="text-white font-medium">{batch.weight_total} kg</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm text-white/60">Total Price</div>
                  <div className="text-white font-medium">${batch.total_price}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Documents & Photos</h4>

            {isLoadingDocs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
                <p className="text-white/60 text-sm">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-white/30 mx-auto mb-2" />
                <p className="text-white/60">No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`https://gateway.pinata.cloud/ipfs/${doc.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{doc.file_name}</div>
                      <div className="text-white/40 text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-emerald-400 text-sm">View</div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <GlassButton onClick={onClose} variant="secondary">
              Close
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
