import { useState } from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { Package, ArrowLeft } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/glass';

interface LoginPageProps {
  onBack: () => void;
}

export function LoginPage({ onBack }: LoginPageProps) {
  const { login, updateUserProfile, userProfile, walletAddress } = useWeb3Auth();
  const [loading, setLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    organization: '',
    contact: '',
  });

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
      setShowProfileForm(true);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(
        formData.fullName,
        formData.role,
        formData.organization,
        formData.contact
      );
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showProfileForm || (userProfile && !userProfile.organization)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

        <GlassCard className="max-w-md w-full relative z-10 animate-scale-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Package className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-2xl font-bold text-white">FoodTrace</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
          <p className="text-white/70 mb-8">Tell us about your organization</p>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <GlassInput
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="Enter your full name"
            />

            <GlassSelect
              label="Role in Supply Chain"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: '', label: 'Select a role' },
                { value: 'collector', label: 'Collector' },
                { value: 'tester', label: 'Tester' },
                { value: 'processor', label: 'Processor' },
                { value: 'manufacturer', label: 'Manufacturer' },
              ]}
              required
            />

            <GlassInput
              label="Organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              required
              placeholder="Enter your organization name"
            />

            <GlassInput
              label="Contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
              placeholder="Enter your contact information"
            />

            <GlassButton
              type="submit"
              variant="accent"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      <GlassCard className="max-w-md w-full relative z-10 animate-scale-in">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Package className="w-6 h-6 text-emerald-300" />
          </div>
          <span className="text-2xl font-bold text-white">FoodTrace</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-white/70 mb-8">Connect your wallet to continue</p>

        <GlassButton
          onClick={handleLogin}
          disabled={loading}
          variant="accent"
          fullWidth
        >
          {loading ? 'Connecting...' : 'Connect with Web3Auth'}
        </GlassButton>

        <p className="text-sm text-white/50 mt-6 text-center">
          First time here? Connect to create your account
        </p>
      </GlassCard>
    </div>
  );
}
