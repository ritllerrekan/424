import { useState, useEffect } from 'react';
import { User, Mail, Building, Phone, Wallet, Save, Star, Package, Award, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProfileStats {
  totalBatches: number;
  averageRating: number;
  totalRatings: number;
  completedBatches: number;
  activeBatches: number;
  joinedDate: string;
}

export const ProfileSection = () => {
  const { userProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [organization, setOrganization] = useState(userProfile?.organization || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [walletAddress, setWalletAddress] = useState(userProfile?.wallet_address || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<ProfileStats>({
    totalBatches: 0,
    averageRating: 0,
    totalRatings: 0,
    completedBatches: 0,
    activeBatches: 0,
    joinedDate: new Date().toISOString(),
  });

  useEffect(() => {
    if (userProfile) {
      loadProfileStats();
    }
  }, [userProfile]);

  const loadProfileStats = async () => {
    if (!userProfile) return;

    setStats({
      totalBatches: 0,
      averageRating: 0,
      totalRatings: 0,
      completedBatches: 0,
      activeBatches: 0,
      joinedDate: userProfile.created_at,
    });
  };

  const handleSave = async () => {
    if (!userProfile) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          organization,
          phone,
          wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setMessage('Profile updated successfully');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!userProfile) return null;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getNextRaterRole = () => {
    const roleFlow: Record<string, string> = {
      collector: 'Tester',
      tester: 'Processor',
      processor: 'Manufacturer',
      manufacturer: 'Distributor/Retailer',
    };
    return roleFlow[userProfile.role] || 'Next Stage';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-900">Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.totalBatches}</p>
          <p className="text-sm text-blue-700">Total Batches</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{stats.completedBatches}</p>
          <p className="text-sm text-emerald-700">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm border border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.activeBatches}</p>
          <p className="text-sm text-yellow-700">Active Batches</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
              {stats.averageRating.toFixed(1)}
            </p>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(stats.averageRating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-purple-700">{stats.totalRatings} Ratings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              <User className="inline w-4 h-4 mr-2" />
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <p className="text-emerald-700 py-2">{userProfile.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              <Mail className="inline w-4 h-4 mr-2" />
              Email Address
            </label>
            <p className="text-emerald-700 py-2">{userProfile.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              <Building className="inline w-4 h-4 mr-2" />
              Organization
            </label>
            {editing ? (
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Your organization name"
              />
            ) : (
              <p className="text-emerald-700 py-2">{userProfile.organization || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              <Phone className="inline w-4 h-4 mr-2" />
              Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+1 (555) 123-4567"
              />
            ) : (
              <p className="text-emerald-700 py-2">{userProfile.phone || 'Not set'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              <Wallet className="inline w-4 h-4 mr-2" />
              Blockchain Wallet Address
            </label>
            {editing ? (
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                placeholder="0x..."
              />
            ) : (
              <p className="text-emerald-700 py-2 font-mono text-sm break-all">
                {userProfile.wallet_address || 'Not set'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">Role</label>
            <div className="inline-flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium capitalize">
              {userProfile.role}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              Member Since
            </label>
            <p className="text-emerald-700 py-2">
              {new Date(stats.joinedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Star className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Rating Information</h3>
              <p className="text-sm text-blue-700">
                Your performance is rated by <span className="font-semibold">{getNextRaterRole()}</span> users in the supply chain.
                Maintain quality standards to improve your rating and build trust within the network.
              </p>
            </div>
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFullName(userProfile.full_name);
                setOrganization(userProfile.organization);
                setPhone(userProfile.phone);
                setWalletAddress(userProfile.wallet_address);
              }}
              className="px-6 py-2 border border-emerald-300 text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
