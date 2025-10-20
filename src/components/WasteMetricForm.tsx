import { useState } from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';
import { WasteMetricInput, WASTE_CATEGORIES, WASTE_UNITS, WastePhase, WasteCategory } from '../types/waste';

interface WasteMetricFormProps {
  batchId: string;
  phase: WastePhase;
  onSubmit: (wasteData: WasteMetricInput) => Promise<void>;
  onCancel: () => void;
}

export function WasteMetricForm({ batchId, phase, onSubmit, onCancel }: WasteMetricFormProps) {
  const [formData, setFormData] = useState<WasteMetricInput>({
    batch_id: batchId,
    phase: phase,
    waste_quantity: 0,
    waste_unit: 'kg',
    waste_category: 'other' as WasteCategory,
    waste_reason: '',
    cost_impact: 0,
    currency: 'USD',
    prevention_notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.waste_quantity <= 0) {
      setError('Waste quantity must be greater than 0');
      return;
    }

    if (!formData.waste_reason.trim()) {
      setError('Please provide a reason for the waste');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record waste metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Record Waste Metric</h2>
          <p className="text-sm text-gray-600">Track waste and identify prevention opportunities</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waste Quantity *
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              required
              value={formData.waste_quantity}
              onChange={(e) => setFormData({ ...formData, waste_quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit *
            </label>
            <select
              required
              value={formData.waste_unit}
              onChange={(e) => setFormData({ ...formData, waste_unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {WASTE_UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waste Category *
          </label>
          <select
            required
            value={formData.waste_category}
            onChange={(e) => setFormData({ ...formData, waste_category: e.target.value as WasteCategory })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {WASTE_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label} - {category.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waste Reason *
          </label>
          <textarea
            required
            rows={3}
            value={formData.waste_reason}
            onChange={(e) => setFormData({ ...formData, waste_reason: e.target.value })}
            placeholder="Describe what caused the waste..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Impact
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_impact}
              onChange={(e) => setFormData({ ...formData, cost_impact: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prevention Notes & Recommendations
          </label>
          <textarea
            rows={4}
            value={formData.prevention_notes}
            onChange={(e) => setFormData({ ...formData, prevention_notes: e.target.value })}
            placeholder="How could this waste have been prevented? What recommendations do you have?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: Use bullet points for multiple recommendations
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Recording...' : 'Record Waste'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
