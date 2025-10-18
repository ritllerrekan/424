import { useState, useEffect } from 'react';
import { Camera, MapPin, Cloud, Package, Droplet, Star, Upload, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useLocationCapture } from '../../hooks/useLocationCapture';

interface TesterBatch {
  id: string;
  collector_batch_id: string;
  quality_grade_score: number;
  lab_name: string;
  created_at: string;
}

export default function ProcessorDashboard() {
  const { user } = useAuth();
  const { location, weather } = useLocationCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testerBatches, setTesterBatches] = useState<TesterBatch[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const [formData, setFormData] = useState({
    testerBatchId: '',
    processingType: '',
    inputWeight: '',
    outputWeight: '',
    conversionRatio: '',
    chemicalsAdditives: '',
    testerRating: 5,
    testerRatingNotes: '',
  });

  useEffect(() => {
    fetchTesterBatches();
  }, []);

  useEffect(() => {
    if (formData.inputWeight && formData.outputWeight) {
      const input = parseFloat(formData.inputWeight);
      const output = parseFloat(formData.outputWeight);
      if (input > 0) {
        const ratio = ((output / input) * 100).toFixed(2);
        setFormData(prev => ({ ...prev, conversionRatio: ratio }));
      }
    }
  }, [formData.inputWeight, formData.outputWeight]);

  const fetchTesterBatches = async () => {
    const { data, error } = await supabase
      .from('tester_batches')
      .select('id, collector_batch_id, quality_grade_score, lab_name, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTesterBatches(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const qrData = `PROC-${Date.now()}-${formData.testerBatchId}`;

      const { data: processorBatch, error: batchError } = await supabase
        .from('processor_batches')
        .insert({
          tester_batch_id: formData.testerBatchId,
          processor_id: user.id,
          gps_latitude: parseFloat(location.latitude),
          gps_longitude: parseFloat(location.longitude),
          weather_condition: weather.condition,
          temperature: parseFloat(weather.temperature),
          processing_type: formData.processingType,
          input_weight: parseFloat(formData.inputWeight),
          output_weight: parseFloat(formData.outputWeight),
          conversion_ratio: parseFloat(formData.conversionRatio),
          chemicals_additives_used: formData.chemicalsAdditives,
          tester_rating: formData.testerRating,
          tester_rating_notes: formData.testerRatingNotes || null,
          qr_code_data: qrData,
          status: 'completed',
        })
        .select()
        .single();

      if (batchError) throw batchError;

      if (selectedFiles && processorBatch) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileName = `${processorBatch.id}/${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('processor-documents')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('processor-documents')
              .getPublicUrl(fileName);

            await supabase.from('processor_documents').insert({
              processor_batch_id: processorBatch.id,
              file_name: file.name,
              file_url: urlData.publicUrl,
              file_type: file.type,
            });
          }
        }
      }

      alert('Processing batch submitted successfully!\n\nQR Code: ' + qrData);

      setFormData({
        testerBatchId: '',
        processingType: '',
        inputWeight: '',
        outputWeight: '',
        conversionRatio: '',
        chemicalsAdditives: '',
        testerRating: 5,
        testerRatingNotes: '',
      });
      setSelectedFiles(null);
    } catch (error) {
      console.error('Error submitting batch:', error);
      alert('Error submitting batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchIdScan = async (batchId: string) => {
    const batch = testerBatches.find(b => b.id === batchId);
    if (batch) {
      setFormData(prev => ({ ...prev, testerBatchId: batchId }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Processor Dashboard</h2>
        <QrCode className="w-8 h-8 text-emerald-600" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tester Batch ID <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.testerBatchId}
                onChange={(e) => setFormData({ ...formData, testerBatchId: e.target.value })}
                onBlur={(e) => handleBatchIdScan(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter or scan batch ID"
              />
              <button
                type="button"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                title="Scan QR Code"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            {formData.testerBatchId && (
              <select
                value={formData.testerBatchId}
                onChange={(e) => setFormData({ ...formData, testerBatchId: e.target.value })}
                className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select from recent batches</option>
                {testerBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.lab_name} - Grade: {batch.quality_grade_score} (ID: {batch.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Processing Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.processingType}
              onChange={(e) => setFormData({ ...formData, processingType: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select processing type</option>
              <option value="Washing">Washing</option>
              <option value="Drying">Drying</option>
              <option value="Grinding">Grinding</option>
              <option value="Sorting">Sorting</option>
              <option value="Packaging">Packaging</option>
              <option value="Fermentation">Fermentation</option>
              <option value="Extraction">Extraction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Input Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.inputWeight}
              onChange={(e) => setFormData({ ...formData, inputWeight: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Output Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.outputWeight}
              onChange={(e) => setFormData({ ...formData, outputWeight: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Conversion Ratio / Loss (%)
            </label>
            <input
              type="text"
              value={formData.conversionRatio}
              readOnly
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              placeholder="Auto-calculated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Chemicals/Additives Used <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.chemicalsAdditives}
              onChange={(e) => setFormData({ ...formData, chemicalsAdditives: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="None / List chemicals used"
            />
          </div>

          <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location & Weather Conditions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-slate-600 mb-3">GPS Location (Auto-captured)</div>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-slate-500">Latitude</div>
                    <div className="text-sm font-semibold text-slate-800">{location.latitude || 'Capturing...'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-slate-500">Longitude</div>
                    <div className="text-sm font-semibold text-slate-800">{location.longitude || 'Capturing...'}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  Weather Conditions (Auto-captured)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Temperature</div>
                    <div className="text-xl font-bold text-slate-800">{weather.temperature ? `${weather.temperature}°C` : '--'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Humidity</div>
                    <div className="text-xl font-bold text-slate-800">{weather.humidity ? `${weather.humidity}%` : '--'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Conditions</div>
                    <div className="text-sm font-semibold text-slate-800">{weather.condition || '--'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Wind</div>
                    <div className="text-sm font-semibold text-slate-800">{weather.windSpeed ? `${weather.windSpeed} km/h` : '--'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Rate Previous Chain (Tester)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, testerRating: rating })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.testerRating >= rating
                        ? 'border-amber-500 bg-amber-50 text-amber-600'
                        : 'border-slate-300 bg-white text-slate-400 hover:border-amber-300'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${formData.testerRating >= rating ? 'fill-amber-500' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating Notes (Optional)
              </label>
              <textarea
                value={formData.testerRatingNotes}
                onChange={(e) => setFormData({ ...formData, testerRatingNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Add any comments about the tester's work quality..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Documents (Photos, Reports, etc.)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {selectedFiles && (
            <p className="mt-2 text-sm text-slate-600">
              {selectedFiles.length} file(s) selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Processing Batch & Generate QR'}
        </button>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enter or scan the tester batch ID to link your processing</li>
          <li>• GPS and weather data are captured automatically</li>
          <li>• Input and output weights automatically calculate conversion ratio</li>
          <li>• Rate the tester who performed quality testing</li>
          <li>• Upload supporting documents</li>
          <li>• A new QR code will be generated for the next step in the chain</li>
        </ul>
      </div>
    </div>
  );
}
