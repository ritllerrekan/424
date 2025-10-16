import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ProfileSection } from '../components/sections/ProfileSection';
import { RoleDashboard } from '../components/sections/RoleDashboard';
import { ActiveBatches } from '../components/sections/ActiveBatches';
import { CompletedBatches } from '../components/sections/CompletedBatches';
import { AIAssistant } from '../components/sections/AIAssistant';
import { WasteMetrics } from '../components/sections/WasteMetrics';
import { TransactionHistory } from '../components/sections/TransactionHistory';

export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'role-dashboard':
        return <RoleDashboard />;
      case 'active-batches':
        return <ActiveBatches />;
      case 'completed-batches':
        return <CompletedBatches />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'waste-metrics':
        return <WasteMetrics />;
      case 'transactions':
        return <TransactionHistory />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="flex h-screen bg-emerald-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};
