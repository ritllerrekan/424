import { Package, Shield, Scan, TrendingUp, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-emerald-900">FoodTrace</span>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-emerald-900 mb-6 leading-tight">
            Decentralized Food Supply Chain Tracing
          </h1>
          <p className="text-xl text-emerald-700 mb-10 leading-relaxed">
            Track every step of your food journey from collection to manufacturing with blockchain-powered transparency and accountability
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Get Started
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
              <Package className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-3">Collection Phase</h3>
            <p className="text-emerald-700 leading-relaxed">
              Track raw materials from source with precise location and quality metrics
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-5">
              <Scan className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-3">Testing Phase</h3>
            <p className="text-emerald-700 leading-relaxed">
              Laboratory testing for contamination, pathogens, and quality assurance
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-5">
              <Shield className="w-7 h-7 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-3">Processing Phase</h3>
            <p className="text-emerald-700 leading-relaxed">
              Monitor processing conditions, temperature, and handling procedures
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
              <TrendingUp className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-3">Manufacturing</h3>
            <p className="text-emerald-700 leading-relaxed">
              Final production tracking with waste management metrics and analytics
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-600 to-teal-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Why Choose FoodTrace?
            </h2>
            <div className="space-y-4 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h4 className="text-xl font-semibold text-white mb-2">Blockchain Security</h4>
                <p className="text-emerald-50">
                  Immutable records stored on blockchain ensure data integrity and transparency
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h4 className="text-xl font-semibold text-white mb-2">Real-Time Tracking</h4>
                <p className="text-emerald-50">
                  Monitor batches across all phases with live updates and notifications
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h4 className="text-xl font-semibold text-white mb-2">Waste Management Analytics</h4>
                <p className="text-emerald-50">
                  Reduce waste and costs with AI-powered insights and recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-emerald-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="w-6 h-6 text-emerald-600" />
            <span className="text-lg font-semibold text-emerald-900">FoodTrace</span>
          </div>
          <p className="text-emerald-600">
            Decentralized Food Supply Chain Management System
          </p>
        </div>
      </footer>
    </div>
  );
};
