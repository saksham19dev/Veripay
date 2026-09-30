export type InvoiceStatus = 'clean' | 'exception' | 'pending';

export type ExceptionType = 
  | 'duplicate_invoice'
  | 'policy_limit'
  | 'missing_fields'
  | 'tax_mismatch'
  | 'other';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MatchedEvidence {
  matchedInvoiceId: string;
  supplier: string;
  amount: number;
  date: string;
  matchedFields: string[];
}

export interface TaxInfo {
  gstNumber?: string;
  taxAmount?: number;
  taxRate?: number;
  isVerified: boolean;
  notes?: string;
}

export interface Invoice {
  id: string; // e.g. 'INV-00123'
  supplier: string;
  amount: number;
  date: string; // formatted e.g. '10 Sep 2025'
  status: InvoiceStatus;
  reason?: string;
  exceptionType?: ExceptionType;
  ruleViolated?: string;
  taxDetails?: TaxInfo;
  matchedEvidence?: MatchedEvidence;
  aiExplanation?: string;
  notes?: string[];
  lineItems?: LineItem[];
  paymentTerms?: string;
  department?: string;
  submittedBy?: string;
  submitterName?: string;
  attachmentName?: string;
  rfiStatus?: 'none' | 'pending_response' | 'resolved';
  rfiMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFilterOptions {
  status?: InvoiceStatus | 'all';
  exceptionType?: ExceptionType | 'all';
  searchQuery?: string;
  supplier?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
  totalInvoices: number;
  autoPassed: number;
  exceptions: number;
  pendingReview: number;
  totalInvoicesGrowth: number;
  autoPassedGrowth: number;
  exceptionsGrowth: number;
  pendingReviewGrowth: number;
  breakdown: {
    duplicateInvoice: number;
    amountOverLimit: number;
    missingFields: number;
    incorrectTaxDetails: number;
    other: number;
  };
}
