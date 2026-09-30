import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const MONTHLY_TREND_DATA = [
  { month: 'Apr', total: 95, autoPassed: 72, exceptions: 23 },
  { month: 'May', total: 108, autoPassed: 84, exceptions: 24 },
  { month: 'Jun', total: 114, autoPassed: 90, exceptions: 24 },
  { month: 'Jul', total: 120, autoPassed: 96, exceptions: 24 },
  { month: 'Aug', total: 124, autoPassed: 98, exceptions: 26 },
  { month: 'Sep', total: 128, autoPassed: 102, exceptions: 26 },
];

const VENDOR_RISK_DATA = [
  { vendor: 'Global Supplies Ltd.', exceptions: 8, total: 24, rate: 33 },
  { vendor: 'XYZ Traders', exceptions: 6, total: 18, rate: 33 },
  { vendor: 'ABC Trading Co.', exceptions: 5, total: 32, rate: 16 },
  { vendor: 'Tech Solutions', exceptions: 3, total: 20, rate: 15 },
  { vendor: 'Bright Future Pvt.', exceptions: 2, total: 15, rate: 13 },
];

const EXCEPTION_RESOLUTION_TIME = [
  { type: 'Duplicate Check', avgHours: 1.1 },
  { type: 'Tax Mismatch', avgHours: 1.8 },
  { type: 'Policy Limit', avgHours: 2.4 },
  { type: 'Missing Data', avgHours: 3.2 },
];

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AP Executive Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Historical trends, touchless automation velocity, and vendor exception risk patterns.
        </p>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Duplicate Prevention Savings</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">₹ 4,82,000</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            8 double-billings intercepted prior to payout
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Cycle Time Comparison</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">2.4 min vs 1.6 hr</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Touchless auto-pass vs human auditor review
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Quarterly Automation Growth</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-600 mt-2">+18.4%</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Continuous AI rule engine optimization
          </p>
        </div>
      </div>

      {/* Main Chart 1: Ingest Volume & Auto-Pass Progression */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Monthly Invoice Ingestion &amp; Resolution Trajectory
            </h2>
            <p className="text-xs text-slate-500">Total volume vs touchless auto-passed invoices.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            Last 6 Months
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Invoices"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="autoPassed"
                name="Auto-Passed (Touchless)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClean)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column: Vendor Risk Ranking + Resolution Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Error Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Highest Exception Vendors</h2>
            <p className="text-xs text-slate-500">Vendors with recurring duplicate or tax anomalies.</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VENDOR_RISK_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis dataKey="vendor" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} exceptions`, 'Flagged']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="exceptions" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Time by Exception Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Average Resolution SLA (Hours)</h2>
            <p className="text-xs text-slate-500">Time to clear exception from detection to sign-off.</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EXCEPTION_RESOLUTION_TIME} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="h" />
                <Tooltip
                  formatter={(val: any) => [`${val} hours`, 'Avg Resolution Time']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgHours" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
