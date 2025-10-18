import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { QrCode, MapPin, CloudRain, Upload, Star, Beaker, AlertCircle, Camera } from 'lucide-react';
import { useLocationCapture } from '../../hooks/useLocationCapture';

interface CollectorBatch {
  id: string;
  batch_number: string;
  seed_crop_name: string;
  collector_id: string;
  created_at: string;
}

interface TesterFormData {
  collectorBatchId: string;
  batchNumber: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  weatherCondition: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  testDate: string;
  qualityGradeScore: string;
  contaminantLevel: string;
  purityLevel: string;
  labName: string;
  collectorRating: number;
  collectorRatingNotes: string;
}

export default function TesterDashboard() {
  const { user } = useAuth();
  const { location, weather } = useLocationCapture();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<CollectorBatch | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  const [formData, setFormData] = useState<TesterFormData>({
    collectorBatchId: '',
    batchNumber: '',
    gpsLatitude: null,
    gpsLongitude: null,
    weatherCondition: '',
    temperature: null,
    humidity: null,
    pressure: null,
    windSpeed: null,
    testDate: new Date().toISOString().split('T')[0],
    qualityGradeScore: '',
    contaminantLevel: '',
    purityLevel: '',
    labName: '',
    collectorRating: 5,
    collectorRatingNotes: '',
  });

  const searchBatch = async () => {
    if (!batchSearchTerm.trim()) {
      setError('Please enter a batch ID or number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: searchError } = await supabase
        .from('collector_batches')
        .select('*')
        .or(`id.eq.${batchSearchTerm},batch_number.eq.${batchSearchTerm}`)
        .maybeSingle();

      if (searchError) throw searchError;

      if (!data) {
        setError('Batch not found. Please check the ID or number and try again.');
        return;
      }

      setSelectedBatch(data);
      setFormData(prev => ({
        ...prev,
        collectorBatchId: data.id,
        batchNumber: data.batch_number,
      }));
      setSuccess(`Batch found: ${data.batch_number}`);
    } catch (err) {
      setError('Error searching for batch. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatch) {
      setError('Please search and select a batch first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const qrData = `TEST-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const { data: testerBatch, error: insertError } = await supabase
        .from('tester_batches')
        .insert({
          collector_batch_id: formData.collectorBatchId,
          tester_id: user?.id,
          gps_latitude: parseFloat(location.latitude),
          gps_longitude: parseFloat(location.longitude),
          weather_condition: weather.condition,
          temperature: parseFloat(weather.temperature),
          test_date: formData.testDate,
          quality_grade_score: parseFloat(formData.qualityGradeScore) || 0,
          contaminant_level: parseFloat(formData.contaminantLevel) || 0,
          purity_level: parseFloat(formData.purityLevel) || 0,
          lab_name: formData.labName,
          collector_rating: formData.collectorRating,
          collector_rating_notes: formData.collectorRatingNotes,
          qr_code_data: qrData,
          status: 'completed',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (documents.length > 0 && testerBatch) {
        const documentUploads = documents.map(file => ({
          tester_batch_id: testerBatch.id,
          file_name: file.name,
          file_url: `temp://${file.name}`,
          file_type: file.type,
        }));

        const { error: docError } = await supabase
          .from('tester_documents')
          .insert(documentUploads);

        if (docError) throw docError;
      }

      setSuccess(`Test submitted successfully! QR Code: ${qrData}`);

      setFormData({
        collectorBatchId: '',
        batchNumber: '',
        gpsLatitude: null,
        gpsLongitude: null,
        weatherCondition: '',
        temperature: null,
        humidity: null,
        pressure: null,
        windSpeed: null,
        testDate: new Date().toISOString().split('T')[0],
        qualityGradeScore: '',
        contaminantLevel: '',
        purityLevel: '',
        labName: '',
        collectorRating: 5,
        collectorRatingNotes: '',
      });
      setSelectedBatch(null);
      setBatchSearchTerm('');
      setDocuments([]);
    } catch (err) {
      setError('Error submitting test. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Tester Dashboard</h2>
        <QrCode className="w-8 h-8 text-emerald-600" />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800 font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Collector Batch ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={batchSearchTerm}
                onChange={(e) => setBatchSearchTerm(e.target.value)}
                onBlur={searchBatch}
                placeholder="Enter or scan batch ID"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                title="Scan QR Code"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            {selectedBatch && (
              <p className="text-sm text-emerald-600 mt-1">
                Found: {selectedBatch.batch_number} - {selectedBatch.seed_crop_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Test Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.testDate}
              onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  <CloudRain className="w-4 h-4 text-blue-600" />
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Beaker className="w-4 h-4 inline mr-1" />
              Quality Grade Score (0-100) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.qualityGradeScore}
              onChange={(e) => setFormData({ ...formData, qualityGradeScore: e.target.value })}
              min="0"
              max="100"
              step="0.01"
              required
              placeholder="Enter score"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contaminant/Residue Level <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.contaminantLevel}
              onChange={(e) => setFormData({ ...formData, contaminantLevel: e.target.value })}
              min="0"
              step="0.0001"
              required
              placeholder="Enter level"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Purity Level (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.purityLevel}
              onChange={(e) => setFormData({ ...formData, purityLevel: e.target.value })}
              min="0"
              max="100"
              step="0.01"
              required
              placeholder="Enter purity"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lab Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.labName}
              onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
              required
              placeholder="Enter laboratory name"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2 border-t border-slate-200 pt-6 mt-2">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-800">Rate Previous Chain (Collector)</h3>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, collectorRating: rating })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      rating <= formData.collectorRating
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-300 bg-white hover:border-amber-200'
                    }`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        rating <= formData.collectorRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating Notes (Optional)
              </label>
              <textarea
                value={formData.collectorRatingNotes}
                onChange={(e) => setFormData({ ...formData, collectorRatingNotes: e.target.value })}
                rows={3}
                placeholder="Add any comments about the collector's work quality..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="md:col-span-2 border-t border-slate-200 pt-6 mt-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Upload Documents (Photos, Reports, etc.)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {documents.length > 0 && (
              <p className="text-sm text-emerald-600 mt-2">{documents.length} file(s) selected</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedBatch}
          className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Test & Generate QR Code'}
        </button>
      </form>
    </div>
  );
}
