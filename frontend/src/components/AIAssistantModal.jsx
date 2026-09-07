import { useState, useRef, useEffect } from 'react';
import { askAiAssistant } from '../services/api';

export default function AIAssistantModal({ isOpen, onClose, defaultProjectId = null, projectName = null }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: defaultProjectId
        ? `Hello! I am your PMIS AI Assistant. Ask me anything about **${projectName || 'this project'}**, its risk factors, milestones, or budget.`
        : 'Hello! I am your PMIS AI Assistant. Ask me anything about current project statuses, delays, budget allocations, or department performance.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: textToSend.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await askAiAssistant(textToSend.trim(), defaultProjectId);
      const aiReply = res.data?.response || 'I analyzed the available data but have no additional findings.';
      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `⚠️ AI Service notice: ${err.message || 'Unable to connect to assistant service.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = defaultProjectId
    ? [
        'Analyze project timeline and risks',
        'Is the budget on track with progress?',
        'What are the key recommendations?'
      ]
    : [
        'Which projects are currently delayed?',
        'Give me an overall budget summary',
        'Which projects have the highest risk scores?'
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                PMIS AI Assistant
                <span className="text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Gemini Grounded
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                {defaultProjectId ? `Focused: ${projectName || 'Active Project'}` : 'Statewide Project Intelligence'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick prompt pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors disabled:opacity-50"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-600 rounded-2xl rounded-bl-none px-4 py-2 text-xs flex items-center gap-2 border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                AI analyzing PMIS live telemetry...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={defaultProjectId ? "Ask about this project's schedule, costs, or risk..." : "Ask about delays, budgets, or department progress..."}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Send</span>
            <span>➤</span>
          </button>
        </form>
      </div>
    </div>
  );
}
