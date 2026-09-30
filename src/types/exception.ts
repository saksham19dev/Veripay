import { ExceptionType, InvoiceStatus } from './invoice';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ResolutionStatus = 'open' | 'pending_review' | 'resolved' | 'rejected';

export interface ExceptionItem {
  id: string;
  invoiceId: string;
  supplier: string;
  amount: number;
  exceptionType: ExceptionType;
  exceptionName: string;
  severity: SeverityLevel;
  detectedDate: string;
  status: ResolutionStatus;
  ruleViolated: string;
  explanation: string;
}
