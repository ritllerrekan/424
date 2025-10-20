import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useBiconomy } from '../contexts/BiconomyContext';
import { SessionKeyModule, SessionKeyConfig, createUniversalPermission } from '../lib/sessionKey';

export const SessionKeyManager = () => {
  const { smartAccount } = useBiconomy();
  const [sessionModule, setSessionModule] = useState<SessionKeyModule | null>(null);
  const [activeKeys, setActiveKeys] = useState<SessionKeyConfig[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [duration, setDuration] = useState(3600);
  const [maxValue, setMaxValue] = useState('0.01');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (smartAccount) {
      const module = new SessionKeyModule(smartAccount);
      setSessionModule(module);
      loadActiveKeys(module);
    }
  }, [smartAccount]);

  const loadActiveKeys = (module: SessionKeyModule) => {
    const keys = module.getActiveSessionKeys();
    setActiveKeys(keys);
  };

  const handleCreateSessionKey = async () => {
    if (!sessionModule) return;

    setIsCreating(true);
    try {
      const permissions = [createUniversalPermission(maxValue)];

      const { sessionKey, config } = await sessionModule.createSessionKey(
        duration,
        permissions
      );

      await sessionModule.enableSessionKey(config);

      loadActiveKeys(sessionModule);
      setShowCreateForm(false);
      setDuration(3600);
      setMaxValue('0.01');

      console.log('Session key created and enabled:', sessionKey.address);
    } catch (error) {
      console.error('Failed to create session key:', error);
      alert('Failed to create session key. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeSessionKey = (address: string) => {
    if (!sessionModule) return;

    if (confirm('Are you sure you want to revoke this session key?')) {
      sessionModule.revokeSessionKey(address);
      loadActiveKeys(sessionModule);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!smartAccount) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Session Keys</h3>
          {activeKeys.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              {activeKeys.length} Active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Create Key
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Session Key</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={300}>5 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={1800}>30 minutes</option>
                <option value={3600}>1 hour</option>
                <option value={7200}>2 hours</option>
                <option value={86400}>24 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Transaction Value (MATIC)
              </label>
              <input
                type="number"
                step="0.001"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleCreateSessionKey}
                disabled={isCreating}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Create & Enable
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeKeys.length === 0 ? (
        <div className="text-center py-6">
          <Key className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No active session keys</p>
          <p className="text-xs text-gray-500 mt-1">
            Create a session key to enable auto-signing
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeKeys.map((key) => (
            <div
              key={key.sessionPublicKey}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-mono text-gray-900 truncate">
                    {key.sessionPublicKey}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Valid until: {formatTimestamp(key.validUntil)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Permissions: {key.permissions.length} rule(s)
                  </div>
                  {key.permissions[0]?.maxValue && (
                    <div className="text-xs text-gray-600">
                      Max value: {key.permissions[0].maxValue} MATIC
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleRevokeSessionKey(key.sessionPublicKey)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
