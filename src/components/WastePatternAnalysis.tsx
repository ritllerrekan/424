import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeWastePatterns, WastePattern } from '../services/aiService';
import { GlassCard } from './glass';

interface Props {
  userId: string;
}

export function WastePatternAnalysis({ userId }: Props) {
  const [patterns, setPatterns] = useState<WastePattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, [userId]);

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const data = await analyzeWastePatterns(userId);
      setPatterns(data);
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-red-400" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-emerald-400" />;
      default:
        return <Minus className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'from-red-500/20 to-orange-500/20 border-red-400/20';
      case 'decreasing':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-400/20';
      default:
        return 'from-blue-500/20 to-cyan-500/20 border-blue-400/20';
    }
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/60 mt-4">Analyzing waste patterns...</p>
        </div>
      </GlassCard>
    );
  }

  if (patterns.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Pattern Data</h3>
          <p className="text-white/60">
            Start recording waste metrics to see pattern analysis and AI-powered insights.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Waste Pattern Analysis</h2>
        <p className="text-white/70">
          Intelligent insights and recommendations based on your waste data
        </p>
      </div>

      <div className="grid gap-4">
        {patterns.map((pattern, index) => (
          <GlassCard
            key={index}
            className={`animate-slide-up bg-gradient-to-r ${getTrendColor(pattern.trend)} border`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    {getTrendIcon(pattern.trend)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white capitalize">
                      {pattern.phase} Phase
                    </h3>
                    <p className="text-sm text-white/70 capitalize">
                      Trend: {pattern.trend}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {pattern.averageWaste.toFixed(1)}
                    <span className="text-lg text-white/60 ml-1">kg</span>
                  </div>
                  <p className="text-xs text-white/60">Average Waste</p>
                </div>
              </div>

              {pattern.primaryCauses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2">Primary Causes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {pattern.primaryCauses.map((cause, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-white/90 backdrop-blur-sm"
                      >
                        {cause.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white/80">AI Recommendations:</h4>
                </div>
                <div className="space-y-2">
                  {pattern.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-white/90">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">How to Use These Insights</h4>
            <ul className="space-y-1 text-sm text-white/80">
              <li>• Review recommendations regularly to optimize your processes</li>
              <li>• Focus on phases with increasing trends first</li>
              <li>• Implement suggested actions and monitor the impact</li>
              <li>• Use the AI chat assistant for specific questions and guidance</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
