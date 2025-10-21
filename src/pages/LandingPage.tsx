import { Package, Shield, Users, TrendingUp } from 'lucide-react';
import { GlassCard, GlassButton } from '../components/glass';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      <nav className="container mx-auto px-6 py-6 relative z-10">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-4 shadow-glass animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Package className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-2xl font-bold text-white">FoodTrace</span>
            </div>
            <GlassButton variant="accent" onClick={onGetStarted}>
              Get Started
            </GlassButton>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Transparent Food
            <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Supply Chain
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Track your food from farm to table with blockchain technology. Ensure quality, safety, and trust at every step.
          </p>
          <GlassButton variant="accent" size="lg" onClick={onGetStarted}>
            Start Tracking Now
          </GlassButton>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Package className="w-10 h-10" />}
            title="Full Traceability"
            description="Track every step from collection to manufacturing with immutable blockchain records."
          />
          <FeatureCard
            icon={<Shield className="w-10 h-10" />}
            title="Quality Assurance"
            description="Comprehensive testing and quality checks at every stage of the supply chain."
          />
          <FeatureCard
            icon={<Users className="w-10 h-10" />}
            title="Multi-Stakeholder"
            description="Connect collectors, testers, processors, and manufacturers in one platform."
          />
          <FeatureCard
            icon={<TrendingUp className="w-10 h-10" />}
            title="Analytics"
            description="Real-time insights and analytics to optimize your supply chain operations."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <GlassCard hover className="group">
      <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </GlassCard>
  );
}
