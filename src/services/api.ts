import { mockApi, AppSettings } from './mockApi';
import { Invoice, DashboardStats, InvoiceStatus } from '../types/invoice';
import { AuditLogEntry } from '../types/audit';
import { ChatMessage } from '../types/chat';

const API_BASE = import.meta.env.VITE_API_URL || '';
const USE_REAL_BACKEND = Boolean(API_BASE && API_BASE.trim() !== '');

class ApiService {
  private baseUrl = API_BASE;

  // Helper for real fetch calls with fallback to mock
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    mockFallback?: () => Promise<T>
  ): Promise<T> {
    if (!USE_REAL_BACKEND) {
      if (mockFallback) return mockFallback();
      throw new Error('No backend URL provided and no mock fallback specified');
    }

    try {
      const activeRole = localStorage.getItem('veriflow_active_role_v1') || 'AP_REVIEWER';
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': activeRole,
          ...(options?.headers || {}),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`Real API endpoint ${endpoint} failed or unreachable, switching to mock:`, err);
      if (mockFallback) {
        return mockFallback();
      }
      throw err;
    }
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>(
      '/api/dashboard/stats',
      { method: 'GET' },
      () => mockApi.fetchDashboardStats()
    );
  }

  // Invoices list with filters & pagination
  async getInvoices(params?: {
    status?: string;
    exceptionType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.exceptionType) query.set('exceptionType', params.exceptionType);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request(
      `/api/invoices?${query.toString()}`,
      { method: 'GET' },
      () => mockApi.fetchInvoices(params)
    );
  }

  // Single Invoice
  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.request<Invoice | null>(
      `/api/invoices/${id}`,
      { method: 'GET' },
      () => mockApi.fetchInvoiceById(id)
    );
  }

  // Approve Exception Invoice
  async approveInvoice(id: string, note?: string): Promise<Invoice> {
    return this.request<Invoice>(
      `/api/exceptions/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ note }),
      },
      () => mockApi.approveInvoice(id, note)
    );
  }

  // Reject Exception Invoice
  async rejectInvoice(id: string, reason: string): Promise<Invoice> {
    return this.request<Invoice>(
      `/api/exceptions/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      () => mockApi.rejectInvoice(id, reason)
    );
  }

  // Add Note to Invoice
  async addNote(id: string, note: string): Promise<Invoice> {
    return this.request<Invoice>(
      `/api/invoices/${id}/note`,
      {
        method: 'POST',
        body: JSON.stringify({ note }),
      },
      () => mockApi.addNote(id, note)
    );
  }

  // Upload Invoice Batch
  async uploadInvoices(
    file: File,
    onProgress?: (step: number, stepName: string) => void
  ): Promise<{ total: number; clean: number; exceptions: number; newInvoices: Invoice[] }> {
    if (USE_REAL_BACKEND) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const role = localStorage.getItem('veriflow_active_role_v1') || 'AP_REVIEWER';
        const res = await fetch(`${this.baseUrl}/api/invoices/upload`, {
          method: 'POST',
          headers: {
            'X-User-Role': role,
          },
          body: formData,
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Real upload failed, using simulation:', e);
      }
    }
    return mockApi.processUpload(file, onProgress);
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>(
      '/api/audit-log',
      { method: 'GET' },
      () => mockApi.fetchAuditLogs()
    );
  }

  // AI Assistant Chat
  async sendChatMessage(message: string, invoiceId?: string): Promise<ChatMessage> {
    return this.request<ChatMessage>(
      '/api/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, invoice_id: invoiceId }),
      },
      () => mockApi.chat(message)
    );
  }

  // AI Module Endpoints
  async analyzeInvoice(invoiceId: string): Promise<any> {
    return this.request(
      `/api/ai/analyze/${invoiceId}`,
      { method: 'POST' },
      async () => {
        const inv = await mockApi.fetchInvoiceById(invoiceId);
        return {
          invoice_id: invoiceId,
          risk_score: inv?.status === 'clean' ? 0 : 75,
          risk_level: inv?.status === 'clean' ? 'LOW' : 'HIGH',
          rule_score: inv?.status === 'clean' ? 0 : 45,
          ml_score: inv?.status === 'clean' ? 5 : 30,
          reasons: inv?.reason ? [inv.reason] : [],
          evidence: inv?.matchedEvidence || {},
          explanation: inv?.aiExplanation || 'Deterministic checks evaluated.',
          recommendation: inv?.status === 'clean' ? 'Likely clean. Auto-pass permitted.' : 'Manual review required.',
          model_version: 'veriflow-risk-v1',
        };
      }
    );
  }

  async getInvoiceExplanation(invoiceId: string): Promise<any> {
    return this.request(
      `/api/ai/explanation/${invoiceId}`,
      { method: 'GET' },
      async () => {
        const inv = await mockApi.fetchInvoiceById(invoiceId);
        return {
          invoice_id: invoiceId,
          explanation: inv?.aiExplanation || 'Invoice verified.',
          risk_level: inv?.status === 'clean' ? 'LOW' : 'HIGH',
          risk_score: inv?.status === 'clean' ? 0 : 75,
        };
      }
    );
  }

  // Settings
  getSettings(): AppSettings {
    return mockApi.getSettings();
  }

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    return mockApi.updateSettings(settings);
  }
}

export const api = new ApiService();
