import { Clock } from 'lucide-react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';

export function SessionTimer() {
  const { minutesUntilExpiry } = useWeb3Auth();

  if (minutesUntilExpiry === null) {
    return null;
  }

  const isWarning = minutesUntilExpiry <= 5;
  const isCritical = minutesUntilExpiry <= 2;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm transition-all ${
        isCritical
          ? 'bg-red-500/20 border-red-500/40 text-red-200'
          : isWarning
          ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200'
          : 'bg-white/5 border-white/10 text-white/70'
      }`}
      title={`Session expires in ${minutesUntilExpiry} minutes`}
    >
      <Clock className={`w-4 h-4 ${isCritical || isWarning ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-medium">
        {minutesUntilExpiry}m
      </span>
    </div>
  );
}
