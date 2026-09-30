import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Upload,
} from 'lucide-react';
import { api } from '../../services/api';
import { Invoice } from '../../types/invoice';
import { StatusBadge } from '../../components/invoices/StatusBadge';
import { Button } from '../../components/common/Button';

export const RequesterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyInvoices();
  }, []);

  const loadMyInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({ limit: 20 });
      // Filter requester's own invoices (submittedBy: 'usr-req-01' or user created)
      const myItems = res.invoices.filter(
        (i) => i.submittedBy === 'usr-req-01' || !i.submittedBy
      );
      setInvoices(myItems);
    } catch (err) {
      console.error('Failed to load requester invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSubmitted = invoices.length;
  const approvedCount = invoices.filter((i) => i.status === 'clean').length;
  const actionRequiredCount = invoices.filter(
    (i) => i.rfiStatus === 'pending_response' || i.status === 'exception'
  ).length;
  const totalSpend = invoices.reduce((acc, curr) => acc + curr.amount, 0);

  const pendingRfIs = invoices.filter((i) => i.rfiStatus === 'pending_response');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white rounded-2xl p-6 border border-emerald-100/70 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Requester Workspace
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Welcome, Alex!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Submit invoices, track automated AP checks, and resolve reviewer inquiries.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/requester/submit')}
            icon={<PlusCircle className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-sm self-start md:self-center"
          >
            Submit New Invoice
          </Button>
        </div>
      </div>

      {/* Action Required Banner if RFI pending */}
      {pendingRfIs.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900">
                Action Required on {pendingRfIs.length} Invoice{pendingRfIs.length > 1 ? 's' : ''}
              </h3>
              <span className="px-2 py-0.2 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-full">
                RFI Pending
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              The AP Reviewer requested additional documentation or clarification before release.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingRfIs.map((rfi) => (
                <button
                  key={rfi.id}
                  onClick={() => navigate(`/invoices/${rfi.id}`)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100/50 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>{rfi.id}: {rfi.reason || 'Review Requested'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">My Submissions</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalSubmitted}</div>
          <span className="text-[11px] text-slate-500 font-medium">In current quarter</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Approved / Paid</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Cleared for disbursement</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Needs Attention</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{actionRequiredCount}</div>
          <span className="text-[11px] text-amber-700 font-medium">RFIs or exception checks</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Spend (₹)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹ {(totalSpend / 1000).toFixed(0)}k
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Requisition volume</span>
        </div>
      </div>

      {/* Recent Submissions Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Recent Submissions</h2>
            <p className="text-xs text-slate-500">Track processing stages from OCR ingest to payment.</p>
          </div>
          <button
            onClick={() => navigate('/requester/invoices')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            View All ({invoices.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Step</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-emerald-700">{inv.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{inv.supplier}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    ₹ {inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {inv.status === 'clean' ? (
                      <span className="text-emerald-600 font-medium">ERP Payment Queue</span>
                    ) : inv.rfiStatus === 'pending_response' ? (
                      <span className="text-amber-600 font-bold">Provide Clarification</span>
                    ) : (
                      <span className="text-slate-500">AP Reviewer Triage</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
