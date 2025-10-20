import { useState } from 'react';
import { Package, Search } from 'lucide-react';

export function PublicBatchTracker() {
  const [batchId, setBatchId] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;

    setSearching(true);
    try {
      console.log('Searching for batch:', batchId);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-800">FoodTrace</span>
            <span className="text-sm text-gray-500 ml-2">Public Tracker</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Track Your Food</h1>
            <p className="text-xl text-gray-600">
              Enter a batch ID to see the complete journey of your food from farm to table
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSearch}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="Enter batch ID or scan QR code"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !batchId.trim()}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {searching ? 'Searching...' : 'Track'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">How to track</h3>
              <ol className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span>Find the batch ID on your product label or QR code</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span>Enter the batch ID in the search box above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span>View the complete supply chain history and quality information</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
