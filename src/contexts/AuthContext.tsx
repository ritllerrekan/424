import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '../lib/supabase';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const MOCK_USERS: User[] = [
  {
    id: 'collector-001',
    email: 'collector@foodtrace.com',
    full_name: 'John Collector',
    role: 'collector',
    organization: 'FreshFarms Co.',
    phone: '+1-555-0101',
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tester-001',
    email: 'tester@foodtrace.com',
    full_name: 'Sarah Tester',
    role: 'tester',
    organization: 'Quality Labs Inc.',
    phone: '+1-555-0102',
    wallet_address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'processor-001',
    email: 'processor@foodtrace.com',
    full_name: 'Mike Processor',
    role: 'processor',
    organization: 'ProcessPro Solutions',
    phone: '+1-555-0103',
    wallet_address: '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'manufacturer-001',
    email: 'manufacturer@foodtrace.com',
    full_name: 'Emily Manufacturer',
    role: 'manufacturer',
    organization: 'FoodCorp Manufacturing',
    phone: '+1-555-0104',
    wallet_address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      const profile = JSON.parse(storedUser);
      setUserProfile(profile);
      setUser({ id: profile.id, email: profile.email } as SupabaseUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    throw new Error('Sign up is disabled in mock mode. Please use one of the demo accounts.');
  };

  const signIn = async (email: string, password: string) => {
    const mockUser = MOCK_USERS.find(u => u.email === email);

    if (!mockUser) {
      throw new Error('Invalid credentials. Use: collector@foodtrace.com, tester@foodtrace.com, processor@foodtrace.com, or manufacturer@foodtrace.com');
    }

    setUserProfile(mockUser);
    setUser({ id: mockUser.id, email: mockUser.email } as SupabaseUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('mockUser');
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
