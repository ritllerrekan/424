import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, IProvider } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { ethers } from 'ethers';
import { User, UserRole } from '../lib/supabase';

interface Web3AuthContextType {
  provider: IProvider | null;
  user: any | null;
  userProfile: User | null;
  walletAddress: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fullName: string, role: UserRole, organization?: string, phone?: string) => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  }
  return context;
};

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882",
  rpcTarget: "https://rpc-amoy.polygon.technology/",
  displayName: "Polygon Amoy Testnet",
  blockExplorerUrl: "https://amoy.polygonscan.com/",
  ticker: "MATIC",
  tickerName: "Polygon",
  logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
};

export const Web3AuthProvider = ({ children }: { children: ReactNode }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
          uiConfig: {
            appName: "FoodTrace",
            theme: {
              primary: "#059669",
            },
            mode: "light",
            logoLight: "https://web3auth.io/images/web3authlog.png",
            logoDark: "https://web3auth.io/images/web3authlogodark.png",
            defaultLanguage: "en",
            loginGridCol: 3,
            primaryButton: "socialLogin",
          },
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected && web3authInstance.provider) {
          await handleProviderConnection(web3authInstance.provider);
        } else {
          const sessionData = getSessionFromStorage();
          if (sessionData) {
            setUser(sessionData.user);
            setUserProfile(sessionData.userProfile);
            setWalletAddress(sessionData.walletAddress);
          }
        }
      } catch (error) {
        console.error('Web3Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleProviderConnection = async (web3Provider: IProvider) => {
    setProvider(web3Provider);

    const ethersProvider = new ethers.BrowserProvider(web3Provider as any);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();
    setWalletAddress(address);

    if (web3auth) {
      const userInfo = await web3auth.getUserInfo();
      setUser(userInfo);

      const storedProfile = getProfileFromStorage(address);
      if (storedProfile) {
        setUserProfile(storedProfile);
      } else {
        const defaultProfile: User = {
          id: address,
          email: userInfo.email || `${address.substring(0, 8)}@web3auth.local`,
          full_name: userInfo.name || 'Anonymous User',
          role: 'collector',
          organization: '',
          phone: '',
          wallet_address: address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUserProfile(defaultProfile);
        saveProfileToStorage(address, defaultProfile);
      }

      saveSessionToStorage({
        user: userInfo,
        userProfile: storedProfile || userProfile,
        walletAddress: address,
      });
    }
  };

  const login = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth not initialized');
    }

    try {
      const web3authProvider = await web3auth.connect();
      if (web3authProvider) {
        await handleProviderConnection(web3authProvider);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth not initialized');
    }

    try {
      await web3auth.logout();
      setProvider(null);
      setUser(null);
      setUserProfile(null);
      setWalletAddress(null);
      clearSessionFromStorage();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (
    fullName: string,
    role: UserRole,
    organization?: string,
    phone?: string
  ) => {
    if (!userProfile || !walletAddress) {
      throw new Error('User not authenticated');
    }

    const updatedProfile: User = {
      ...userProfile,
      full_name: fullName,
      role,
      organization: organization || userProfile.organization,
      phone: phone || userProfile.phone,
      updated_at: new Date().toISOString(),
    };

    setUserProfile(updatedProfile);
    saveProfileToStorage(walletAddress, updatedProfile);

    const sessionData = getSessionFromStorage();
    if (sessionData) {
      saveSessionToStorage({
        ...sessionData,
        userProfile: updatedProfile,
      });
    }
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
};

const STORAGE_KEY = 'web3auth_session';
const PROFILE_PREFIX = 'web3auth_profile_';

function saveSessionToStorage(data: {
  user: any;
  userProfile: User | null;
  walletAddress: string;
}) {
  try {
    const encrypted = btoa(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

function getSessionFromStorage() {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;
    return JSON.parse(atob(encrypted));
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

function clearSessionFromStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function saveProfileToStorage(address: string, profile: User) {
  try {
    localStorage.setItem(
      `${PROFILE_PREFIX}${address.toLowerCase()}`,
      JSON.stringify(profile)
    );
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

function getProfileFromStorage(address: string): User | null {
  try {
    const stored = localStorage.getItem(
      `${PROFILE_PREFIX}${address.toLowerCase()}`
    );
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading profile:', error);
    return null;
  }
}
