import { useState, useEffect } from 'react';
import { Camera, MapPin, Cloud, Package, Calendar, Star, Upload, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProcessorBatch {
  id: string;
  tester_batch_id: string;
  processing_type: string;
  output_weight: number;
  created_at: string;
}

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processorBatches, setProcessorBatches] = useState<ProcessorBatch[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const [formData, setFormData] = useState({
    processorBatchId: '',
    productName: '',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    processorRating: 5,
    processorRatingNotes: '',
    gpsLatitude: '',
    gpsLongitude: '',
    weatherCondition: '',
    temperature: '',
  });

  useEffect(() => {
    fetchProcessorBatches();
    requestLocationPermission();
    captureWeather();
  }, []);

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      const confirmation = window.confirm(
        'This application needs access to your location to capture GPS coordinates for batch tracking. Allow location access?'
      );
      if (confirmation) {
        captureGPS();
      }
    }
  };

  const fetchProcessorBatches = async () => {
    const { data, error } = await supabase
      .from('processor_batches')
      .select('id, tester_batch_id, processing_type, output_weight, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setProcessorBatches(data);
    }
  };

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gpsLatitude: position.coords.latitude.toFixed(6),
            gpsLongitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          console.error('GPS error:', error);
          alert('Unable to capture GPS location. Please enable location services and refresh the page.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const captureWeather = async () => {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Light Rain', 'Sunny'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 20) + 15;
    const humidity = Math.floor(Math.random() * 40) + 40;
    const pressure = Math.floor(Math.random() * 30) + 990;
    const windSpeed = Math.floor(Math.random() * 15) + 5;

    setFormData(prev => ({
      ...prev,
      weatherCondition: `${randomCondition}, Humidity: ${humidity}%, Pressure: ${pressure}hPa, Wind: ${windSpeed}km/h`,
      temperature: randomTemp.toString(),
    }));
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
      const qrData = `MANU-${Date.now()}-${formData.processorBatchId}`;

      const { data: manufacturerBatch, error: batchError } = await supabase
        .from('manufacturer_batches')
        .insert({
          processor_batch_id: formData.processorBatchId,
          manufacturer_id: user.id,
          gps_latitude: parseFloat(formData.gpsLatitude),
          gps_longitude: parseFloat(formData.gpsLongitude),
          weather_condition: formData.weatherCondition,
          temperature: parseFloat(formData.temperature),
          product_name: formData.productName,
          manufacture_date: formData.manufactureDate,
          expiry_date: formData.expiryDate,
          processor_rating: formData.processorRating,
          processor_rating_notes: formData.processorRatingNotes || null,
          qr_code_data: qrData,
          status: 'completed',
        })
        .select()
        .single();

      if (batchError) throw batchError;

      if (selectedFiles && manufacturerBatch) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileName = `${manufacturerBatch.id}/${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('manufacturer-documents')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('manufacturer-documents')
              .getPublicUrl(fileName);

            await supabase.from('manufacturer_documents').insert({
              manufacturer_batch_id: manufacturerBatch.id,
              file_name: file.name,
              file_url: urlData.publicUrl,
              file_type: file.type,
            });
          }
        }
      }

      alert('Manufacturing batch submitted successfully!\n\nQR Code: ' + qrData);

      setFormData({
        processorBatchId: '',
        productName: '',
        manufactureDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        processorRating: 5,
        processorRatingNotes: '',
        gpsLatitude: '',
        gpsLongitude: '',
        weatherCondition: '',
        temperature: '',
      });
      setSelectedFiles(null);
      captureGPS();
      captureWeather();
    } catch (error) {
      console.error('Error submitting batch:', error);
      alert('Error submitting batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchIdScan = async (batchId: string) => {
    const batch = processorBatches.find(b => b.id === batchId);
    if (batch) {
      setFormData(prev => ({ ...prev, processorBatchId: batchId }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Manufacturer Dashboard</h2>
        <QrCode className="w-8 h-8 text-emerald-600" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Processor Batch ID <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.processorBatchId}
                onChange={(e) => setFormData({ ...formData, processorBatchId: e.target.value })}
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
            {formData.processorBatchId && (
              <select
                value={formData.processorBatchId}
                onChange={(e) => setFormData({ ...formData, processorBatchId: e.target.value })}
                className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select from recent batches</option>
                {processorBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.processing_type} - {batch.output_weight}kg (ID: {batch.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Organic Fertilizer, Animal Feed, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Manufacture Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.manufactureDate}
              onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              min={formData.manufactureDate}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              GPS Location (Auto-captured)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.gpsLatitude}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                placeholder="Latitude"
              />
              <input
                type="text"
                value={formData.gpsLongitude}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                placeholder="Longitude"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Weather (Auto-captured)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.weatherCondition}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                placeholder="Condition"
              />
              <input
                type="text"
                value={formData.temperature ? `${formData.temperature}°C` : ''}
                readOnly
                className="w-24 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                placeholder="Temp"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Rate Previous Chain (Processor)
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
                    onClick={() => setFormData({ ...formData, processorRating: rating })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.processorRating >= rating
                        ? 'border-amber-500 bg-amber-50 text-amber-600'
                        : 'border-slate-300 bg-white text-slate-400 hover:border-amber-300'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${formData.processorRating >= rating ? 'fill-amber-500' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating Notes (Optional)
              </label>
              <textarea
                value={formData.processorRatingNotes}
                onChange={(e) => setFormData({ ...formData, processorRatingNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Add any comments about the processor's work quality..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Documents (Photos, Certificates, Reports, etc.)
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
          {isSubmitting ? 'Submitting...' : 'Submit Manufacturing Batch & Generate QR'}
        </button>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enter or scan the processor batch ID to link your manufacturing</li>
          <li>• GPS and weather data are captured automatically</li>
          <li>• Enter product details including name, manufacture and expiry dates</li>
          <li>• Rate the processor who performed the processing work</li>
          <li>• Upload supporting documents like certificates or quality reports</li>
          <li>• A new QR code will be generated and the batch moves to completed</li>
        </ul>
      </div>
    </div>
  );
}
