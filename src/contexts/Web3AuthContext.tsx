import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

interface UserProfile {
  wallet_address: string;
  full_name?: string;
  role?: 'collector' | 'tester' | 'processor' | 'manufacturer';
  organization?: string;
  contact?: string;
}

interface Web3AuthContextType {
  provider: IProvider | null;
  user: any;
  userProfile: UserProfile | null;
  walletAddress: string;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fullName: string, role: string, organization: string, contact: string) => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

const clientId = 'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ';

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x13882',
  rpcTarget: 'https://rpc-amoy.polygon.technology/',
  displayName: 'Polygon Amoy Testnet',
  blockExplorerUrl: 'https://amoy.polygonscan.com/',
  ticker: 'MATIC',
  tickerName: 'MATIC',
  logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
};

export function Web3AuthProvider({ children }: { children: ReactNode }) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: 'sapphire_devnet',
          privateKeyProvider,
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected) {
          setProvider(web3authInstance.provider);
          const userInfo = await web3authInstance.getUserInfo();
          setUser(userInfo);

          const accounts = await web3authInstance.provider?.request<string[]>({
            method: 'eth_accounts',
          });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            loadUserProfile(accounts[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing Web3Auth:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadUserProfile = (address: string) => {
    const stored = localStorage.getItem(`profile_${address}`);
    if (stored) {
      setUserProfile(JSON.parse(stored));
    } else {
      setUserProfile({ wallet_address: address });
    }
  };

  const login = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth not initialized');
    }

    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);

      const userInfo = await web3auth.getUserInfo();
      setUser(userInfo);

      const accounts = await web3authProvider?.request<string[]>({
        method: 'eth_accounts',
      });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        loadUserProfile(accounts[0]);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!web3auth) {
      return;
    }

    try {
      await web3auth.logout();
      setProvider(null);
      setUser(null);
      setUserProfile(null);
      setWalletAddress('');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (fullName: string, role: string, organization: string, contact: string) => {
    if (!walletAddress) {
      throw new Error('No wallet connected');
    }

    const profile: UserProfile = {
      wallet_address: walletAddress,
      full_name: fullName,
      role: role as UserProfile['role'],
      organization,
      contact,
    };

    localStorage.setItem(`profile_${walletAddress}`, JSON.stringify(profile));
    setUserProfile(profile);
  };

  return (
    <Web3AuthContext.Provider
      value={{
        provider,
        user,
        userProfile,
        walletAddress,
        loading,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
}
