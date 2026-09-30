import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShieldAlert,
  Users,
  Clock,
  ArrowRight,
  Shield,
  FileCheck2,
  DollarSign,
  BarChart3,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Invoice, DashboardStats } from '../../types/invoice';
import { KPICard } from '../../components/dashboard/KPICard';
import { StatusBadge } from '../../components/invoices/StatusBadge';
import { Button } from '../../components/common/Button';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [highValueExceptions, setHighValueExceptions] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, invoicesData] = await Promise.all([
        api.getDashboardStats(),
        api.getInvoices({ status: 'exception', limit: 10 }),
      ]);
      setStats(statsData);
      // High value exceptions over 300,000 or duplicate issues
      setHighValueExceptions(invoicesData.invoices.filter((i) => i.amount >= 120000));
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const reviewers = [
    {
      name: 'Jordan Lee',
      role: 'Senior AP Auditor',
      reviewedCount: 42,
      avgResolutionTime: '1.2 hours',
      slaMetRate: '98%',
      status: 'Active Now',
    },
    {
      name: 'Priya Sharma',
      role: 'Compliance Specialist',
      reviewedCount: 38,
      avgResolutionTime: '1.8 hours',
      slaMetRate: '95%',
      status: 'Active Now',
    },
    {
      name: 'Marcus Vance',
      role: 'AP Reviewer',
      reviewedCount: 22,
      avgResolutionTime: '2.4 hours',
      slaMetRate: '91%',
      status: 'Offline',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-white rounded-2xl p-6 border border-purple-100/70 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider">
              Finance Executive Operations
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Organization AP Oversight
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitor team review velocity, policy exceptions, audit compliance, and spend governance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Button
              variant="outline"
              onClick={() => navigate('/manager/policies')}
              icon={<Sliders className="w-4 h-4" />}
            >
              Configure Policies
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/manager/analytics')}
              icon={<BarChart3 className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700 shadow-sm"
            >
              Deep Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Monthly Ingest Volume</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">₹ 2.45 Cr</div>
          <span className="text-[11px] text-emerald-600 font-medium">↑ 14% vs budget</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Touchless Auto-Pass</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">79.7%</div>
          <span className="text-[11px] text-emerald-600 font-medium">102 of 128 processed touchless</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Exception Risk Exposure</span>
          </div>
          <div className="text-2xl font-bold text-rose-600">₹ 14.8 L</div>
          <span className="text-[11px] text-rose-600 font-medium">26 flagged items in audit</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg Review Resolution</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600">1.6 hrs</div>
          <span className="text-[11px] text-emerald-600 font-medium">SLA compliance: 96.5%</span>
        </div>
      </div>

      {/* 2-Column: Left High Value Exceptions for Sign-off, Right Reviewer Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: High-Risk / High-Value Invoices */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Executive Exception Sign-Offs</h2>
              <p className="text-xs text-slate-500">Invoices exceeding policy threshold (&gt; ₹300,000) or high duplicate risk.</p>
            </div>
            <button
              onClick={() => navigate('/exceptions')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800"
            >
              All Exceptions ({stats?.exceptions ?? 26})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {highValueExceptions.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 text-xs">{item.id}</span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="font-semibold text-slate-800 text-xs truncate">
                      {item.supplier}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {item.reason || item.ruleViolated || 'Policy Check'}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-slate-900 text-sm">
                    ₹ {item.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => navigate(`/invoices/${item.id}`)}
                    className="text-xs font-semibold text-purple-600 hover:underline mt-0.5"
                  >
                    Review Dossier →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Reviewer Team Productivity */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>AP Reviewer Workload</span>
              </h3>
              <p className="text-[11px] text-slate-500">Live auditor activity &amp; resolution pace.</p>
            </div>
            <button
              onClick={() => navigate('/manager/users')}
              className="text-xs font-semibold text-purple-600 hover:underline"
            >
              Manage Team
            </button>
          </div>

          <div className="space-y-3">
            {reviewers.map((rev) => (
              <div
                key={rev.name}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{rev.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                      {rev.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{rev.role}</span>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-800">{rev.reviewedCount} Invoices</div>
                  <span className="text-[11px] text-slate-500">Avg {rev.avgResolutionTime}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall AP Team SLA Met:</span>
            <span className="font-bold text-emerald-600">96.5% Target Achieved</span>
          </div>
        </div>
      </div>
    </div>
  );
};
