import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  changeText: string;
  changePositive?: boolean;
  changeType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  changeText,
  changeType = 'positive',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-blue-200' : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
        {changeType === 'positive' && (
          <span className="inline-flex items-center text-emerald-600 gap-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            {changeText}
          </span>
        )}
        {changeType === 'negative' && (
          <span className="inline-flex items-center text-rose-600 gap-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            {changeText}
          </span>
        )}
        {changeType === 'neutral' && (
          <span className="inline-flex items-center text-indigo-600 gap-0.5">
            <TrendingDown className="w-3.5 h-3.5" />
            {changeText}
          </span>
        )}
      </div>
    </div>
  );
};
