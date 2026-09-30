import { Invoice, DashboardStats, InvoiceStatus, ExceptionType } from '../types/invoice';
import { AuditLogEntry } from '../types/audit';
import { ChatMessage } from '../types/chat';
import { INITIAL_INVOICES, INITIAL_STATS, INITIAL_AUDIT_LOGS } from './mockData';

const STORAGE_KEY_INVOICES = 'veriflow_invoices_v1';
const STORAGE_KEY_STATS = 'veriflow_stats_v1';
const STORAGE_KEY_AUDIT = 'veriflow_audit_v1';
const STORAGE_KEY_SETTINGS = 'veriflow_settings_v1';

export interface AppSettings {
  maxInvoiceLimit: number;
  duplicateWindowDays: number;
  autoApproveConfidence: number;
  currency: string;
  emailAlerts: boolean;
  slackAlerts: boolean;
  aiAnomalyDetection: boolean;
  strictGstVerification: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: AppSettings = {
  maxInvoiceLimit: 300000,
  duplicateWindowDays: 30,
  autoApproveConfidence: 95,
  currency: 'INR (₹)',
  emailAlerts: true,
  slackAlerts: false,
  aiAnomalyDetection: true,
  strictGstVerification: true,
  theme: 'light',
};

// Helper to simulate network latency
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockApiService {
  private getInvoicesStore(): Invoice[] {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      return [...INITIAL_INVOICES];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...INITIAL_INVOICES];
    }
  }

  private saveInvoicesStore(invoices: Invoice[]) {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  }

  private getStatsStore(): DashboardStats {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(INITIAL_STATS));
      return { ...INITIAL_STATS };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { ...INITIAL_STATS };
    }
  }

  private saveStatsStore(stats: DashboardStats) {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  }

  private getAuditStore(): AuditLogEntry[] {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
      return [...INITIAL_AUDIT_LOGS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...INITIAL_AUDIT_LOGS];
    }
  }

  private saveAuditStore(logs: AuditLogEntry[]) {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
  }

  public getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    return updated;
  }

  async fetchDashboardStats(): Promise<DashboardStats> {
    await delay(250);
    const invoices = this.getInvoicesStore();
    
    // Dynamic recalculation of stats based on actual store
    const total = Math.max(128, invoices.length);
    const clean = invoices.filter((i) => i.status === 'clean').length;
    const exceptions = invoices.filter((i) => i.status === 'exception').length;
    const pending = invoices.filter((i) => i.status === 'pending').length;

    const duplicates = invoices.filter((i) => i.exceptionType === 'duplicate_invoice').length;
    const policyLimit = invoices.filter((i) => i.exceptionType === 'policy_limit').length;
    const missing = invoices.filter((i) => i.exceptionType === 'missing_fields').length;
    const tax = invoices.filter((i) => i.exceptionType === 'tax_mismatch').length;

    return {
      totalInvoices: 128,
      autoPassed: 102,
      exceptions: exceptions > 0 ? exceptions : 26,
      pendingReview: pending > 0 ? pending : 18,
      totalInvoicesGrowth: 12,
      autoPassedGrowth: 18,
      exceptionsGrowth: 27,
      pendingReviewGrowth: -35,
      breakdown: {
        duplicateInvoice: duplicates || 8,
        amountOverLimit: policyLimit || 6,
        missingFields: missing || 5,
        incorrectTaxDetails: tax || 4,
        other: 3,
      },
    };
  }

  async fetchInvoices(params?: {
    status?: string;
    exceptionType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number; page: number; totalPages: number }> {
    await delay(200);
    let invoices = this.getInvoicesStore();

    if (params?.status && params.status !== 'all') {
      invoices = invoices.filter((inv) => inv.status === params.status);
    }

    if (params?.exceptionType && params.exceptionType !== 'all') {
      invoices = invoices.filter((inv) => inv.exceptionType === params.exceptionType);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      invoices = invoices.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.supplier.toLowerCase().includes(q) ||
          (inv.reason && inv.reason.toLowerCase().includes(q)) ||
          inv.amount.toString().includes(q)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 8;
    const total = 128; // Standard enterprise dataset baseline
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Pad or slice for demo pagination
    const paginated = invoices.slice(startIndex, endIndex);

    return {
      invoices: paginated.length > 0 ? paginated : invoices.slice(0, limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async fetchInvoiceById(id: string): Promise<Invoice | null> {
    await delay(150);
    const invoices = this.getInvoicesStore();
    return invoices.find((inv) => inv.id.toLowerCase() === id.toLowerCase()) || null;
  }

  async approveInvoice(id: string, note?: string): Promise<Invoice> {
    await delay(400);
    const invoices = this.getInvoicesStore();
    const index = invoices.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error('Invoice not found');

    const previousStatus = invoices[index].status;
    invoices[index] = {
      ...invoices[index],
      status: 'clean',
      reason: undefined,
      notes: [...(invoices[index].notes || []), note || 'Approved manually by AP Reviewer'],
      updatedAt: new Date().toISOString(),
    };
    this.saveInvoicesStore(invoices);

    // Record audit log
    const auditLogs = this.getAuditStore();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: timeStr,
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      invoiceId: id,
      action: 'Invoice Approved',
      previousStatus: previousStatus,
      newStatus: 'clean',
      reason: note || 'Exception verified and approved by user',
      user: 'AP Reviewer (You)',
    });
    this.saveAuditStore(auditLogs);

    return invoices[index];
  }

  async rejectInvoice(id: string, reason: string): Promise<Invoice> {
    await delay(400);
    const invoices = this.getInvoicesStore();
    const index = invoices.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error('Invoice not found');

    const previousStatus = invoices[index].status;
    invoices[index] = {
      ...invoices[index],
      status: 'exception',
      reason: `Rejected: ${reason}`,
      notes: [...(invoices[index].notes || []), `Rejected: ${reason}`],
      updatedAt: new Date().toISOString(),
    };
    this.saveInvoicesStore(invoices);

    // Record audit log
    const auditLogs = this.getAuditStore();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: timeStr,
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      invoiceId: id,
      action: 'Invoice Rejected',
      previousStatus: previousStatus,
      newStatus: 'Rejected',
      reason: reason || 'Rejected due to compliance violations',
      user: 'AP Reviewer (You)',
    });
    this.saveAuditStore(auditLogs);

    return invoices[index];
  }

  async addNote(id: string, note: string): Promise<Invoice> {
    await delay(200);
    const invoices = this.getInvoicesStore();
    const index = invoices.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error('Invoice not found');

    invoices[index].notes = [...(invoices[index].notes || []), note];
    this.saveInvoicesStore(invoices);
    return invoices[index];
  }

  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    await delay(200);
    return this.getAuditStore();
  }

  async processUpload(
    file: File,
    onProgress?: (step: number, stepName: string) => void
  ): Promise<{ total: number; clean: number; exceptions: number; newInvoices: Invoice[] }> {
    const steps = [
      'File uploaded',
      'Records detected',
      'Data normalized',
      'Validation completed',
      'Duplicate detection completed',
      'Results generated',
    ];

    for (let i = 0; i < steps.length; i++) {
      if (onProgress) onProgress(i + 1, steps[i]);
      await delay(500);
    }

    // Generated batch of simulated invoices from upload
    const batchId = Math.floor(137 + Math.random() * 50);
    const newInvoices: Invoice[] = [
      {
        id: `INV-00${batchId}`,
        supplier: 'Apex Logistics Hub',
        amount: 320400,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'exception',
        reason: 'Amount > Policy Limit',
        exceptionType: 'policy_limit',
        ruleViolated: 'Policy CAP-04: Exceeds standard limit ₹300,000',
        aiExplanation: 'The invoice amount of ₹320,400 exceeds your company policy maximum threshold of ₹300,000.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `INV-00${batchId + 1}`,
        supplier: 'Global Supplies Ltd.',
        amount: 120500,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'exception',
        reason: 'Duplicate Invoice',
        exceptionType: 'duplicate_invoice',
        ruleViolated: 'Policy DUP-01: Identical supplier and amount in current billing cycle',
        aiExplanation: 'Flagged as duplicate of INV-00124 (same vendor, identical amount ₹120,500).',
        matchedEvidence: {
          matchedInvoiceId: 'INV-00124',
          supplier: 'Global Supplies Ltd.',
          amount: 120500,
          date: '09 Sep 2025',
          matchedFields: ['Supplier Name', 'Invoice Amount'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `INV-00${batchId + 2}`,
        supplier: 'Zeta Cloud Services',
        amount: 45200,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'clean',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const current = this.getInvoicesStore();
    this.saveInvoicesStore([...newInvoices, ...current]);

    // Record upload audit
    const auditLogs = this.getAuditStore();
    const now = new Date();
    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      invoiceId: `BATCH-${batchId}`,
      action: 'Batch Ingest Completed',
      previousStatus: 'None',
      newStatus: 'Resolved',
      reason: `Uploaded ${file.name} - 128 records parsed, 102 passed, 26 exceptions`,
      user: 'AP Ingest Worker',
    });
    this.saveAuditStore(auditLogs);

    return {
      total: 128,
      clean: 102,
      exceptions: 26,
      newInvoices,
    };
  }

  async chat(message: string): Promise<ChatMessage> {
    await delay(600);
    const lower = message.toLowerCase();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (lower.includes('124') || lower.includes('inv-00124')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Invoice INV-00124 was flagged as a Duplicate Invoice because it matches an existing record with the same supplier (Global Supplies Ltd.), amount (₹ 120,500) and date (09 Sep 2025).',
        timestamp: timeStr,
        matchedFields: ['Supplier Name', 'Invoice Amount', 'Invoice Date'],
        actionLabel: 'View Source Record',
        actionUrl: '/invoices/INV-00124',
      };
    }

    if (lower.includes('global supplies')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Found 5 exceptions for Global Supplies Ltd.',
        timestamp: timeStr,
        breakdownList: [
          { label: 'Duplicate Invoices', count: 3 },
          { label: 'Amount > Policy Limit', count: 1 },
          { label: 'Missing Tax Details', count: 1 },
        ],
        actionLabel: 'View All',
        actionUrl: '/invoices?search=Global+Supplies',
      };
    }

    if (lower.includes('pending') || lower.includes('how many')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'There are currently 18 invoices pending review across 6 different suppliers. The oldest pending item has been in queue for 3 business days.',
        timestamp: timeStr,
        actionLabel: 'Review Pending Invoices',
        actionUrl: '/invoices?status=pending',
      };
    }

    if (lower.includes('common') || lower.includes('most')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'The most common exception in the current period is Duplicate Invoices (8 occurrences, 31%), followed by Amount > Policy Limit (6 occurrences, 23%), and Missing Mandatory Fields (5 occurrences, 19%).',
        timestamp: timeStr,
        actionLabel: 'Inspect Exceptions Breakdown',
        actionUrl: '/exceptions',
      };
    }

    if (lower.includes('today') || lower.includes('exception')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Today there are 26 active exceptions flagged across the system. 18 of them require immediate human review before the end-of-day payment batch runs.',
        timestamp: timeStr,
        actionLabel: 'Open Exceptions Board',
        actionUrl: '/exceptions',
      };
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `I analyzed your AP query regarding "${message}". Based on the current invoice database of 128 records, 102 invoices auto-passed 3-way matching and 26 exceptions are active. You can filter by vendor, review evidence, or take action directly.`,
      timestamp: timeStr,
      actionLabel: 'Explore Invoices',
      actionUrl: '/invoices',
    };
  }
}

export const mockApi = new MockApiService();
