import React, { useState } from 'react';
import { Shield, Save, CheckCircle2, AlertTriangle, Sliders, DollarSign, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface DepartmentLimit {
  dept: string;
  limit: number;
}

export const PolicyRulesConfig: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(() => api.getSettings());
  const [isSaving, setIsSaving] = useState(false);

  const [deptLimits, setDeptLimits] = useState<DepartmentLimit[]>([
    { dept: 'Procurement', limit: 500000 },
    { dept: 'IT Infrastructure', limit: 350000 },
    { dept: 'Facilities & Operations', limit: 200000 },
    { dept: 'Corporate Marketing', limit: 250000 },
  ]);

  const [rules, setRules] = useState([
    {
      id: 'DUP-01',
      name: 'Duplicate Detection Engine',
      description: 'Checks same vendor, amount and invoice date within rolling window.',
      enabled: true,
      severity: 'Critical',
    },
    {
      id: 'CAP-04',
      name: 'Maximum Invoice Spend Cap',
      description: 'Invoices exceeding the single purchase threshold require VP sign-off.',
      enabled: true,
      severity: 'High',
    },
    {
      id: 'TAX-02',
      name: 'GSTIN & HSN Format Verification',
      description: 'Validates 15-character GST format and cross-references active tax database.',
      enabled: true,
      severity: 'Medium',
    },
    {
      id: 'TAX-03',
      name: 'Tax Calculation Discrepancy Tolerance',
      description: 'Flags invoices if line item GST calculation diverges from declared total by > ₹10.',
      enabled: true,
      severity: 'Medium',
    },
    {
      id: 'AI-ANOM-01',
      name: 'AI Historical Vendor Price Drift',
      description: 'Deep learning flags line-item price variations > 25% compared to vendor history.',
      enabled: settings.aiAnomalyDetection,
      severity: 'Low',
    },
  ]);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    showToast('Rule status updated', 'info');
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      api.updateSettings(settings);

      // Log in audit log
      const auditStore = JSON.parse(localStorage.getItem('veriflow_audit_v1') || '[]');
      auditStore.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        invoiceId: 'POLICY-SYS',
        action: 'Policy Rules Reconfigured',
        previousStatus: 'None',
        newStatus: 'Approved',
        reason: `Global cap updated to ₹${settings.maxInvoiceLimit.toLocaleString('en-IN')}`,
        user: 'Elena Rostova (Finance Manager)',
      });
      localStorage.setItem('veriflow_audit_v1', JSON.stringify(auditStore));

      setIsSaving(false);
      showToast('AP Policy Rules and department thresholds updated successfully.', 'success');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Policy Rules &amp; Compliance Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated exception trigger rules, spend caps, and duplicate detection tolerance.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAll}
          isLoading={isSaving}
          icon={<Save className="w-4 h-4" />}
          className="bg-purple-600 hover:bg-purple-700 shadow-sm self-start sm:self-center"
        >
          Save All Rules
        </Button>
      </div>

      {/* Global Spend Thresholds */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Corporate Spend Caps &amp; Lookback Windows</h2>
          <p className="text-xs text-slate-500 mt-0.5">Core thresholds enforced by the VeriFlow validation pipeline.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <label className="font-bold text-slate-800 block">Default Max Invoice Limit</label>
            <p className="text-[11px] text-slate-500">Flags "Amount &gt; Policy Limit"</p>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={settings.maxInvoiceLimit}
                onChange={(e) => setSettings({ ...settings, maxInvoiceLimit: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <label className="font-bold text-slate-800 block">Duplicate Window (Days)</label>
            <p className="text-[11px] text-slate-500">Rolling vendor lookback</p>
            <input
              type="number"
              value={settings.duplicateWindowDays}
              onChange={(e) => setSettings({ ...settings, duplicateWindowDays: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <label className="font-bold text-slate-800 block">Auto-Pass Confidence</label>
            <p className="text-[11px] text-slate-500">Min score for touchless pass</p>
            <div className="relative mt-1">
              <input
                type="number"
                min={80}
                max={100}
                value={settings.autoApproveConfidence}
                onChange={(e) => setSettings({ ...settings, autoApproveConfidence: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Department Limits */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Department-Specific Requisition Limits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {deptLimits.map((dl, idx) => (
              <div
                key={dl.dept}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-700">{dl.dept}</span>
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <span>₹</span>
                  <input
                    type="number"
                    value={dl.limit}
                    onChange={(e) => {
                      const updated = [...deptLimits];
                      updated[idx].limit = Number(e.target.value);
                      setDeptLimits(updated);
                    }}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Engine Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Active Rule Definitions</h2>
          <p className="text-xs text-slate-500">Enable or disable specific validation rules evaluated during invoice ingest.</p>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-700">{rule.id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                      rule.severity === 'Critical'
                        ? 'bg-rose-50 text-rose-700'
                        : rule.severity === 'High'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
