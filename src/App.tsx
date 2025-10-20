import { useState, useEffect } from 'react';
import { Web3AuthProvider, useWeb3Auth } from './contexts/Web3AuthContext';
import { BiconomyProvider } from './contexts/BiconomyContext';
import { AppStateProvider } from './contexts/AppStateContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { PublicBatchTracker } from './pages/PublicBatchTracker';

function AppContent() {
  const { userProfile, loading } = useWeb3Auth();
  const [showLogin, setShowLogin] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    setIsPublicRoute(path === '/track' || path.startsWith('/track/'));
  }, []);

  if (isPublicRoute) {
    return <PublicBatchTracker />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-emerald-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (userProfile && userProfile.organization) {
    return <Dashboard />;
  }

  if (showLogin || (userProfile && !userProfile.organization)) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onGetStarted={() => setShowLogin(true)} />;
}

function App() {
  return (
    <AppStateProvider>
      <Web3AuthProvider>
        <BiconomyProvider>
          <AppContent />
        </BiconomyProvider>
      </Web3AuthProvider>
    </AppStateProvider>
  );
}

export default App;
