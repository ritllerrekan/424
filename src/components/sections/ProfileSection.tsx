import { useState } from 'react';
import { User, Mail, Building, Phone, Wallet, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const ProfileSection = () => {
  const { userProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [organization, setOrganization] = useState(userProfile?.organization || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [walletAddress, setWalletAddress] = useState(userProfile?.wallet_address || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
            <div className="inline-flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
              {userProfile.role}
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
