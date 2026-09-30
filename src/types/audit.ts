import { InvoiceStatus } from './invoice';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // e.g. "10:45 AM" or ISO
  date: string;
  invoiceId: string;
  action: string; // e.g. "Exception Reviewed", "Invoice Approved", "Invoice Rejected", "Flagged by AI"
  previousStatus: InvoiceStatus | 'None' | 'Pending';
  newStatus: InvoiceStatus | 'Approved' | 'Rejected' | 'Resolved';
  reason: string;
  user: string; // e.g. "AP Senior Auditor (System)" or "Finance Reviewer"
}
