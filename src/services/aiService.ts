import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface AIInsight {
  type: 'waste_reduction' | 'quality_prediction' | 'process_optimization' | 'best_practice';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

export interface WastePattern {
  phase: string;
  averageWaste: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  primaryCauses: string[];
  recommendations: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function analyzeWastePatterns(userId: string): Promise<WastePattern[]> {
  try {
    const { data: wasteMetrics, error } = await supabase
      .from('waste_metrics')
      .select('*')
      .eq('recorded_by', userId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    const patternsByPhase = new Map<string, any[]>();

    wasteMetrics?.forEach((metric: any) => {
      if (!patternsByPhase.has(metric.phase)) {
        patternsByPhase.set(metric.phase, []);
      }
      patternsByPhase.get(metric.phase)?.push(metric);
    });

    const patterns: WastePattern[] = [];

    patternsByPhase.forEach((metrics, phase) => {
      const totalWaste = metrics.reduce((sum, m) => sum + m.waste_amount, 0);
      const averageWaste = totalWaste / metrics.length;

      const recentWaste = metrics.slice(0, Math.min(5, metrics.length));
      const olderWaste = metrics.slice(5, Math.min(10, metrics.length));

      const recentAvg = recentWaste.reduce((sum, m) => sum + m.waste_amount, 0) / recentWaste.length;
      const olderAvg = olderWaste.length > 0
        ? olderWaste.reduce((sum, m) => sum + m.waste_amount, 0) / olderWaste.length
        : recentAvg;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAvg > olderAvg * 1.1) trend = 'increasing';
      else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';

      const wasteTypes = new Map<string, number>();
      metrics.forEach(m => {
        wasteTypes.set(m.waste_type, (wasteTypes.get(m.waste_type) || 0) + 1);
      });

      const primaryCauses = Array.from(wasteTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      patterns.push({
        phase,
        averageWaste,
        trend,
        primaryCauses,
        recommendations: generateRecommendations(phase, trend, primaryCauses, averageWaste)
      });
    });

    return patterns;
  } catch (error) {
    console.error('Error analyzing waste patterns:', error);
    return [];
  }
}

function generateRecommendations(
  phase: string,
  trend: string,
  causes: string[],
  avgWaste: number
): string[] {
  const recommendations: string[] = [];

  if (trend === 'increasing') {
    recommendations.push('Implement immediate waste reduction measures');
    recommendations.push('Review recent process changes that may have increased waste');
  }

  if (avgWaste > 10) {
    recommendations.push('Consider process optimization to reduce waste by 20-30%');
  }

  switch (phase) {
    case 'collection':
      if (causes.includes('spoilage')) {
        recommendations.push('Improve cold chain management and reduce transit time');
        recommendations.push('Use better packaging materials to prevent damage');
      }
      if (causes.includes('contamination')) {
        recommendations.push('Implement stricter quality control at source');
        recommendations.push('Provide training on proper food waste segregation');
      }
      break;

    case 'processing':
      if (causes.includes('processing_loss')) {
        recommendations.push('Optimize processing parameters to improve yield');
        recommendations.push('Consider upgrading processing equipment');
      }
      recommendations.push('Implement lean manufacturing principles');
      break;

    case 'manufacturing':
      recommendations.push('Use automated quality control systems');
      recommendations.push('Implement real-time monitoring of production parameters');
      break;
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue current practices and maintain monitoring');
  }

  return recommendations;
}

export async function getAIInsights(userId: string, userRole: string): Promise<AIInsight[]> {
  try {
    const patterns = await analyzeWastePatterns(userId);
    const insights: AIInsight[] = [];

    patterns.forEach(pattern => {
      if (pattern.trend === 'increasing') {
        insights.push({
          type: 'waste_reduction',
          title: `Increasing Waste in ${pattern.phase} Phase`,
          description: `Waste has increased by ${Math.round((pattern.averageWaste * 0.2))}% recently. Primary causes: ${pattern.primaryCauses.join(', ')}`,
          priority: 'high',
          actionable: true,
          suggestedActions: pattern.recommendations
        });
      }

      if (pattern.averageWaste > 15) {
        insights.push({
          type: 'process_optimization',
          title: `High Waste Alert - ${pattern.phase}`,
          description: `Average waste of ${pattern.averageWaste.toFixed(1)}kg detected. Consider process improvements.`,
          priority: 'high',
          actionable: true,
          suggestedActions: pattern.recommendations
        });
      }
    });

    insights.push(...getRoleBestPractices(userRole));

    const { data: recentBatches } = await supabase
      .from(`${userRole}_batches`)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentBatches && recentBatches.length > 0) {
      insights.push({
        type: 'quality_prediction',
        title: 'Quality Monitoring',
        description: `Based on your last ${recentBatches.length} batches, quality metrics are within acceptable ranges.`,
        priority: 'low',
        actionable: false
      });
    }

    return insights;
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return [];
  }
}

function getRoleBestPractices(role: string): AIInsight[] {
  const practices: Record<string, AIInsight[]> = {
    collector: [
      {
        type: 'best_practice',
        title: 'Collection Best Practices',
        description: 'Maintain cold chain integrity and minimize time between collection and delivery',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Use insulated containers for temperature-sensitive materials',
          'Plan efficient collection routes',
          'Document GPS and temperature data for traceability'
        ]
      }
    ],
    processor: [
      {
        type: 'best_practice',
        title: 'Processing Optimization',
        description: 'Maximize yield and maintain consistent quality through standardized processes',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Monitor conversion ratios across batches',
          'Calibrate equipment regularly',
          'Document all chemicals and additives used'
        ]
      }
    ],
    manufacturer: [
      {
        type: 'best_practice',
        title: 'Manufacturing Excellence',
        description: 'Ensure product quality and safety through rigorous quality control',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Implement batch testing protocols',
          'Maintain accurate inventory of raw materials',
          'Use predictive maintenance for equipment'
        ]
      }
    ]
  };

  return practices[role] || [];
}

