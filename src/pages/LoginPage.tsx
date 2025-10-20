import { useState, useEffect } from 'react';
import { Package, Mail, Check, User, Building, Phone, Wallet, Loader2 } from 'lucide-react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { UserRole } from '../lib/supabase';

interface LoginPageProps {
  onBack: () => void;
}

export const LoginPage = ({ onBack }: LoginPageProps) => {
  const { login, userProfile, walletAddress, loading: web3Loading, updateUserProfile } = useWeb3Auth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [walletCreationStep, setWalletCreationStep] = useState<'idle' | 'connecting' | 'creating' | 'complete'>('idle');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('collector');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (userProfile && !userProfile.organization) {
      setShowProfileSetup(true);
      setFullName(userProfile.full_name || '');
      setRole(userProfile.role || 'collector');
    }
  }, [userProfile]);

  const handleLogin = async () => {
    if (!termsAccepted) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    setError('');
    setWalletCreationStep('connecting');

    try {
      await login();
      setWalletCreationStep('creating');

      setTimeout(() => {
        setWalletCreationStep('complete');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setWalletCreationStep('idle');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateUserProfile(fullName, role, organization, phone);
      setShowProfileSetup(false);
      setWalletCreationStep('idle');
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
    } finally {
      setLoading(false);
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-emerald-900">Wallet Created</p>
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
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
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
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
          {walletCreationStep !== 'idle' && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-900">Connecting to Web3Auth</span>
                  {walletCreationStep === 'connecting' ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-900">Creating embedded wallet</span>
                  {walletCreationStep === 'creating' ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : walletCreationStep === 'complete' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-emerald-200 rounded-full" />
                  )}
                </div>

                {walletCreationStep === 'complete' && walletAddress && (
                  <div className="pt-2 mt-2 border-t border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-900 mb-1">Your Wallet Address</p>
                    <p className="text-xs text-emerald-700 font-mono break-all">{walletAddress}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Wallet className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 mb-1">
                    Web3 Authentication
                  </p>
                  <p className="text-xs text-emerald-700">
                    Sign in with email or social accounts. Your blockchain wallet is created automatically and secured.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                <Mail className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="text-xs font-medium text-emerald-900">Email Login</p>
                <p className="text-xs text-emerald-600">Passwordless</p>
              </div>
              <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <p className="text-xs font-medium text-emerald-900">Google</p>
                <p className="text-xs text-emerald-600">OAuth 2.0</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-emerald-700">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>No password required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>Wallet created automatically</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>Role assigned by email domain</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 border-2 border-emerald-300 rounded text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 transition-all cursor-pointer"
                />
              </div>
              <span className="text-sm text-emerald-700 leading-tight">
                I accept the{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={web3Loading || walletCreationStep === 'connecting' || walletCreationStep === 'creating'}
            className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg shadow-emerald-200"
          >
            <Wallet className="w-5 h-5" />
            <span>
              {web3Loading ? 'Initializing...' : walletCreationStep === 'connecting' ? 'Connecting...' : walletCreationStep === 'creating' ? 'Creating Wallet...' : 'Sign In with Web3Auth'}
            </span>
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
