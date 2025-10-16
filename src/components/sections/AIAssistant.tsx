import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

export const AIAssistant = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for food supply chain management. I can help you with batch tracking, quality analysis, waste reduction strategies, and supply chain optimization. How can I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    setTimeout(() => {
      const response = generateResponse(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
    }, 1000);
  };

  const generateResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('waste') || lowerQuery.includes('reduce')) {
      return 'Based on your current data, I recommend implementing these waste reduction strategies:\n\n1. Optimize temperature controls during storage to reduce spoilage\n2. Implement predictive analytics for demand forecasting\n3. Set up real-time quality monitoring alerts\n4. Review batch processing times to minimize delays\n\nWould you like detailed insights on any of these areas?';
    }

    if (lowerQuery.includes('quality') || lowerQuery.includes('test')) {
      return 'Quality monitoring is crucial for supply chain integrity. I can help you:\n\n- Analyze test result patterns\n- Identify quality trends across batches\n- Recommend optimal testing schedules\n- Compare performance metrics\n\nWhich aspect would you like to explore?';
    }

    if (lowerQuery.includes('batch') || lowerQuery.includes('track')) {
      return 'For effective batch tracking, I recommend:\n\n- Setting up automated alerts for phase transitions\n- Implementing real-time location tracking\n- Recording environmental conditions at each stage\n- Maintaining comprehensive blockchain records\n\nWould you like me to analyze your current batch performance?';
    }

    if (lowerQuery.includes('blockchain') || lowerQuery.includes('transaction')) {
      return 'Blockchain integration provides:\n\n- Immutable record keeping\n- Complete traceability\n- Enhanced transparency\n- Tamper-proof documentation\n\nAll your transactions are automatically recorded on the blockchain. Would you like to see your transaction history?';
    }

    return 'I can help you with:\n\n- Batch tracking and management\n- Quality analysis and testing\n- Waste reduction strategies\n- Supply chain optimization\n- Blockchain transaction history\n- Performance analytics\n\nWhat would you like to know more about?';
  };

  const quickActions = [
    'Analyze waste metrics',
    'Review quality scores',
    'Optimize supply chain',
    'View blockchain status',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">AI Assistant</h1>
        <p className="text-emerald-700 mt-2">Get intelligent insights and recommendations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 flex flex-col h-[600px]">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-t-xl flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">FoodTrace AI</h3>
            <p className="text-emerald-50 text-sm">Your intelligent supply chain assistant</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                }`}
              >
                {message.role === 'assistant' && (
                  <Sparkles className="w-4 h-4 inline mr-2 text-emerald-600" />
                )}
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-emerald-100">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  setInput(action);
                }}
                className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your supply chain..."
              className="flex-1 px-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
