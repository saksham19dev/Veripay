import React from 'react';
import { InvoiceStatus } from '../../types/invoice';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  if (normalized === 'clean' || normalized === 'approved' || normalized === 'passed') {
    return (
      <span className={`inline-flex items-center justify-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${sizeClasses}`}>
        Clean
      </span>
    );
  }

  if (normalized === 'exception' || normalized === 'rejected') {
    return (
      <span className={`inline-flex items-center justify-center font-medium rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 ${sizeClasses}`}>
        Exception
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 ${sizeClasses}`}>
      Pending
    </span>
  );
};
