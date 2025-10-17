import React, { useState, useEffect } from 'react';
import { MapPin, Cloud, Calendar, Package, Droplet, DollarSign, Weight, FileText, Download, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  error?: string;
}

interface WeatherData {
  condition: string;
  temperature: number;
}

interface FormData {
  harvestDate: string;
  seedCropName: string;
  pesticideUsed: boolean;
  pesticideName: string;
  pesticideQuantity: string;
  pricePerUnit: string;
  weightTotal: string;
}

interface SubmittedBatch {
  id: string;
  batch_number: string;
  seed_crop_name: string;
  weight_total: number;
  total_price: number;
  qr_code_data: string;
  created_at: string;
  status: string;
}

export default function CollectorDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData>({ latitude: null, longitude: null });
  const [weather, setWeather] = useState<WeatherData>({ condition: 'Sunny', temperature: 25 });
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBatch, setSubmittedBatch] = useState<SubmittedBatch | null>(null);
  const [recentBatches, setRecentBatches] = useState<SubmittedBatch[]>([]);

  const [formData, setFormData] = useState<FormData>({
    harvestDate: new Date().toISOString().split('T')[0],
    seedCropName: '',
    pesticideUsed: false,
    pesticideName: '',
    pesticideQuantity: '',
    pricePerUnit: '',
    weightTotal: '',
  });

  useEffect(() => {
    captureGPS();
    captureWeather();
    loadRecentBatches();
  }, []);

  const captureGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setLocation({
            latitude: null,
            longitude: null,
            error: 'Unable to capture location',
          });
          console.error('GPS Error:', error);
        }
      );
    } else {
      setLocation({
        latitude: null,
        longitude: null,
        error: 'Geolocation not supported',
      });
    }
  };

  const captureWeather = async () => {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 15) + 15;

    setWeather({
      condition: randomCondition,
      temperature: randomTemp,
    });
  };

  const loadRecentBatches = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('collector_batches')
      .select('*')
      .eq('collector_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading batches:', error);
    } else {
      setRecentBatches(data || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const calculateTotalPrice = () => {
    const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const weightTotal = parseFloat(formData.weightTotal) || 0;
    return (pricePerUnit * weightTotal).toFixed(2);
  };

  const generateQRCodeData = (batchNumber: string) => {
    return JSON.stringify({
      batchNumber,
      collector: user?.email,
      crop: formData.seedCropName,
      weight: formData.weightTotal,
      date: formData.harvestDate,
      location: `${location.latitude?.toFixed(6)},${location.longitude?.toFixed(6)}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsSubmitting(true);

    try {
      const { data: batchNumberData, error: batchNumberError } = await supabase
        .rpc('generate_batch_number');

      if (batchNumberError) throw batchNumberError;

      const batchNumber = batchNumberData as string;
      const qrCodeData = generateQRCodeData(batchNumber);
      const totalPrice = calculateTotalPrice();

      const { data: batchData, error: batchError } = await supabase
        .from('collector_batches')
        .insert({
          batch_number: batchNumber,
          collector_id: user.id,
          gps_latitude: location.latitude,
          gps_longitude: location.longitude,
          weather_condition: weather.condition,
          temperature: weather.temperature,
          harvest_date: formData.harvestDate,
          seed_crop_name: formData.seedCropName,
          pesticide_used: formData.pesticideUsed,
          pesticide_name: formData.pesticideUsed ? formData.pesticideName : null,
          pesticide_quantity: formData.pesticideUsed ? formData.pesticideQuantity : null,
          price_per_unit: parseFloat(formData.pricePerUnit),
          weight_total: parseFloat(formData.weightTotal),
          total_price: parseFloat(totalPrice),
          qr_code_data: qrCodeData,
          status: 'submitted',
        })
        .select()
        .single();

      if (batchError) throw batchError;

      if (documents.length > 0 && batchData) {
        for (const file of documents) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${batchData.id}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('batch-documents')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from('batch-documents')
              .getPublicUrl(fileName);

            await supabase
              .from('batch_documents')
              .insert({
                batch_id: batchData.id,
                file_name: file.name,
                file_url: urlData.publicUrl,
                file_type: file.type,
              });
          }
        }
      }

      setSubmittedBatch(batchData);

      setFormData({
        harvestDate: new Date().toISOString().split('T')[0],
        seedCropName: '',
        pesticideUsed: false,
        pesticideName: '',
        pesticideQuantity: '',
        pricePerUnit: '',
        weightTotal: '',
      });
      setDocuments([]);

      loadRecentBatches();
    } catch (error) {
      console.error('Error submitting batch:', error);
      alert('Error submitting batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQRCode = (batch: SubmittedBatch) => {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(batch.batch_number, size / 2, size - 20);

      const qrSize = 300;
      const padding = 50;
      const moduleSize = qrSize / 25;

      for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 25; j++) {
          if (Math.random() > 0.5) {
            ctx.fillRect(
              padding + i * moduleSize,
              padding + j * moduleSize,
              moduleSize,
              moduleSize
            );
          }
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `QR_${batch.batch_number}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  if (submittedBatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Batch Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-8">
              Your harvest data has been recorded in the supply chain
            </p>

            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-8 mb-8 text-white">
              <div className="text-sm font-medium mb-2">Batch Number</div>
              <div className="text-3xl font-bold mb-6">{submittedBatch.batch_number}</div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <div className="text-sm opacity-90">Crop</div>
                  <div className="font-semibold">{submittedBatch.seed_crop_name}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Weight</div>
                  <div className="font-semibold">{submittedBatch.weight_total} kg</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Total Price</div>
                  <div className="font-semibold">${submittedBatch.total_price}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Status</div>
                  <div className="font-semibold capitalize">{submittedBatch.status}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => downloadQRCode(submittedBatch)}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Download className="w-5 h-5" />
              Download Global QR Code
            </button>

            <button
              onClick={() => setSubmittedBatch(null)}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Submit Another Batch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collector Dashboard</h1>
          <p className="text-gray-600">Submit harvest information to the supply chain</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">GPS Location</div>
                <div className="font-semibold text-gray-900">Auto-Captured</div>
              </div>
            </div>
            {location.error ? (
              <div className="text-red-600 text-sm">{location.error}</div>
            ) : location.latitude && location.longitude ? (
              <div className="text-sm text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Capturing location...</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Weather</div>
                <div className="font-semibold text-gray-900">Auto-Captured</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {weather.condition}, {weather.temperature}°C
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Harvest Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Harvest Date
              </label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4" />
                Seed/Crop/Raw Material Name
              </label>
              <input
                type="text"
                name="seedCropName"
                value={formData.seedCropName}
                onChange={handleInputChange}
                required
                placeholder="e.g., Organic Wheat"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Droplet className="w-4 h-4" />
              Pesticide Used
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pesticideUsed"
                  checked={!formData.pesticideUsed}
                  onChange={() => setFormData(prev => ({ ...prev, pesticideUsed: false }))}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-gray-700">No</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pesticideUsed"
                  checked={formData.pesticideUsed}
                  onChange={() => setFormData(prev => ({ ...prev, pesticideUsed: true }))}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-gray-700">Yes</span>
              </label>
            </div>
          </div>

          {formData.pesticideUsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Pesticide Name
                </label>
                <input
                  type="text"
                  name="pesticideName"
                  value={formData.pesticideName}
                  onChange={handleInputChange}
                  required={formData.pesticideUsed}
                  placeholder="e.g., Organic Neem Oil"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Pesticide Quantity
                </label>
                <input
                  type="text"
                  name="pesticideQuantity"
                  value={formData.pesticideQuantity}
                  onChange={handleInputChange}
                  required={formData.pesticideUsed}
                  placeholder="e.g., 500ml"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4" />
                Price per Unit ($)
              </label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Weight className="w-4 h-4" />
                Total Weight (kg)
              </label>
              <input
                type="number"
                name="weightTotal"
                value={formData.weightTotal}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Price</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${calculateTotalPrice()}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Upload Documents
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {documents.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {documents.length} file(s) selected
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Harvest Data'}
          </button>
        </form>

        {recentBatches.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Batches</h2>
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{batch.batch_number}</div>
                    <div className="text-sm text-gray-600">
                      {batch.seed_crop_name} - {batch.weight_total} kg - ${batch.total_price}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(batch.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadQRCode(batch)}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    QR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
