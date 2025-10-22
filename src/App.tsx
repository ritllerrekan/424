import { useState, useEffect } from 'react';
import { Web3AuthProvider, useWeb3Auth } from './contexts/Web3AuthContext';
import { BiconomyProvider } from './contexts/BiconomyContext';
import { AppStateProvider } from './contexts/AppStateContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { PublicBatchTracker } from './pages/PublicBatchTracker';
import { QRCodeManagement } from './pages/QRCodeManagement';

function AppContent() {
  const { userProfile, loading } = useWeb3Auth();
  const [showLogin, setShowLogin] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'qr'>('dashboard');

  useEffect(() => {
    const path = window.location.pathname;
    setIsPublicRoute(path === '/track' || path.startsWith('/track/') || path.startsWith('/verify/'));

    if (path === '/qr' || path.startsWith('/qr')) {
      setCurrentRoute('qr');
    } else {
      setCurrentRoute('dashboard');
    }
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
    if (currentRoute === 'qr') {
      return <QRCodeManagement />;
    }
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
        <NotificationProvider>
          <BiconomyProvider>
            <AppContent />
          </BiconomyProvider>
        </NotificationProvider>
      </Web3AuthProvider>
    </AppStateProvider>
  );
}

export default App;
