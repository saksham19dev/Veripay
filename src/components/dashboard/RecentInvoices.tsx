import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, MoreVertical, Eye, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Invoice, InvoiceStatus } from '../../types/invoice';
import { StatusBadge } from '../invoices/StatusBadge';

interface RecentInvoicesProps {
  invoices: Invoice[];
  totalCount?: number;
  activeTab: 'all' | 'clean' | 'exception' | 'pending';
  onTabChange: (tab: 'all' | 'clean' | 'exception' | 'pending') => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onQuickApprove?: (id: string) => void;
}

export const RecentInvoices: React.FC<RecentInvoicesProps> = ({
  invoices,
  totalCount = 128,
  activeTab,
  onTabChange,
  currentPage,
  totalPages = 16,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatAmount = (amt: number) => {
    return `₹ ${amt.toLocaleString('en-IN')}`;
  };

  const tabs: { key: 'all' | 'clean' | 'exception' | 'pending'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: 128 },
    { key: 'clean', label: 'Clean', count: 102 },
    { key: 'exception', label: 'Exceptions', count: 26 },
    { key: 'pending', label: 'Pending Review', count: 18 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
      {/* Header with Title, Tabs & Upload Button */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mb-2">Invoices</h2>
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all self-start md:self-center"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Invoices</span>
        </button>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selectedIds.length === invoices.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Invoice No.</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Amount (₹)</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4 text-center">Action</th>
              <th className="py-3 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No invoices found matching current filter.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const isSelected = selectedIds.includes(invoice.id);
                const isException = invoice.status === 'exception' || invoice.status === 'pending';

                return (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(invoice.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className="hover:text-blue-600 transition-colors text-left"
                      >
                        {invoice.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {invoice.supplier}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatAmount(invoice.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{invoice.date}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {invoice.reason ? (
                        <span className="font-medium text-slate-700">{invoice.reason}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {isException ? 'Review' : 'View'}
                      </button>
                    </td>
                    <td className="py-3.5 px-2 relative text-center">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === invoice.id ? null : invoice.id)
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown menu */}
                      {activeMenuId === invoice.id && (
                        <div className="absolute right-2 top-10 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-left">
                          <button
                            onClick={() => {
                              navigate(`/invoices/${invoice.id}`);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Details</span>
                          </button>
                          {invoice.status !== 'clean' && (
                            <button
                              onClick={() => {
                                navigate(`/invoices/${invoice.id}?action=approve`);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Quick Approve</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800">1 – {invoices.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                currentPage === p
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}

          <span className="px-1 text-slate-400">...</span>

          <button
            onClick={() => onPageChange(totalPages)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold ${
              currentPage === totalPages
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {totalPages}
          </button>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
