import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  UploadCloud,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { Invoice } from '../../types/invoice';
import { StatusBadge } from '../../components/invoices/StatusBadge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/Loading';

export const MyInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'exception' | 'pending'>('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({ limit: 50 });
      // Only keep requester submissions
      const myItems = res.invoices.filter((i) => i.submittedBy === 'usr-req-01' || !i.submittedBy);
      setInvoices(myItems);
    } catch (err) {
      console.error('Failed to load my invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.reason && inv.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Submitted Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track verification progress, respond to auditor inquiries, and view approval milestones.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/requester/submit')}
          icon={<PlusCircle className="w-4 h-4" />}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm self-start sm:self-center"
        >
          Submit Invoice
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Submissions ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('clean')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'clean'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Approved ({invoices.filter((i) => i.status === 'clean').length})
          </button>
          <button
            onClick={() => setStatusFilter('exception')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'exception'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Exceptions ({invoices.filter((i) => i.status === 'exception').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'pending'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Review ({invoices.filter((i) => i.status === 'pending').length})
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search my invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading your invoices..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Auditor Inquiry / Reason</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="py-3.5 px-4 font-bold text-emerald-700 hover:underline">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{inv.supplier}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        ₹ {inv.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inv.rfiStatus === 'pending_response' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200/80 text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                            <span>Auditor requested details</span>
                          </span>
                        ) : inv.reason ? (
                          <span className="text-slate-700 font-medium">{inv.reason}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Passed all checks</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${inv.id}`);
                          }}
                          className="font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
