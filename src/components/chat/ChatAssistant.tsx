import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Minus, Maximize2, Sparkles, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { ChatMessageItem } from './ChatMessageItem';
import { api } from '../../services/api';

interface ChatAssistantProps {
  isCompact?: boolean;
  className?: string;
  initialQuestion?: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'user',
    text: 'Why was invoice INV-00124 flagged?',
    timestamp: '10:45 AM',
  },
  {
    id: 'm2',
    sender: 'assistant',
    text: 'Invoice INV-00124 was flagged as a Duplicate Invoice because it matches an existing record with the same supplier (Global Supplies Ltd.), amount (₹ 120,500) and date (09 Sep 2025).',
    timestamp: '10:45 AM',
    matchedFields: ['Supplier Name', 'Invoice Amount', 'Invoice Date'],
    actionLabel: 'View Source Record',
    actionUrl: '/invoices/INV-00124',
  },
  {
    id: 'm3',
    sender: 'user',
    text: 'Show me all exceptions from Global Supplies Ltd.',
    timestamp: '10:46 AM',
  },
  {
    id: 'm4',
    sender: 'assistant',
    text: 'Found 5 exceptions for Global Supplies Ltd.',
    timestamp: '10:46 AM',
    breakdownList: [
      { label: 'Duplicate Invoices', count: 3 },
      { label: 'Amount > Policy Limit', count: 1 },
      { label: 'Missing Tax Details', count: 1 },
    ],
    actionLabel: 'View All',
    actionUrl: '/invoices?search=Global+Supplies',
  },
];

const SUGGESTED_PROMPTS = [
  'Why was invoice INV-00124 flagged?',
  "Show today's exceptions",
  'How many invoices are pending?',
  'What are the most common exceptions?',
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  isCompact = true,
  className = '',
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || inputValue;
    if (!question.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await api.sendChatMessage(question);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the AI model right now. Please try again or check policy settings.',
          timestamp: timeStr,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: 'Hello! I am your VeriFlow AP copilot. You can ask about flagged invoices, supplier exceptions, approval policies, or batch processing results.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft flex flex-col transition-all duration-200 overflow-hidden ${
        isCompact ? (isMinimized ? 'h-14' : 'h-[620px] lg:h-[760px]') : 'h-[750px]'
      } ${className}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>AI Assistant</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Online
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={clearChat}
            className="p-1 rounded-lg hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Clear Chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {isCompact && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages list */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fbfcfd]"
          >
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-3 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                  <span
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions pills */}
          <div className="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto flex items-center gap-1.5 scrollbar-none flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 ml-1" />
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-[11px] font-medium text-slate-600 border border-slate-100 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Bottom input area */}
          <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-1.5 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
