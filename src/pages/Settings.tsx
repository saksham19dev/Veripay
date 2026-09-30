import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Bell,
  Cpu,
  User,
  Save,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { AppSettings } from '../services/mockApi';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(() => api.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'policy' | 'general' | 'notifications' | 'ai' | 'preferences'>('policy');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      api.updateSettings(settings);
      setIsSaving(false);
      showToast('Settings and AP policies updated successfully.', 'success');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure exception rules, auto-approval thresholds, notifications, and AI integrations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          icon={<Save className="w-4 h-4" />}
          className="self-start sm:self-center"
        >
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'policy'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Policy Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'ai'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-6">
        {activeTab === 'policy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AP Policy &amp; Exception Thresholds
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set company-wide validation bounds that flag invoices for manual review.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Max Invoice Amount */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Maximum Invoice Amount (₹)
                </label>
                <p className="text-[11px] text-slate-500">
                  Invoices exceeding this value trigger "Amount &gt; Policy Limit" exception.
                </p>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={settings.maxInvoiceLimit}
                    onChange={(e) =>
                      setSettings({ ...settings, maxInvoiceLimit: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Duplicate Window */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Duplicate Detection Window (Days)
                </label>
                <p className="text-[11px] text-slate-500">
                  Lookback interval to detect matching vendor, amount and invoice numbers.
                </p>
                <input
                  type="number"
                  value={settings.duplicateWindowDays}
                  onChange={(e) =>
                    setSettings({ ...settings, duplicateWindowDays: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Auto Approve Confidence */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Auto-Approval Confidence Threshold (%)
                </label>
                <p className="text-[11px] text-slate-500">
                  Minimum AI confidence score required for clean auto-pass without manual touch.
                </p>
                <input
                  type="number"
                  min={80}
                  max={100}
                  value={settings.autoApproveConfidence}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveConfidence: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Strict GST Verification Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Strict GSTIN Compliance Verification
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Flag any invoice with unverified or inactive GST numbers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.strictGstVerification}
                  onChange={(e) =>
                    setSettings({ ...settings, strictGstVerification: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">General Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Base Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="INR (₹)">Indian Rupee (INR - ₹)</option>
                  <option value="USD ($)">US Dollar (USD - $)</option>
                  <option value="EUR (€)">Euro (EUR - €)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">AI &amp; Extraction Engine</h2>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Deep Learning Anomaly Detection
                </p>
                <p className="text-[11px] text-slate-500">
                  Detect unusual price variances and uncharacteristic line items.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.aiAnomalyDetection}
                onChange={(e) =>
                  setSettings({ ...settings, aiAnomalyDetection: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800">
                  Email Alerts on High-Severity Exceptions
                </span>
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800">
                  Slack Channel Instant Dispatch (#ap-exceptions)
                </span>
                <input
                  type="checkbox"
                  checked={settings.slackAlerts}
                  onChange={(e) => setSettings({ ...settings, slackAlerts: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">User Preferences</h2>
            <p className="text-xs text-slate-500">
              Application display settings and enterprise timezone configuration.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              Timezone: <span className="font-bold">Asia/Kolkata (IST +05:30)</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            Save All Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
