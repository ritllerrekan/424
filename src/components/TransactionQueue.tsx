import { CheckCircle2, XCircle, Clock, Loader2, Trash2, Play, X } from 'lucide-react';
import { useBiconomy } from '../contexts/BiconomyContext';
import { useState } from 'react';

export const TransactionQueue = () => {
  const { transactionQueue, processQueue, clearQueue, removeFromQueue, loading } = useBiconomy();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessQueue = async () => {
    if (transactionQueue.filter(tx => tx.status === 'pending').length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      await processQueue();
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (transactionQueue.length === 0) {
    return null;
  }

  const pendingCount = transactionQueue.filter(tx => tx.status === 'pending').length;
  const processingCount = transactionQueue.filter(tx => tx.status === 'processing').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-900">Transaction Queue</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            {transactionQueue.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <button
              onClick={handleProcessQueue}
              disabled={isProcessing || loading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1.5" />
                  Process ({pendingCount})
                </>
              )}
            </button>
          )}
          <button
            onClick={clearQueue}
            disabled={processingCount > 0}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-3 w-3 mr-1.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {transactionQueue.map((tx) => (
          <div
            key={tx.id}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-shrink-0 mt-0.5">
              {tx.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
              {tx.status === 'processing' && (
                <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
              )}
              {tx.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {tx.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    tx.status === 'pending'
                      ? 'bg-gray-100 text-gray-700'
                      : tx.status === 'processing'
                      ? 'bg-emerald-100 text-emerald-700'
                      : tx.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {tx.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">To:</span>{' '}
                  <span className="font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
                </p>
                {tx.txHash && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Hash:</span>{' '}
                    <a
                      href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-600 hover:text-emerald-700 underline"
                    >
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                    </a>
                  </p>
                )}
                {tx.error && (
                  <p className="text-xs text-red-600 mt-1">{tx.error}</p>
                )}
              </div>
            </div>

            {tx.status === 'pending' && (
              <button
                onClick={() => removeFromQueue(tx.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
