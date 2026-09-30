import React from 'react';
import { Smartphone, Download, CheckCircle } from 'lucide-react';

export const MobileAppCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Mobile App</h3>
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold">
          iOS & Android
        </span>
      </div>

      <div className="flex items-center gap-4 my-auto">
        {/* Sleek miniature phone mockup */}
        <div className="w-16 h-28 bg-slate-900 rounded-2xl p-1 shadow-md border-2 border-slate-700 flex flex-col justify-between flex-shrink-0">
          <div className="w-4 h-1 bg-slate-700 rounded-full mx-auto my-0.5"></div>
          <div className="bg-white rounded-xl h-full w-full p-1 flex flex-col gap-1 overflow-hidden">
            <div className="w-full h-1.5 bg-blue-500 rounded"></div>
            <div className="w-3/4 h-1 bg-slate-200 rounded"></div>
            <div className="w-full h-2 bg-emerald-50 rounded flex items-center px-0.5">
              <div className="w-1.5 h-1 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="w-full h-2 bg-rose-50 rounded flex items-center px-0.5">
              <div className="w-1.5 h-1 bg-rose-500 rounded-full"></div>
            </div>
          </div>
          <div className="w-2.5 h-0.5 bg-slate-600 rounded-full mx-auto my-0.5"></div>
        </div>

        <div className="space-y-2 flex-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Get notified, review exceptions and chat with AI on the go.
          </p>
          <div className="flex flex-col gap-1.5">
            <button className="flex items-center justify-center gap-1.5 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-1.5 px-2.5 text-[11px] font-medium transition-colors shadow-sm">
              <Download className="w-3 h-3" />
              <span>Download App</span>
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-center">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span>Instant Push Alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
