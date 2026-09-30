import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileCheck,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface NotificationItem {
  id: string;
  type: 'rfi' | 'approved' | 'rejected' | 'clean';
  title: string;
  message: string;
  invoiceId: string;
  time: string;
  read: boolean;
}

export const RequesterNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'rfi',
      title: 'Action Required: AP Auditor Request for Information',
      message: 'AP Auditor: Please confirm if invoice INV-00124 is a replacement invoice or second delivery for Rack Units.',
      invoiceId: 'INV-00124',
      time: '15 mins ago',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'rfi',
      title: 'Missing Tax Details on INV-00129',
      message: 'The vendor PDF parser did not detect a valid GSTIN or HSN tax classification code. Please upload corrected invoice.',
      invoiceId: 'INV-00129',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'approved',
      title: 'Invoice INV-00123 Approved for Payment',
      message: 'Your requisition for ABC Trading Co. (₹245,000) passed automated matching and was released to ERP disbursement batch.',
      invoiceId: 'INV-00123',
      time: '3 hours ago',
      read: true,
    },
    {
      id: 'notif-4',
      type: 'clean',
      title: 'Invoice INV-00128 Auto-Passed',
      message: 'Requisition for Bright Future Pvt. Ltd. (₹65,320) passed with 100% 3-way matching confidence.',
      invoiceId: 'INV-00128',
      time: 'Yesterday',
      read: true,
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications &amp; Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated on approval milestones and respond to auditor documentation requests.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-semibold text-emerald-700 hover:underline self-start sm:self-center"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition-all ${
              item.read
                ? 'bg-white border-slate-200/80'
                : 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === 'rfi'
                    ? 'bg-amber-100 text-amber-700'
                    : item.type === 'approved' || item.type === 'clean'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {item.type === 'rfi' && <MessageSquare className="w-5 h-5" />}
                {(item.type === 'approved' || item.type === 'clean') && (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {item.type === 'rejected' && <AlertTriangle className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/invoices/${item.invoiceId}`)}
                  >
                    <span>View {item.invoiceId}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>

                  {item.type === 'rfi' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => navigate(`/invoices/${item.invoiceId}?action=rfi`)}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span>Upload Corrected Document</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
