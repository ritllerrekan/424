import { useEffect, useState } from 'react';
import { Receipt, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Transaction } from '../../lib/supabase';

export const TransactionHistory = () => {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [userProfile]);

  const fetchTransactions = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'batch_created':
        return 'Batch Created';
      case 'phase_update':
        return 'Phase Update';
      case 'test_recorded':
        return 'Test Recorded';
      case 'transfer':
        return 'Transfer';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-emerald-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Transaction History</h1>
        <p className="text-emerald-700 mt-2">View all blockchain transactions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{transactions.length}</h3>
          <p className="text-emerald-700 text-sm mt-1">Total Transactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">
            {transactions.filter(t => t.status === 'confirmed').length}
          </h3>
          <p className="text-emerald-700 text-sm mt-1">Confirmed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">
            {transactions.filter(t => t.status === 'pending').length}
          </h3>
          <p className="text-emerald-700 text-sm mt-1">Pending</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
        <h2 className="text-xl font-bold text-emerald-900 mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <p className="text-emerald-700">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="border border-emerald-100 rounded-lg p-4 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(tx.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-emerald-900">{getTypeLabel(tx.transaction_type)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                      {tx.blockchain_tx_hash && (
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-xs text-emerald-600 font-mono break-all">
                            {tx.blockchain_tx_hash}
                          </p>
                          <button className="text-emerald-600 hover:text-emerald-700">
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-emerald-700">
                        <span>{formatDate(tx.created_at)}</span>
                        {tx.gas_used > 0 && <span>Gas: {tx.gas_used}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-3">Blockchain Network Status</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-50 mb-1">Network</p>
            <p className="text-lg font-semibold">Ethereum Mainnet</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-50 mb-1">Status</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-lg font-semibold">Connected</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-50 mb-1">Average Gas Price</p>
            <p className="text-lg font-semibold">25 Gwei</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-50 mb-1">Block Height</p>
            <p className="text-lg font-semibold">18,234,567</p>
          </div>
        </div>
      </div>
    </div>
  );
};
