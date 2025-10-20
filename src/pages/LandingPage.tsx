import { Package, Shield, Users, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-800">FoodTrace</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Transparent Food Supply Chain
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track your food from farm to table with blockchain technology. Ensure quality, safety, and trust at every step.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-emerald-600 text-white text-lg rounded-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Tracking Now
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Package className="w-12 h-12 text-emerald-600" />}
            title="Full Traceability"
            description="Track every step from collection to manufacturing with immutable blockchain records."
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-emerald-600" />}
            title="Quality Assurance"
            description="Comprehensive testing and quality checks at every stage of the supply chain."
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-emerald-600" />}
            title="Multi-Stakeholder"
            description="Connect collectors, testers, processors, and manufacturers in one platform."
          />
          <FeatureCard
            icon={<TrendingUp className="w-12 h-12 text-emerald-600" />}
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
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
