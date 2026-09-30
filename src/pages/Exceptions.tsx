import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice, ExceptionType } from '../types/invoice';
import { StatusBadge } from '../components/invoices/StatusBadge';
import { LoadingSpinner } from '../components/common/Loading';

export const Exceptions: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | ExceptionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadExceptions();
  }, [activeFilter]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({
        status: 'exception',
        exceptionType: activeFilter === 'all' ? undefined : activeFilter,
        search: searchQuery,
        limit: 20,
      });
      setInvoices(res.invoices.filter((i) => i.status === 'exception' || i.status === 'pending'));
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTabs: { key: 'all' | ExceptionType; label: string; count?: number }[] = [
    { key: 'all', label: 'All Exceptions' },
    { key: 'duplicate_invoice', label: 'Duplicate Invoice' },
    { key: 'policy_limit', label: 'Policy Limit' },
    { key: 'missing_fields', label: 'Missing Fields' },
    { key: 'tax_mismatch', label: 'Tax Issues' },
  ];

  const getSeverity = (type?: ExceptionType): { label: string; color: string } => {
    switch (type) {
      case 'duplicate_invoice':
        return { label: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'policy_limit':
        return { label: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'tax_mismatch':
        return { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Low', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exceptions Hub</h1>
        <p className="text-sm text-slate-500 mt-1">
          Triage and resolve flagged invoices across high-risk policy checkpoints.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Exceptions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">26</div>
          <span className="text-[11px] text-rose-600 font-medium">8 require immediate action</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-400 uppercase">Open Exceptions</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">14</div>
          <span className="text-[11px] text-slate-500">Unassigned to auditor</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-400 uppercase">Pending Review</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">18</div>
          <span className="text-[11px] text-slate-500">Awaiting vendor clarification</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-400 uppercase">Resolved This Month</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">84</div>
          <span className="text-[11px] text-emerald-600 font-medium">↑ 14% clearance rate</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exceptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadExceptions()}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading exception triage list..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Exception Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Detected Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No active exceptions matching current criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const severity = getSeverity(inv.exceptionType);

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <td className="py-3.5 px-4 font-bold text-blue-600 hover:underline">
                          {inv.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{inv.supplier}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          ₹ {inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {inv.reason || 'General Exception'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${severity.color}`}
                          >
                            {severity.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/invoices/${inv.id}`);
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
