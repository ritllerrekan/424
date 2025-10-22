import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIRequest {
  action: 'chat' | 'analyze' | 'insights' | 'report';
  message?: string;
  userId: string;
  userRole: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: AIRequest = await req.json();
    const { action, message, userId, userRole } = requestData;

    let responseData: any;

    switch (action) {
      case 'chat':
        responseData = await handleChat(supabase, message || '', userId, userRole);
        break;
      case 'analyze':
        responseData = await analyzeWastePatterns(supabase, userId);
        break;
      case 'insights':
        responseData = await getInsights(supabase, userId, userRole);
        break;
      case 'report':
        responseData = await generateReport(supabase, userId, userRole);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error in AI assistant:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});

async function handleChat(supabase: any, message: string, userId: string, userRole: string): Promise<string> {
  const { data: wasteMetrics } = await supabase
    .from('waste_metrics')
    .select('*')
    .eq('recorded_by', userId)
    .order('recorded_at', { ascending: false })
    .limit(10);

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('waste') && lowerMessage.includes('reduce')) {
    return `Based on your recent data, here are waste reduction strategies:\n\n1. Optimize collection timing to reduce spoilage\n2. Improve cold chain management\n3. Implement better quality control at source\n4. Train staff on proper handling procedures\n\nThese recommendations are based on industry best practices and your role as ${userRole}.`;
  }

  if (lowerMessage.includes('pattern') || lowerMessage.includes('trend')) {
    const totalWaste = wasteMetrics?.reduce((sum: number, m: any) => sum + m.waste_amount, 0) || 0;
    const avgWaste = wasteMetrics?.length > 0 ? totalWaste / wasteMetrics.length : 0;
    return `Waste Pattern Analysis:\n\nTotal Waste Recorded: ${totalWaste.toFixed(2)}kg\nAverage per Entry: ${avgWaste.toFixed(2)}kg\nEntries Analyzed: ${wasteMetrics?.length || 0}\n\nRecommendation: ${avgWaste > 15 ? 'Focus on reducing waste through process optimization' : 'Continue current practices'}`;
  }

  if (lowerMessage.includes('best practice')) {
    const practices: Record<string, string> = {
      collector: 'Best Practices for Collectors:\n1. Maintain cold chain integrity\n2. Use proper containers\n3. Document GPS and temperature\n4. Minimize transit time',
      processor: 'Best Practices for Processors:\n1. Monitor conversion ratios\n2. Calibrate equipment regularly\n3. Document all additives\n4. Implement quality control',
      manufacturer: 'Best Practices for Manufacturers:\n1. Batch testing protocols\n2. Accurate inventory management\n3. Predictive maintenance\n4. Quality assurance systems'
    };
    return practices[userRole] || 'Please specify your role for tailored advice.';
  }

  return `I'm your AI assistant for supply chain optimization. I can help with:\n\n• Waste reduction strategies\n• Pattern analysis\n• Best practices for ${userRole}s\n• Quality predictions\n• Process optimization\n\nWhat would you like to know?`;
}

async function analyzeWastePatterns(supabase: any, userId: string) {
  const { data: wasteMetrics } = await supabase
    .from('waste_metrics')
    .select('*')
    .eq('recorded_by', userId)
    .order('recorded_at', { ascending: false });

  const patternsByPhase = new Map();
  
  wasteMetrics?.forEach((metric: any) => {
    if (!patternsByPhase.has(metric.phase)) {
      patternsByPhase.set(metric.phase, []);
    }
    patternsByPhase.get(metric.phase).push(metric);
  });

  const patterns: any[] = [];

  patternsByPhase.forEach((metrics: any[], phase: string) => {
    const totalWaste = metrics.reduce((sum, m) => sum + m.waste_amount, 0);
    const averageWaste = totalWaste / metrics.length;

    patterns.push({
      phase,
      averageWaste,
      trend: averageWaste > 15 ? 'increasing' : 'stable',
      recommendations: [
        'Implement process improvements',
        'Monitor quality metrics closely',
        'Train staff on best practices'
      ]
    });
  });

  return patterns;
}

async function getInsights(supabase: any, userId: string, userRole: string) {
  const patterns = await analyzeWastePatterns(supabase, userId);
  const insights: any[] = [];

  patterns.forEach((pattern: any) => {
    if (pattern.averageWaste > 15) {
      insights.push({
        type: 'waste_reduction',
        title: `High Waste in ${pattern.phase}`,
        description: `Average waste of ${pattern.averageWaste.toFixed(1)}kg detected`,
        priority: 'high',
        actionable: true,
        suggestedActions: pattern.recommendations
      });
    }
  });

  insights.push({
    type: 'best_practice',
    title: 'Best Practices',
    description: `Recommended practices for ${userRole}s`,
    priority: 'medium',
    actionable: true,
    suggestedActions: [
      'Document all processes',
      'Maintain equipment regularly',
      'Follow quality protocols'
    ]
  });

  return insights;
}

async function generateReport(supabase: any, userId: string, userRole: string) {
  const patterns = await analyzeWastePatterns(supabase, userId);
  const totalWaste = patterns.reduce((sum: number, p: any) => sum + p.averageWaste, 0);

  const report = `
# Supply Chain Performance Report
Generated: ${new Date().toLocaleDateString()}

## Executive Summary
- Role: ${userRole}
- Total Average Waste: ${totalWaste.toFixed(2)}kg
- Phases Monitored: ${patterns.length}

## Analysis
${patterns.map((p: any) => `
### ${p.phase} Phase
- Average Waste: ${p.averageWaste.toFixed(2)}kg
- Status: ${p.trend}
`).join('')}

## Recommendations
1. Focus on high-waste phases
2. Implement monitoring systems
3. Train staff on best practices
  `;

  return report;
}