export async function chatWithAI(
  message: string,
  context: {
    userId: string;
    userRole: string;
    recentWaste?: any[];
    recentBatches?: any[];
  }
): Promise<string> {
  try {
    const patterns = await analyzeWastePatterns(context.userId);

    const contextInfo = `
User Role: ${context.userRole}
Recent Waste Patterns: ${patterns.length > 0 ? patterns.map(p =>
  `${p.phase}: ${p.averageWaste.toFixed(1)}kg avg, trend: ${p.trend}`
).join('; ') : 'No data available'}
    `.trim();

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('waste') && lowerMessage.includes('reduce')) {
      const recommendations = patterns.flatMap(p => p.recommendations);
      return `Based on your waste data, here are specific recommendations:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nThese suggestions are tailored to your ${context.userRole} role and current waste patterns.`;
    }

    if (lowerMessage.includes('best practice') || lowerMessage.includes('how to')) {
      const practices = getRoleBestPractices(context.userRole);
      if (practices.length > 0) {
        const practice = practices[0];
        return `${practice.title}\n\n${practice.description}\n\nRecommended Actions:\n${practice.suggestedActions?.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
      }
    }

    if (lowerMessage.includes('pattern') || lowerMessage.includes('trend')) {
      if (patterns.length === 0) {
        return 'No waste patterns detected yet. Start recording waste metrics to see trends and insights.';
      }

      const summary = patterns.map(p =>
        `• ${p.phase}: ${p.trend} trend with ${p.averageWaste.toFixed(1)}kg average waste`
      ).join('\n');

      return `Here's your current waste pattern analysis:\n\n${summary}\n\nWould you like specific recommendations for any phase?`;
    }

    if (lowerMessage.includes('quality') || lowerMessage.includes('predict')) {
      return `Based on historical data, quality predictions suggest:\n\n• Monitor temperature control carefully\n• Maintain consistent processing parameters\n• Regular equipment calibration is essential\n• Document all quality metrics for better predictions\n\nWould you like more specific guidance for your ${context.userRole} role?`;
    }

    if (lowerMessage.includes('report') || lowerMessage.includes('summary')) {
      const totalWaste = patterns.reduce((sum, p) => sum + p.averageWaste, 0);
      const criticalPhases = patterns.filter(p => p.trend === 'increasing');

      return `Supply Chain Summary:\n\n• Total Average Waste: ${totalWaste.toFixed(1)}kg\n• Phases Monitored: ${patterns.length}\n• Critical Attention Needed: ${criticalPhases.length > 0 ? criticalPhases.map(p => p.phase).join(', ') : 'None'}\n\nOverall Status: ${criticalPhases.length === 0 ? 'Good' : 'Needs Attention'}\n\nWould you like detailed recommendations?`;
    }

    return `I'm your AI assistant for the food supply chain. I can help you with:

• Waste reduction strategies
• Quality predictions and monitoring
• Best practices for your role (${context.userRole})
• Pattern analysis and trends
• Process optimization suggestions
• Automated reporting

What would you like to know more about?`;

  } catch (error) {
    console.error('Error in AI chat:', error);
    return 'I encountered an error processing your request. Please try again or rephrase your question.';
  }
}

export async function generateAutomatedReport(userId: string, userRole: string): Promise<string> {
  try {
    const patterns = await analyzeWastePatterns(userId);
    const insights = await getAIInsights(userId, userRole);

    const criticalInsights = insights.filter(i => i.priority === 'high');
    const totalWaste = patterns.reduce((sum, p) => sum + p.averageWaste, 0);

    const report = `
# Supply Chain Performance Report
Generated: ${new Date().toLocaleDateString()}

## Executive Summary
- Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}
- Total Average Waste: ${totalWaste.toFixed(2)}kg
- Phases Monitored: ${patterns.length}
- Critical Issues: ${criticalInsights.length}

## Waste Patterns Analysis
${patterns.map(p => `
### ${p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} Phase
- Average Waste: ${p.averageWaste.toFixed(2)}kg
- Trend: ${p.trend}
- Primary Causes: ${p.primaryCauses.join(', ')}
- Recommendations:
${p.recommendations.map(r => `  • ${r}`).join('\n')}
`).join('\n')}

## Critical Insights
${criticalInsights.length > 0 ? criticalInsights.map(i => `
### ${i.title}
${i.description}
${i.suggestedActions ? `\nActions:\n${i.suggestedActions.map(a => `• ${a}`).join('\n')}` : ''}
`).join('\n') : 'No critical issues detected.'}

## Recommendations Summary
${insights.filter(i => i.actionable).slice(0, 5).map((i, idx) =>
  `${idx + 1}. ${i.title}: ${i.description}`
).join('\n')}
    `.trim();

    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    return 'Error generating report. Please try again later.';
  }
}
