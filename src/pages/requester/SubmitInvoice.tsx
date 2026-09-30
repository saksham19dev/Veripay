import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  Building,
  FileText,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { Invoice } from '../../types/invoice';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';

export const SubmitInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('Procurement');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: 'clean' | 'exception';
    reason?: string;
    explanation?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !invoiceNumber || !amount || amount <= 0) {
      showToast('Please fill in all mandatory invoice fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Simulate VeriFlow Validation Engine checks
    setTimeout(async () => {
      const numAmount = Number(amount);
      const isOverLimit = numAmount > 300000;
      const isDuplicate = supplier.toLowerCase().includes('global') && numAmount === 120500;

      let status: 'clean' | 'exception' = 'clean';
      let reason: string | undefined = undefined;
      let exceptionType: any = undefined;
      let explanation: string | undefined = undefined;

      if (isDuplicate) {
        status = 'exception';
        reason = 'Duplicate Invoice';
        exceptionType = 'duplicate_invoice';
        explanation = 'Matches existing record from Global Supplies Ltd. with identical amount.';
      } else if (isOverLimit) {
        status = 'exception';
        reason = 'Amount > Policy Limit';
        exceptionType = 'policy_limit';
        explanation = `Requisition amount ₹${numAmount.toLocaleString('en-IN')} exceeds standard corporate limit of ₹300,000.`;
      }

      const formattedDate = new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newInvoice: Invoice = {
        id: invoiceNumber.toUpperCase(),
        supplier,
        amount: numAmount,
        date: formattedDate,
        status,
        reason,
        exceptionType,
        ruleViolated: reason ? `Policy check triggered: ${reason}` : undefined,
        aiExplanation: explanation,
        department,
        submittedBy: 'usr-req-01',
        submitterName: 'Alex Rivera',
        attachmentName: selectedFile?.name || 'Uploaded_Invoice_Attachment.pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // In real backend: POST /api/invoices/submit
        // Here, add to shared localStorage store:
        const store = JSON.parse(localStorage.getItem('veriflow_invoices_v1') || '[]');
        store.unshift(newInvoice);
        localStorage.setItem('veriflow_invoices_v1', JSON.stringify(store));

        // Append to audit log
        const auditStore = JSON.parse(localStorage.getItem('veriflow_audit_v1') || '[]');
        auditStore.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: formattedDate,
          invoiceId: newInvoice.id,
          action: 'Invoice Submitted by Requester',
          previousStatus: 'None',
          newStatus: status,
          reason: status === 'clean' ? 'Automated 3-way check passed' : `Flagged: ${reason}`,
          user: 'Alex Rivera (Requester)',
        });
        localStorage.setItem('veriflow_audit_v1', JSON.stringify(auditStore));

        setIsSubmitting(false);
        setValidationResult({ status, reason, explanation });

        if (status === 'clean') {
          showToast('Invoice submitted and passed validation checks!', 'success');
        } else {
          showToast(`Invoice submitted. Exception flagged: ${reason}`, 'warning');
        }
      } catch (err) {
        console.error('Error submitting invoice:', err);
        setIsSubmitting(false);
        showToast('Failed to submit invoice.', 'error');
      }
    }, 700);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit Invoice</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload an invoice for automated AI extraction, policy validation, and AP routing.
        </p>
      </div>

      {/* Validation Result Banner (if just submitted) */}
      {validationResult && (
        <div
          className={`p-5 rounded-2xl border ${
            validationResult.status === 'clean'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          } animate-in fade-in-50`}
        >
          <div className="flex items-start gap-3">
            {validationResult.status === 'clean' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-sm font-bold">
                {validationResult.status === 'clean'
                  ? 'Auto-Pass: Invoice Clean and Verified'
                  : `Exception Detected: ${validationResult.reason}`}
              </h3>
              <p className="text-xs mt-1 opacity-90">
                {validationResult.status === 'clean'
                  ? 'All 3-way matching criteria passed. Your invoice is scheduled for payment disbursement.'
                  : `${validationResult.explanation} It has been routed to the AP Reviewer queue for resolution.`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate(`/invoices/${invoiceNumber.toUpperCase()}`)}
                >
                  View Submission Dossier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setValidationResult(null);
                    setSupplier('');
                    setInvoiceNumber('');
                    setAmount('');
                    setSelectedFile(null);
                  }}
                >
                  Submit Another
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-8 space-y-6"
      >
        {/* File Upload Zone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Invoice Document (PDF, Image, or CSV) *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
          >
            <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to upload invoice document'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready for OCR Ingest`
                : 'Supports PDF, JPEG, PNG or XLSX (Max 25MB)'}
            </p>
          </div>
        </div>

        {/* Invoice Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Supplier / Vendor Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Logistics Hub"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Invoice Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. INV-00142"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Gross Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                required
                min={1}
                placeholder="250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            {amount !== '' && Number(amount) > 300000 && (
              <span className="text-[11px] text-amber-600 mt-1 block">
                Note: Amounts &gt; ₹300,000 will route to VP Finance for secondary sign-off.
              </span>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Invoice Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Procurement">Procurement</option>
              <option value="IT Infrastructure">IT Infrastructure</option>
              <option value="Facilities & Operations">Facilities &amp; Operations</option>
              <option value="Corporate Marketing">Corporate Marketing</option>
              <option value="Legal & Advisory">Legal &amp; Advisory</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Purchase Order (PO) #</label>
            <input
              type="text"
              placeholder="e.g. PO-2025-991"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Business Justification / Purpose
          </label>
          <textarea
            rows={3}
            placeholder="Briefly describe the goods delivered or services rendered..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Compliance Notice */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            VeriFlow automatically performs 3-way matching against approved POs and vendor tax
            registries. You will receive real-time notifications on verification status.
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/requester/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<FileCheck2 className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            Submit for Validation
          </Button>
        </div>
      </form>
    </div>
  );
};
