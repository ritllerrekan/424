import { useState, useEffect } from 'react';
import { Scale, Thermometer, MapPin, FileText, Upload, Trash2, TrendingDown } from 'lucide-react';
import { GlassCard, GlassButton } from './glass';
import { getTesterBatches } from '../services/processorBatchService';

export interface ProcessorBatchFormData {
  processorId: string;
  testerBatchId: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  weatherCondition: string;
  temperature: number | null;
  processingDate: string;
  processingType: string;
  inputWeight: number;
  outputWeight: number;
  chemicalsAdditivesUsed: string;
  testerRating: number;
  testerRatingNotes: string;
  documents?: { file: File; type: string }[];
}

interface ProcessorBatchFormProps {
  onSubmit: (data: ProcessorBatchFormData) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

const processingTypes = [
  'Washing',
  'Sorting',
  'Cutting',
  'Blanching',
  'Drying',
  'Freezing',
  'Peeling',
  'Grinding',
  'Pressing',
  'Other'
];

export function ProcessorBatchForm({ onSubmit, onCancel, userId }: ProcessorBatchFormProps) {
  const [formData, setFormData] = useState<ProcessorBatchFormData>({
    processorId: userId,
    testerBatchId: '',
    gpsLatitude: null,
    gpsLongitude: null,
    weatherCondition: '',
    temperature: null,
    processingDate: new Date().toISOString().split('T')[0],
    processingType: '',
    inputWeight: 0,
    outputWeight: 0,
    chemicalsAdditivesUsed: '',
    testerRating: 5,
    testerRatingNotes: '',
    documents: []
  });

  const [wasteAmount, setWasteAmount] = useState<number>(0);
  const [testerBatches, setTesterBatches] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTesterBatches();
  }, []);

  const loadTesterBatches = async () => {
    try {
      const batches = await getTesterBatches();
      setTesterBatches(batches);
    } catch (error) {
      console.error('Error loading tester batches:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newDocuments = files.map(file => ({
        file,
        type: 'processing_report'
      }));
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocuments]
      }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index)
    }));
  };

  const conversionRatio = formData.inputWeight > 0
    ? ((formData.outputWeight / formData.inputWeight) * 100).toFixed(2)
    : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.testerBatchId) {
      alert('Please select a tester batch');
      return;
    }

    if (!formData.processingType) {
      alert('Please select a processing type');
      return;
    }

    if (formData.inputWeight <= 0 || formData.outputWeight <= 0) {
      alert('Input and output weights must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to create processor batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <GlassCard>
        <h2 className="text-2xl font-bold text-white mb-6">Create Processing Batch</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Select Tester Batch
            </label>
            <select
              value={formData.testerBatchId}
              onChange={(e) => setFormData(prev => ({ ...prev, testerBatchId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-400"
              required
            >
              <option value="">Select a batch...</option>
              {testerBatches.map(batch => (
                <option key={batch.id} value={batch.id} className="bg-slate-800">
                  {batch.batch_number || batch.id.slice(0, 8)} - {batch.crop_variety || 'Unknown Variety'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Processing Type
            </label>
            <select
              value={formData.processingType}
              onChange={(e) => setFormData(prev => ({ ...prev, processingType: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-400"
              required
            >
              <option value="">Select processing type...</option>
              {processingTypes.map(type => (
                <option key={type} value={type} className="bg-slate-800">
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Input Weight (kg)
              </label>
              <input
                type="number"
                value={formData.inputWeight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, inputWeight: parseFloat(e.target.value) || 0 }))}
                step="0.01"
                min="0"
                required
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Output Weight (kg)
              </label>
              <input
                type="number"
                value={formData.outputWeight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, outputWeight: parseFloat(e.target.value) || 0 }))}
                step="0.01"
                min="0"
                required
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Conversion Ratio:</span>
              <span className="text-2xl font-bold text-emerald-400">{conversionRatio}%</span>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Output weight as percentage of input weight
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Waste Amount (kg) - Optional
            </label>
            <input
              type="number"
              value={wasteAmount || ''}
              onChange={(e) => setWasteAmount(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              placeholder="Enter waste amount if any"
              className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Processing Date
            </label>
            <input
              type="date"
              value={formData.processingDate}
              onChange={(e) => setFormData(prev => ({ ...prev, processingDate: e.target.value }))}
              required
              className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                GPS Latitude
              </label>
              <input
                type="number"
                value={formData.gpsLatitude || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, gpsLatitude: parseFloat(e.target.value) || null }))}
                step="0.000001"
                placeholder="e.g., 40.7128"
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                GPS Longitude
              </label>
              <input
                type="number"
                value={formData.gpsLongitude || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, gpsLongitude: parseFloat(e.target.value) || null }))}
                step="0.000001"
                placeholder="e.g., -74.0060"
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Weather Condition
              </label>
              <input
                type="text"
                value={formData.weatherCondition}
                onChange={(e) => setFormData(prev => ({ ...prev, weatherCondition: e.target.value }))}
                placeholder="e.g., Sunny, Cloudy"
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperature (°C)
              </label>
              <input
                type="number"
                value={formData.temperature || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) || null }))}
                step="0.1"
                placeholder="e.g., 25"
                className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 hover:bg-white/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Chemicals/Additives Used
            </label>
            <textarea
              value={formData.chemicalsAdditivesUsed}
              onChange={(e) => setFormData(prev => ({ ...prev, chemicalsAdditivesUsed: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-400 min-h-[100px]"
              placeholder="List all chemicals and additives used..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Quality Rating (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, testerRating: rating }))}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    formData.testerRating === rating
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Rating Notes
            </label>
            <textarea
              value={formData.testerRatingNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, testerRatingNotes: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-400 min-h-[100px]"
              placeholder="Additional notes about quality..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Processing Documentation
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                <Upload className="w-5 h-5 text-white/60" />
                <span className="text-white/80">Upload Documents</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>

              {formData.documents && formData.documents.length > 0 && (
                <div className="space-y-2">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-white/80">{doc.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <GlassButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Creating...' : 'Create Processing Batch'}
          </GlassButton>
          <GlassButton
            type="button"
            onClick={onCancel}
            variant="secondary"
          >
            Cancel
          </GlassButton>
        </div>
      </GlassCard>
    </form>
  );
}
