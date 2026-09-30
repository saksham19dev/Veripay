import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice, InvoiceStatus, ExceptionType } from '../types/invoice';
import { StatusBadge } from '../components/invoices/StatusBadge';
import { LoadingSpinner } from '../components/common/Loading';

export const Invoices: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(128);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(16);
  const [loading, setLoading] = useState(true);

  // Filters state from URL or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [exceptionTypeFilter, setExceptionTypeFilter] = useState<string>(
    searchParams.get('exceptionType') || 'all'
  );
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'id'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null) setSearchTerm(urlSearch);

    const urlStatus = searchParams.get('status');
    if (urlStatus !== null) setStatusFilter(urlStatus);

    const urlType = searchParams.get('exceptionType');
    if (urlType !== null) setExceptionTypeFilter(urlType);
  }, [searchParams]);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, statusFilter, exceptionTypeFilter, supplierFilter, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({
        status: statusFilter === 'all' ? undefined : statusFilter,
        exceptionType: exceptionTypeFilter === 'all' ? undefined : exceptionTypeFilter,
        search: searchTerm,
        page: currentPage,
        limit: 10,
      });

      let list = [...res.invoices];
      if (supplierFilter !== 'all') {
        list = list.filter((i) => i.supplier === supplierFilter);
      }

      // Sort
      list.sort((a, b) => {
        if (sortBy === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        if (sortBy === 'id') {
          return sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
        }
        return sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setInvoices(list);
      setTotalCount(res.total);
      setTotalPages(Math.ceil(res.total / 10));
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setExceptionTypeFilter('all');
    setSupplierFilter('all');
    setSearchParams({});
    setCurrentPage(1);
  };

  const formatAmount = (amt: number) => `₹ ${amt.toLocaleString('en-IN')}`;

  const suppliers = [
    'All Suppliers',
    'ABC Trading Co.',
    'Global Supplies Ltd.',
    'Tech Solutions',
    'XYZ Traders',
    'Bright Future Pvt. Ltd.',
    'NextGen Technologies',
    'Apex Logistics Hub',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and review all invoices processed across your organization.
          </p>
        </div>

        <button
          onClick={() => {
            const csvRows = [
              ['Invoice No', 'Supplier', 'Amount', 'Date', 'Status', 'Reason'],
              ...invoices.map((i) => [i.id, i.supplier, i.amount, i.date, i.status, i.reason || '']),
            ];
            const csv = csvRows.map((r) => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `veriflow_invoices_export_${Date.now()}.csv`;
            a.click();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice #, vendor or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="clean">Clean Only</option>
              <option value="exception">Exceptions Only</option>
              <option value="pending">Pending Review</option>
            </select>

            {/* Exception Type */}
            <select
              value={exceptionTypeFilter}
              onChange={(e) => {
                setExceptionTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Exception Types</option>
              <option value="duplicate_invoice">Duplicate Invoice</option>
              <option value="policy_limit">Amount &gt; Policy Limit</option>
              <option value="missing_fields">Missing Fields</option>
              <option value="tax_mismatch">Incorrect Tax Details</option>
            </select>

            {/* Supplier */}
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {suppliers.map((s) => (
                <option key={s} value={s === 'All Suppliers' ? 'all' : s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Fetching invoice ledger..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason / Rule</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No invoices found matching current filters.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isException = inv.status === 'exception' || inv.status === 'pending';

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <td className="py-3.5 px-4 font-bold text-blue-600 hover:underline">
                          {inv.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {inv.supplier}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {formatAmount(inv.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {inv.reason ? (
                            <span className="font-medium text-slate-800">{inv.reason}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
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
                            {isException ? 'Review' : 'View'}
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{invoices.length}</span> records
            out of <span className="font-semibold text-slate-800">{totalCount}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                    currentPage === p
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
