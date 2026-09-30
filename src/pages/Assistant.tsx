import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatAssistant } from '../components/chat/ChatAssistant';
import { Bot, Sparkles, Shield, Cpu } from 'lucide-react';

export const Assistant: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <span>AI Assistant</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ask questions about invoices, exceptions, AP activity, and compliance rules.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60 self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FastAPI AP Copilot Connected</span>
        </div>
      </div>

      {/* Feature highlights bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Instant Exception Root-Cause</span>
            <span className="text-[11px] text-slate-500">Duplicate, tax, and policy insights</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Policy Rule Explanation</span>
            <span className="text-[11px] text-slate-500">Cross-verifies vendor limits</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Natural Language Queries</span>
            <span className="text-[11px] text-slate-500">Search vendors, dates, and amounts</span>
          </div>
        </div>
      </div>

      {/* Main Full-Page Chat Container */}
      <ChatAssistant isCompact={false} initialQuestion={initialQuery} />
    </div>
  );
};
