import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';

function App() {
  const [showLanding, setShowLanding] = useState(true);

  // Simple fallback - just show landing page
  if (showLanding) {
    return <LandingPage onGetStarted={() => alert('Authentication is being configured. Please wait...')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading application...</div>
    </div>
  );
}

export default App;
