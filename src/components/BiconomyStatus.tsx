import { CheckCircle2, XCircle, Loader2, Wallet, Clock } from 'lucide-react';
import { useBiconomy } from '../contexts/BiconomyContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useEffect, useState } from 'react';

export const BiconomyStatus = () => {
  const { smartAccountAddress, isDeployed, loading, error, getBalance } = useBiconomy();
  const { walletAddress } = useWeb3Auth();
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (smartAccountAddress && !loading) {
      loadBalance();
    }
  }, [smartAccountAddress, loading]);

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Smart Account Status</h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
      </div>

      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Wallet className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">EOA Wallet</p>
            <p className="text-xs font-mono text-gray-900 truncate">{walletAddress}</p>
          </div>
        </div>

        {smartAccountAddress && (
          <>
            <div className="flex items-start space-x-3">
              <Wallet className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Smart Account</p>
                <p className="text-xs font-mono text-gray-900 truncate">{smartAccountAddress}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {isDeployed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-medium">Deployed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-medium">Not Deployed</span>
                  </>
                )}
              </div>
              {balance !== null && (
                <span className="text-xs text-gray-600">
                  {parseFloat(balance).toFixed(4)} MATIC
                </span>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="flex items-start space-x-2 bg-red-50 p-2 rounded">
            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span className="text-xs text-gray-600">Gas Sponsorship Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
