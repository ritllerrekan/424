import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import CollectorDashboard from './CollectorDashboard';
import TesterDashboard from './TesterDashboard';
import ProcessorDashboard from './ProcessorDashboard';
import ManufacturerDashboard from './ManufacturerDashboard';

export const RoleDashboard = () => {
  const { userProfile } = useWeb3Auth();

  if (userProfile?.role === 'collector') {
    return <CollectorDashboard />;
  }

  if (userProfile?.role === 'tester') {
    return <TesterDashboard />;
  }

  if (userProfile?.role === 'processor') {
    return <ProcessorDashboard />;
  }

  if (userProfile?.role === 'manufacturer') {
    return <ManufacturerDashboard />;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-emerald-600">Dashboard for {userProfile?.role || 'user'} role coming soon...</div>
    </div>
  );
};
