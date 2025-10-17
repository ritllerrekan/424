import { useAuth } from '../../contexts/AuthContext';
import CollectorDashboard from './CollectorDashboard';

export const RoleDashboard = () => {
  const { userProfile } = useAuth();

  if (userProfile?.role === 'collector') {
    return <CollectorDashboard />;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-emerald-600">Dashboard for {userProfile?.role || 'user'} role coming soon...</div>
    </div>
  );
};
