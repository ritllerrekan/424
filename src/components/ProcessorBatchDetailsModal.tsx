import { useState, useEffect } from 'react';
import { X, MapPin, Thermometer, Scale, TrendingUp, FileText, Download, Star } from 'lucide-react';
import { GlassCard, GlassButton } from './glass';
import { ProcessorBatch, ProcessorDocument, getProcessorDocuments } from '../services/processorBatchService';

interface ProcessorBatchDetailsModalProps {
  batch: ProcessorBatch;
  onClose: () => void;
}

export function ProcessorBatchDetailsModal({ batch, onClose }: ProcessorBatchDetailsModalProps) {
  const [documents, setDocuments] = useState<ProcessorDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [batch.id]);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await getProcessorDocuments(batch.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Processing Batch Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-white/60">Processing Type</span>
                </div>
                <p className="text-xl font-semibold text-white">{batch.processing_type}</p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-white/60">Conversion Ratio</span>
                </div>
                <p className="text-xl font-semibold text-blue-400">
                  {batch.conversion_ratio.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Input Weight</div>
                <div className="text-lg font-semibold text-white">{batch.input_weight} kg</div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Output Weight</div>
                <div className="text-lg font-semibold text-white">{batch.output_weight} kg</div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Waste Amount</div>
                <div className="text-lg font-semibold text-red-400">
                  {(batch.input_weight - batch.output_weight).toFixed(2)} kg
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-400/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-white/60">Quality Rating</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-amber-400">{batch.tester_rating}/5</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < batch.tester_rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {batch.tester_rating_notes && (
                <p className="text-sm text-white/80">{batch.tester_rating_notes}</p>
              )}
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-white/60 mb-2">Processing Date</div>
              <div className="text-white font-semibold">
                {new Date(batch.processing_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {(batch.gps_latitude || batch.gps_longitude) && (
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-white/60">GPS Coordinates</span>
                </div>
                <p className="text-white font-mono">
                  {batch.gps_latitude?.toFixed(6)}, {batch.gps_longitude?.toFixed(6)}
                </p>
              </div>
            )}

            {(batch.weather_condition || batch.temperature) && (
              <div className="grid md:grid-cols-2 gap-4">
                {batch.weather_condition && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm text-white/60 mb-1">Weather</div>
                    <div className="text-white">{batch.weather_condition}</div>
                  </div>
                )}
                {batch.temperature && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Thermometer className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/60">Temperature</span>
                    </div>
                    <div className="text-white">{batch.temperature}°C</div>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-white/60 mb-2">Chemicals/Additives Used</div>
              <p className="text-white whitespace-pre-wrap">{batch.chemicals_additives_used}</p>
            </div>

            {batch.qr_code_data && (
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-white/60 mb-2">Transaction Hash</div>
                <p className="text-white font-mono text-sm break-all">{batch.qr_code_data}</p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-white/60" />
                <h3 className="text-lg font-semibold text-white">Processing Documents</h3>
              </div>

              {isLoadingDocs ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-400 border-t-transparent"></div>
                  <p className="text-white/60 mt-2">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="text-white font-medium">{doc.file_name}</p>
                        <p className="text-xs text-white/60">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5 text-emerald-400" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-4">No documents uploaded</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <GlassButton onClick={onClose} variant="secondary" className="w-full">
              Close
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
