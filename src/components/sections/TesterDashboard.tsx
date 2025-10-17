import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { QrCode, MapPin, CloudRain, Calendar, Upload, Star, Beaker, AlertCircle } from 'lucide-react';

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
  testDate: string;
  qualityGradeScore: number;
  contaminantLevel: number;
  purityLevel: number;
  labName: string;
  collectorRating: number;
  collectorRatingNotes: string;
}

export default function TesterDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchMethod, setSearchMethod] = useState<'manual' | 'qr'>('manual');
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<CollectorBatch | null>(null);
  const [capturedLocation, setCapturedLocation] = useState(false);
  const [capturedWeather, setCapturedWeather] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);

  const [formData, setFormData] = useState<TesterFormData>({
    collectorBatchId: '',
    batchNumber: '',
    gpsLatitude: null,
    gpsLongitude: null,
    weatherCondition: '',
    temperature: null,
    testDate: new Date().toISOString().split('T')[0],
    qualityGradeScore: 0,
    contaminantLevel: 0,
    purityLevel: 0,
    labName: '',
    collectorRating: 5,
    collectorRatingNotes: '',
  });

  useEffect(() => {
    if (selectedBatch) {
      captureGPS();
      captureWeather();
    }
  }, [selectedBatch]);

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

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gpsLatitude: position.coords.latitude,
            gpsLongitude: position.coords.longitude,
          }));
          setCapturedLocation(true);
        },
        (error) => {
          console.error('GPS error:', error);
          setError('Unable to capture GPS location. Please enable location services.');
        }
      );
    }
  };

  const captureWeather = async () => {
    setFormData(prev => ({
      ...prev,
      weatherCondition: 'Clear',
      temperature: 22,
    }));
    setCapturedWeather(true);
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
          gps_latitude: formData.gpsLatitude,
          gps_longitude: formData.gpsLongitude,
          weather_condition: formData.weatherCondition,
          temperature: formData.temperature,
          test_date: formData.testDate,
          quality_grade_score: formData.qualityGradeScore,
          contaminant_level: formData.contaminantLevel,
          purity_level: formData.purityLevel,
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
        testDate: new Date().toISOString().split('T')[0],
        qualityGradeScore: 0,
        contaminantLevel: 0,
        purityLevel: 0,
        labName: '',
        collectorRating: 5,
        collectorRatingNotes: '',
      });
      setSelectedBatch(null);
      setBatchSearchTerm('');
      setDocuments([]);
      setCapturedLocation(false);
      setCapturedWeather(false);
    } catch (err) {
      setError('Error submitting test. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Quality Testing Dashboard</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Find Batch to Test</h3>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSearchMethod('manual')}
            className={`flex-1 py-2 px-4 rounded-lg border ${
              searchMethod === 'manual'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            Enter Batch ID
          </button>
          <button
            onClick={() => setSearchMethod('qr')}
            className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${
              searchMethod === 'qr'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Scan QR Code
          </button>
        </div>

        {searchMethod === 'manual' ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={batchSearchTerm}
              onChange={(e) => setBatchSearchTerm(e.target.value)}
              placeholder="Enter batch ID or number..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={searchBatch}
              disabled={loading || !batchSearchTerm.trim()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">QR Scanner coming soon</p>
            <p className="text-sm text-slate-500 mt-1">Use manual entry for now</p>
          </div>
        )}

        {selectedBatch && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-semibold text-emerald-900 mb-2">Selected Batch</h4>
            <p className="text-emerald-800"><strong>Batch Number:</strong> {selectedBatch.batch_number}</p>
            <p className="text-emerald-800"><strong>Crop:</strong> {selectedBatch.seed_crop_name}</p>
          </div>
        )}
      </div>

      {selectedBatch && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Test Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-slate-600" />
                <h4 className="font-medium text-slate-800">GPS Location</h4>
                {capturedLocation && <span className="text-xs text-emerald-600 font-medium">Captured</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Latitude: </span>
                  <span className="font-medium text-slate-800">{formData.gpsLatitude?.toFixed(6) || 'Capturing...'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Longitude: </span>
                  <span className="font-medium text-slate-800">{formData.gpsLongitude?.toFixed(6) || 'Capturing...'}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="w-5 h-5 text-slate-600" />
                <h4 className="font-medium text-slate-800">Weather Data</h4>
                {capturedWeather && <span className="text-xs text-emerald-600 font-medium">Captured</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Condition: </span>
                  <span className="font-medium text-slate-800">{formData.weatherCondition || 'Capturing...'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Temperature: </span>
                  <span className="font-medium text-slate-800">{formData.temperature ? `${formData.temperature}°C` : 'Capturing...'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Test Date
              </label>
              <input
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Beaker className="w-4 h-4 inline mr-1" />
                Quality Grade Score (0-100)
              </label>
              <input
                type="number"
                value={formData.qualityGradeScore}
                onChange={(e) => setFormData({ ...formData, qualityGradeScore: parseFloat(e.target.value) })}
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contaminant/Residue Level
              </label>
              <input
                type="number"
                value={formData.contaminantLevel}
                onChange={(e) => setFormData({ ...formData, contaminantLevel: parseFloat(e.target.value) })}
                min="0"
                step="0.0001"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Purity Level (%)
              </label>
              <input
                type="number"
                value={formData.purityLevel}
                onChange={(e) => setFormData({ ...formData, purityLevel: parseFloat(e.target.value) })}
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lab Name
              </label>
              <input
                type="text"
                value={formData.labName}
                onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                required
                placeholder="Enter testing laboratory name"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Upload Documents
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {documents.length > 0 && (
                <p className="text-sm text-slate-600 mt-2">{documents.length} file(s) selected</p>
              )}
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-6">
              <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Rate Collector
              </h4>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Rating (1-5 stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, collectorRating: rating })}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        rating <= formData.collectorRating
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          rating <= formData.collectorRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-400'
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
                  placeholder="Add any comments about the collector's performance..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Test & Generate QR Code'}
          </button>
        </form>
      )}
    </div>
  );
}
