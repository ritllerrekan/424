import { useState, useEffect } from 'react';
import { Package, Upload, Star } from 'lucide-react';
import { getProcessorBatches } from '../services/manufacturerBatchService';
import { GlassCard, GlassButton, GlassInput } from './glass';

export interface ManufacturerBatchFormData {
  manufacturerId: string;
  processorBatchId: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  weatherCondition: string;
  temperature: number | null;
  productName: string;
  brandName: string;
  productType: string;
  quantity: number;
  unit: string;
  location: string;
  manufactureDate: string;
  expiryDate: string;
  processorRating: number;
  processorRatingNotes: string;
  documents?: { file: File; type: string }[];
}

interface Props {
  onSubmit: (data: ManufacturerBatchFormData) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

export function ManufacturerBatchForm({ onSubmit, onCancel, userId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processorBatches, setProcessorBatches] = useState<any[]>([]);
  const [documents, setDocuments] = useState<{ file: File; type: string }[]>([]);
  const [rating, setRating] = useState<number>(5);

  const [formData, setFormData] = useState<ManufacturerBatchFormData>({
    manufacturerId: userId,
    processorBatchId: '',
    gpsLatitude: null,
    gpsLongitude: null,
    weatherCondition: 'Clear',
    temperature: null,
    productName: '',
    brandName: '',
    productType: 'Fertilizer',
    quantity: 0,
    unit: 'kg',
    location: '',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    processorRating: 5,
    processorRatingNotes: '',
    documents: []
  });

  useEffect(() => {
    loadProcessorBatches();
    captureLocation();
  }, []);

  const loadProcessorBatches = async () => {
    try {
      const batches = await getProcessorBatches();
      setProcessorBatches(batches);
    } catch (error) {
      console.error('Error loading processor batches:', error);
    }
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gpsLatitude: position.coords.latitude,
            gpsLongitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        type: file.type.startsWith('image/') ? 'image' : 'document'
      }));
      setDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.processorBatchId) {
      alert('Please select a processor batch');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        processorRating: rating,
        documents
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to create manufacturer batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Package className="w-6 h-6 text-blue-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Create Manufactured Product</h2>
          <p className="text-white/60 text-sm">Record your manufactured product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Processor Batch *
            </label>
            <select
              value={formData.processorBatchId}
              onChange={(e) => setFormData({ ...formData, processorBatchId: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              required
            >
              <option value="">Select processor batch</option>
              {processorBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.processing_type} - {new Date(batch.processing_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Product Name *
            </label>
            <GlassInput
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Premium Organic Fertilizer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Brand Name *
            </label>
            <GlassInput
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="e.g., EcoGrow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Product Type *
            </label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              required
            >
              <option value="Fertilizer">Fertilizer</option>
              <option value="Animal Feed">Animal Feed</option>
              <option value="Compost">Compost</option>
              <option value="Biogas">Biogas</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Quantity *
            </label>
            <GlassInput
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              required
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="liters">Liters</option>
              <option value="pieces">Pieces</option>
              <option value="tons">Tons</option>
              <option value="m3">Cubic Meters (m³)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Location *
            </label>
            <GlassInput
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Manufacturing facility location"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Weather Condition
            </label>
            <select
              value={formData.weatherCondition}
              onChange={(e) => setFormData({ ...formData, weatherCondition: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
            >
              <option value="Clear">Clear</option>
              <option value="Cloudy">Cloudy</option>
              <option value="Rainy">Rainy</option>
              <option value="Stormy">Stormy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Temperature (°C)
            </label>
            <GlassInput
              type="number"
              value={formData.temperature || ''}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value ? parseFloat(e.target.value) : null })}
              step="0.1"
              placeholder="e.g., 25.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Manufacture Date *
            </label>
            <GlassInput
              type="date"
              value={formData.manufactureDate}
              onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Expiry Date *
            </label>
            <GlassInput
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              min={formData.manufactureDate}
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">
            Rate Previous Processor *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-all hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-white/30'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Rating Notes
          </label>
          <textarea
            value={formData.processorRatingNotes}
            onChange={(e) => setFormData({ ...formData, processorRatingNotes: e.target.value })}
            placeholder="Add notes about your experience with the processor..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">
            Upload Documents
          </label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-all">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="document-upload"
              accept="image/*,.pdf,.doc,.docx"
            />
            <label
              htmlFor="document-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-white/60" />
              <span className="text-white/60">Click to upload documents</span>
              <span className="text-xs text-white/40">Images, PDF, or Word documents</span>
            </label>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                >
                  <span className="text-white text-sm">{doc.file.name}</span>
                  <GlassButton
                    type="button"
                    onClick={() => removeDocument(index)}
                    variant="secondary"
                    size="sm"
                  >
                    Remove
                  </GlassButton>
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.gpsLatitude && formData.gpsLongitude && (
          <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-4">
            <p className="text-emerald-300 text-sm">
              Location captured: {formData.gpsLatitude.toFixed(6)}, {formData.gpsLongitude.toFixed(6)}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <GlassButton
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </GlassButton>
          <GlassButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
