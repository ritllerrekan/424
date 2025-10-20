import { useState, useEffect } from 'react';
import { Camera, MapPin, Cloud, Package, Calendar, Star, Upload, QrCode, Building2, Hash, Ruler } from 'lucide-react';
import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import { supabase } from '../../lib/supabase';
import { useLocationCapture } from '../../hooks/useLocationCapture';

interface ProcessorBatch {
  id: string;
  tester_batch_id: string;
  processing_type: string;
  output_weight: number;
  created_at: string;
}

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  const { location, weather } = useLocationCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processorBatches, setProcessorBatches] = useState<ProcessorBatch[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const [formData, setFormData] = useState({
    processorBatchId: '',
    productName: '',
    brandName: '',
    productType: '',
    quantity: '',
    unit: 'kg',
    location: '',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    processorRating: 5,
    processorRatingNotes: '',
  });

  useEffect(() => {
    fetchProcessorBatches();
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!location.latitude || !location.longitude || location.latitude === '' || location.longitude === '') {
      alert('Please wait for GPS location to be captured');
      return;
    }

    if (!weather.temperature || !weather.condition || weather.temperature === '' || weather.condition === '') {
      alert('Please wait for weather data to be captured');
      return;
    }

    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);
    const temp = parseFloat(weather.temperature);

    if (isNaN(lat) || isNaN(lng) || isNaN(temp)) {
      alert('Invalid location or weather data. Please wait for data to be captured.');
      return;
    }

    setIsSubmitting(true);

    try {
      const qrData = `MANU-${Date.now()}-${formData.processorBatchId}`;

      const { data: manufacturerBatch, error: batchError } = await supabase
        .from('manufacturer_batches')
        .insert({
          processor_batch_id: formData.processorBatchId,
          manufacturer_id: user.id,
          gps_latitude: lat,
          gps_longitude: lng,
          weather_condition: weather.condition,
          temperature: temp,
          product_name: formData.productName,
          brand_name: formData.brandName || null,
          product_type: formData.productType || null,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit || null,
          location: formData.location || null,
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
        brandName: '',
        productType: '',
        quantity: '',
        unit: 'kg',
        location: '',
        manufactureDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        processorRating: 5,
        processorRatingNotes: '',
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
              <Star className="w-4 h-4" />
              Brand Name
            </label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., EcoGreen, NutriFeed, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Type
            </label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select product type</option>
              <option value="Fertilizer">Fertilizer</option>
              <option value="Animal Feed">Animal Feed</option>
              <option value="Compost">Compost</option>
              <option value="Biofuel">Biofuel</option>
              <option value="Biogas">Biogas</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Quantity
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="liters">Liters (L)</option>
              <option value="pieces">Pieces</option>
              <option value="tons">Tons</option>
              <option value="bags">Bags</option>
              <option value="boxes">Boxes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Manufacturing Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Factory Building, Warehouse, etc."
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
