import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  Download,
  Filter,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types/audit';
import { LoadingSpinner } from '../components/common/Loading';

export const AuditLog: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    return (
      log.invoiceId.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q)
    );
  });

  const exportAuditLog = () => {
    const csvHeader = ['Timestamp', 'Date', 'Invoice ID', 'Action', 'Previous Status', 'New Status', 'Reason', 'User'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.date,
      l.invoiceId,
      l.action,
      l.previousStatus,
      l.newStatus,
      l.reason,
      l.user,
    ]);
    const csv = [csvHeader, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veriflow_compliance_audit_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log & Compliance Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable timeline of invoice ingest, policy checks, auditor interventions, and ERP sync events.
          </p>
        </div>

        <button
          onClick={exportAuditLog}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice, auditor, action or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">SOX & Tax Compliance Verifiable</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Fetching compliance timeline..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Status Transition</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">User / Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No audit log records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.timestamp}</div>
                        <div className="text-[10px] text-slate-400">{log.date}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        <button
                          onClick={() => {
                            if (log.invoiceId.startsWith('INV-')) {
                              navigate(`/invoices/${log.invoiceId}`);
                            }
                          }}
                          className="hover:underline"
                        >
                          {log.invoiceId}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.action}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium text-[11px]">
                          <span className="capitalize text-slate-500">{log.previousStatus}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-900 capitalize">{log.newStatus}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                        {log.reason}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-slate-800">{log.user}</span>
                        </div>
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
