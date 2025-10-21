import { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ethers } from 'ethers';
import {
  BlockchainTransaction,
  TransactionEventType,
  TransactionFilter,
  TransactionStatus
} from '../types/transaction';
import {
  fetchTransactionsFromCache,
  searchTransactions,
  syncTransactionsForUser,
  formatGasPrice,
  formatEther
} from '../services/transactionService';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { exportToCSV } from '../utils/exportUtils';

const EVENT_TYPE_LABELS: Record<TransactionEventType, string> = {
  BatchCreated: 'Batch Created',
  CollectorDataAdded: 'Collection',
  TesterDataAdded: 'Testing',
  ProcessorDataAdded: 'Processing',
  ManufacturerDataAdded: 'Manufacturing',
  BatchCompleted: 'Completed'
};

const EVENT_TYPE_COLORS: Record<TransactionEventType, string> = {
  BatchCreated: 'bg-blue-100 text-blue-800',
  CollectorDataAdded: 'bg-green-100 text-green-800',
  TesterDataAdded: 'bg-amber-100 text-amber-800',
  ProcessorDataAdded: 'bg-purple-100 text-purple-800',
  ManufacturerDataAdded: 'bg-pink-100 text-pink-800',
  BatchCompleted: 'bg-teal-100 text-teal-800'
};

export function TransactionHistory() {
  const { userId, walletAddress, provider } = useWeb3Auth();
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    if (userId) {
      loadTransactions();
    }
  }, [userId, filter, currentPage]);

  const loadTransactions = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const result = await fetchTransactionsFromCache(userId, filter, itemsPerPage, offset);
      setTransactions(result.transactions);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!userId || !walletAddress || !provider) return;

    setSyncing(true);
    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      await syncTransactionsForUser(ethersProvider, userId, walletAddress);
      await loadTransactions();
    } catch (error) {
      console.error('Error syncing transactions:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const results = await searchTransactions(userId, searchTerm, filter);
      setTransactions(results);
      setTotalCount(results.length);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'transactionHash', label: 'Transaction Hash' },
      { key: 'blockNumber', label: 'Block Number' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'eventType', label: 'Event Type' },
      { key: 'batchId', label: 'Batch ID' },
      { key: 'phase', label: 'Phase' },
      { key: 'gasUsed', label: 'Gas Used' },
      { key: 'status', label: 'Status' },
      { key: 'description', label: 'Description' }
    ];

    const data = transactions.map(tx => ({
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      timestamp: new Date(tx.blockTimestamp * 1000).toLocaleString(),
      eventType: EVENT_TYPE_LABELS[tx.eventType],
      batchId: tx.metadata.batchId || '',
      phase: tx.metadata.phase || '',
      gasUsed: tx.gasUsed,
      status: tx.status,
      description: tx.metadata.description
    }));

    exportToCSV(data, `transactions-${new Date().toISOString().split('T')[0]}.csv`, headers);
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600 animate-pulse" />;
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://polygonscan.com/tx/${txHash}`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
              <History className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
              <p className="text-sm text-gray-600">
                {totalCount} transaction{totalCount !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || !provider}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by batch ID, transaction hash, or description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="backdrop-blur-md bg-white/80 rounded-xl p-4 border border-gray-200/50">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={filter.eventType || ''}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        eventType: e.target.value ? (e.target.value as TransactionEventType) : undefined
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Events</option>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filter.status || ''}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        status: e.target.value ? (e.target.value as TransactionStatus) : undefined
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch ID</label>
                  <input
                    type="text"
                    value={filter.batchId || ''}
                    onChange={(e) => setFilter({ ...filter, batchId: e.target.value || undefined })}
                    placeholder="Filter by batch ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setFilter({});
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    loadTransactions();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="backdrop-blur-md bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Total Transactions</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Confirmed</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {transactions.filter((tx) => tx.status === 'confirmed').length}
            </p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-700">Total Gas Used</span>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {transactions.reduce((sum, tx) => sum + parseInt(tx.gasUsed || '0'), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Transactions</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || Object.keys(filter).length > 0
              ? 'No transactions match your search criteria'
              : 'Start by syncing your blockchain transactions'}
          </p>
          {!searchTerm && Object.keys(filter).length === 0 && (
            <button
              onClick={handleSync}
              disabled={syncing || !provider}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Transactions'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="backdrop-blur-lg bg-white/70 rounded-xl shadow-lg border border-white/20 p-5 hover:bg-white/80 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(tx.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            EVENT_TYPE_COLORS[tx.eventType]
                          }`}
                        >
                          {EVENT_TYPE_LABELS[tx.eventType]}
                        </span>
                        {tx.metadata.phase && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {tx.metadata.phase}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{tx.metadata.description}</p>
                    </div>
                  </div>
                  <a
                    href={getExplorerUrl(tx.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Batch ID:</span>
                    <p className="font-mono text-gray-800">{tx.metadata.batchId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Block:</span>
                    <p className="font-mono text-gray-800">#{tx.blockNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gas Used:</span>
                    <p className="font-mono text-gray-800">{parseInt(tx.gasUsed).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="text-gray-800">
                      {new Date(tx.blockTimestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{tx.transactionHash}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="backdrop-blur-lg bg-white/70 rounded-xl shadow-lg border border-white/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
