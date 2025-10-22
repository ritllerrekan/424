import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { getAIInsights, AIInsight } from '../services/aiService';
import { GlassCard, GlassButton } from './glass';

interface Props {
  userId: string;
  userRole: string;
  onOpenChat: () => void;
}

export function AIInsightsWidget({ userId, userRole, onOpenChat }: Props) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    loadInsights();
  }, [userId, userRole]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const data = await getAIInsights(userId, userRole);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'from-red-500/20 to-orange-500/20 border-red-400/20';
      case 'medium':
        return 'from-amber-500/20 to-yellow-500/20 border-amber-400/20';
      case 'low':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-400/20';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-400/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'medium':
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      waste_reduction: 'Waste Reduction',
      quality_prediction: 'Quality Prediction',
      process_optimization: 'Process Optimization',
      best_practice: 'Best Practice'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
          <p className="text-white/60 mt-3 text-sm">Loading AI insights...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Lightbulb className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Insights</h3>
            <p className="text-sm text-white/60">Personalized recommendations</p>
          </div>
        </div>
        <GlassButton onClick={onOpenChat} variant="accent" size="sm">
          Ask AI
        </GlassButton>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 text-sm">
            No insights available yet. Continue recording data to get AI-powered recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.slice(0, 5).map((insight, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${getPriorityColor(insight.priority)} border rounded-xl overflow-hidden transition-all animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
                className="w-full p-4 text-left hover:bg-white/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(insight.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
                      <span className="flex-shrink-0 px-2 py-1 bg-white/10 rounded-full text-xs text-white/80 capitalize">
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mb-2">{insight.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">{getTypeLabel(insight.type)}</span>
                      {insight.actionable && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
                          Actionable
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform ${
                      expandedInsight === index ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedInsight === index && insight.suggestedActions && (
                <div className="px-4 pb-4 pt-0 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/70 mb-2 mt-3">Suggested Actions:</p>
                  <div className="space-y-2">
                    {insight.suggestedActions.map((action, actionIdx) => (
                      <div
                        key={actionIdx}
                        className="flex items-start gap-2 p-2 bg-white/5 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 text-xs font-bold mt-0.5">
                          {actionIdx + 1}
                        </div>
                        <p className="text-sm text-white/80">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {insights.length > 5 && (
            <button
              onClick={onOpenChat}
              className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 text-sm transition-all flex items-center justify-center gap-2"
            >
              View All {insights.length} Insights
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-white/10">
        <p className="text-xs text-white/50 text-center">
          AI-powered insights update automatically based on your activity
        </p>
      </div>
    </GlassCard>
  );
}
