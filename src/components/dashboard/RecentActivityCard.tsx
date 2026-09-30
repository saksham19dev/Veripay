import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ActivityItem {
  id: string;
  invoiceId: string;
  title: string;
  supplier: string;
  time: string;
  type: 'exception' | 'pending' | 'clean';
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    invoiceId: 'INV-00124',
    title: 'Duplicate Invoice',
    supplier: 'Global Supplies Ltd.',
    time: '10:45 AM',
    type: 'exception',
  },
  {
    id: '2',
    invoiceId: 'INV-00129',
    title: 'Missing Tax Details',
    supplier: 'ABC Trading Co.',
    time: '09:32 AM',
    type: 'pending',
  },
  {
    id: '3',
    invoiceId: 'INV-00125',
    title: 'Auto Passed',
    supplier: 'Tech Solutions',
    time: '08:17 AM',
    type: 'clean',
  },
  {
    id: '4',
    invoiceId: 'INV-00126',
    title: 'Amount > Policy Limit',
    supplier: 'XYZ Traders',
    time: '07:50 AM',
    type: 'exception',
  },
];

export const RecentActivityCard: React.FC<{ activities?: ActivityItem[] }> = ({
  activities = DEFAULT_ACTIVITIES,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recent Activity</h3>
        <Link
          to="/audit-log"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {activities.map((act) => (
          <Link
            key={act.id}
            to={`/invoices/${act.invoiceId}`}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                act.type === 'exception'
                  ? 'bg-rose-50 text-rose-500'
                  : act.type === 'pending'
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-emerald-50 text-emerald-500'
              }`}
            >
              {act.type === 'exception' && <AlertCircle className="w-4 h-4" />}
              {act.type === 'pending' && <Clock className="w-4 h-4" />}
              {act.type === 'clean' && <CheckCircle2 className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                  {act.invoiceId} – {act.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{act.supplier}</p>
            </div>

            <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">
              {act.time}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
