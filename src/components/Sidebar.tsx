import { User, Package, CheckCircle, Bot, Trash2, Receipt, LogOut, Zap } from 'lucide-react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const { logout, userProfile } = useWeb3Auth();

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'smart-account', label: 'Smart Account', icon: Zap },
    { id: 'role-dashboard', label: getRoleLabel(userProfile?.role), icon: Package },
    { id: 'active-batches', label: 'Active Batches', icon: Package },
    { id: 'completed-batches', label: 'Completed Batches', icon: CheckCircle },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'waste-metrics', label: 'Waste Management', icon: Trash2 },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
  ];

  function getRoleLabel(role?: string) {
    switch (role) {
      case 'collector': return 'Collector Dashboard';
      case 'tester': return 'Tester Dashboard';
      case 'processor': return 'Processor Dashboard';
      case 'manufacturer': return 'Manufacturer Dashboard';
      default: return 'Dashboard';
    }
  }

  return (
    <aside className="w-72 bg-white border-r border-emerald-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-emerald-100">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="w-8 h-8 text-emerald-600" />
          <span className="text-xl font-bold text-emerald-900">FoodTrace</span>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <p className="text-sm text-emerald-700 font-medium">{userProfile?.full_name}</p>
          <p className="text-xs text-emerald-600 mt-1">{userProfile?.email}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            {userProfile?.role}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-emerald-100">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
