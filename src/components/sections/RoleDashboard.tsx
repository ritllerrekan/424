import { useAuth } from '../../contexts/AuthContext';
import CollectorDashboard from './CollectorDashboard';
import TesterDashboard from './TesterDashboard';

export const RoleDashboard = () => {
  const { userProfile } = useAuth();

  if (userProfile?.role === 'collector') {
    return <CollectorDashboard />;
  }

  if (userProfile?.role === 'tester') {
    return <TesterDashboard />;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-emerald-600">Dashboard for {userProfile?.role || 'user'} role coming soon...</div>
    </div>
  );
};
