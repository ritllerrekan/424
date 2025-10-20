import { useState } from 'react';
import { Web3AuthProvider, useWeb3Auth } from './contexts/Web3AuthContext';
import { LandingPage } from './pages/LandingPage';
import { Web3LoginPage } from './pages/Web3LoginPage';
import { Dashboard } from './pages/Dashboard';

function AppContent() {
  const { userProfile, loading } = useWeb3Auth();
  const [showLogin, setShowLogin] = useState(false);

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
    return <Web3LoginPage onBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onGetStarted={() => setShowLogin(true)} />;
}

function App() {
  return (
    <Web3AuthProvider>
      <AppContent />
    </Web3AuthProvider>
  );
}

export default App;
