import { useState, useEffect } from 'react';
import { Package, Wallet, User, Building, Phone } from 'lucide-react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { UserRole } from '../lib/supabase';

interface Web3LoginPageProps {
  onBack: () => void;
}

export const Web3LoginPage = ({ onBack }: Web3LoginPageProps) => {
  const { login, userProfile, walletAddress, loading, updateUserProfile } = useWeb3Auth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('collector');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile && !userProfile.organization) {
      setShowProfileSetup(true);
      setFullName(userProfile.full_name || '');
      setRole(userProfile.role || 'collector');
    }
  }, [userProfile]);

  const handleLogin = async () => {
    setError('');
    try {
      await login();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUpdating(true);

    try {
      await updateUserProfile(fullName, role, organization, phone);
      setShowProfileSetup(false);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (showProfileSetup && userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Package className="w-10 h-10 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-900">FoodTrace</span>
            </div>
            <h2 className="text-3xl font-bold text-emerald-900 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-emerald-700">
              Set up your supply chain role and details
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8">
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-semibold text-emerald-900 mb-1">Wallet Connected</p>
              <p className="text-xs text-emerald-700 font-mono break-all">{walletAddress}</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Role in Supply Chain
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-11 pr-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none bg-white"
                    required
                  >
                    <option value="collector">Collector - Harvest & Source</option>
                    <option value="tester">Tester - Quality Assurance</option>
                    <option value="processor">Processor - Transform & Package</option>
                    <option value="manufacturer">Manufacturer - Final Production</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Organization
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isUpdating ? 'Saving...' : 'Complete Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="w-10 h-10 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-900">FoodTrace</span>
          </div>
          <h2 className="text-3xl font-bold text-emerald-900 mb-2">
            Welcome to FoodTrace
          </h2>
          <p className="text-emerald-700">
            Secure blockchain-based supply chain tracking
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8">
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Wallet className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 mb-1">
                    Web3 Authentication
                  </p>
                  <p className="text-xs text-emerald-700">
                    Connect with email, social login, or crypto wallet. Your identity is secured on the blockchain.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-emerald-700">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>No password required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>Embedded wallet created automatically</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>Secure session management</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <Wallet className="w-5 h-5" />
            <span>{loading ? 'Initializing...' : 'Connect with Web3Auth'}</span>
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-emerald-600 hover:text-emerald-700 text-sm transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-emerald-600">
            Powered by Web3Auth • Polygon Amoy Testnet
          </p>
        </div>
      </div>
    </div>
  );
};
