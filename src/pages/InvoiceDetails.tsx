import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Calendar,
  CreditCard,
  ShieldCheck,
  Bot,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice } from '../types/invoice';
import { StatusBadge } from '../components/invoices/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/Loading';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isRequester, canApprove } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (id) loadInvoice(id);
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await api.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      showToast('Unable to load invoice details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!invoice) return;
    try {
      setIsAnalyzing(true);
      const res = await api.analyzeInvoice(invoice.id);
      setAiAnalysisResult(res);
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              aiExplanation: res.explanation,
              reason: res.reasons?.length ? res.reasons[0] : prev.reason,
            }
          : null
      );
      showToast('ML Risk & Exception Analysis Complete', 'success');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      showToast('AI analysis failed. Using rule-based assessment.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!invoice) return;
    try {
      setIsSubmitting(true);
      const updated = await api.approveInvoice(invoice.id, actionReason || 'Manual exception clearance');
      setInvoice(updated);
      setShowApproveModal(false);
      setActionReason('');
      showToast('Invoice approved successfully.', 'success');
    } catch {
      showToast('Failed to approve invoice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!invoice) return;
    try {
      setIsSubmitting(true);
      const updated = await api.rejectInvoice(invoice.id, actionReason || 'Policy non-compliance');
      setInvoice(updated);
      setShowRejectModal(false);
      setActionReason('');
      showToast('Invoice rejected and routed to vendor relations.', 'info');
    } catch {
      showToast('Failed to reject invoice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!invoice || !noteContent.trim()) return;
    try {
      setIsSubmitting(true);
      const updated = await api.addNote(invoice.id, noteContent);
      setInvoice(updated);
      setShowNoteModal(false);
      setNoteContent('');
      showToast('Note added to invoice audit trail.', 'success');
    } catch {
      showToast('Failed to add note.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner label="Loading invoice verification dossier..." />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Invoice Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested invoice identifier ({id}) was not found in the records.
        </p>
        <Button variant="primary" onClick={() => navigate('/invoices')}>
          Back to All Invoices
        </Button>
      </div>
    );
  }

  const isClean = invoice.status === 'clean';
  const isException = invoice.status === 'exception' || invoice.status === 'pending';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Current Status:</span>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Validation Banner: Clean vs Exception */}
      {isClean ? (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-emerald-900">
              ✓ Invoice passed validation
            </h2>
            <p className="text-xs text-emerald-700 mt-1">
              All 3-way matching criteria, tax compliance calculations, and vendor policy checks
              passed successfully. This record is queued for ERP sync.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-rose-900">
              ⚠ Exception detected
            </h2>
            <p className="text-xs text-rose-700 mt-1">
              Automated rules flagged potential discrepancies requiring human auditor review
              before payment authorization.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Left Invoice Data & Line Items, Right Evidence & AI Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Core Invoice Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Invoice Number
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {invoice.id}
                </h1>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Amount
                </span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  ₹ {invoice.amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Key Value Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Supplier</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  {invoice.supplier}
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Invoice Date</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  {invoice.date}
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Payment Terms</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  {invoice.paymentTerms || 'Net 30'}
                </span>
              </div>
            </div>

            {/* Tax Details Section */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tax Compliance Details</span>
              </h3>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">GSTIN Number</span>
                  <span className="font-mono font-bold text-slate-800">
                    {invoice.taxDetails?.gstNumber || 'Not Provided / Missing'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">GST Verification</span>
                  {invoice.taxDetails?.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      Active &amp; Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Unverified
                    </span>
                  )}
                </div>
                {invoice.taxDetails?.taxAmount && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Calculated GST</span>
                    <span className="font-bold text-slate-800">
                      ₹ {invoice.taxDetails.taxAmount.toLocaleString('en-IN')} (18%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line items if available */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Line Items
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] text-slate-400 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Rate</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            ₹ {item.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            ₹ {item.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Auditor Notes Trail */}
            {invoice.notes && invoice.notes.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Audit Notes
                </h3>
                <div className="space-y-1.5">
                  {invoice.notes.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700"
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Exception details, Evidence, AI Panel & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Explanation Card */}
          <div className="bg-white rounded-2xl border border-blue-200/80 shadow-soft p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI Explanation</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze with ML'}</span>
                </button>
              </div>
            </div>

            {aiAnalysisResult && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>ML Risk Score: {aiAnalysisResult.risk_score}/100</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      aiAnalysisResult.risk_level === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : aiAnalysisResult.risk_level === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : aiAnalysisResult.risk_level === 'MEDIUM'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {aiAnalysisResult.risk_level} RISK
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Deterministic Rules: +{aiAnalysisResult.rule_score}</span>
                  <span>ML Anomaly Score: +{aiAnalysisResult.ml_score}</span>
                </div>
                {aiAnalysisResult.recommendation && (
                  <p className="text-[11px] text-slate-700 italic border-t border-slate-200/60 pt-1.5">
                    {aiAnalysisResult.recommendation}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              {invoice.aiExplanation ||
                (isClean
                  ? 'All verification rules passed. The OCR extraction cross-referenced purchase order line items and vendor tax registries without any discrepancy.'
                  : `This invoice was flagged under policy ${invoice.ruleViolated || 'Exception policy'}. Review the matched evidence below.`)}
            </p>

            {/* Matched Fields List */}
            {invoice.matchedEvidence && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Matched Duplicate Fields:
                </span>
                <ul className="space-y-1">
                  {invoice.matchedEvidence.matchedFields.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence Box */}
            {invoice.matchedEvidence && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Evidence: Prior Matched Record</span>
                  <span className="font-mono text-xs">{invoice.matchedEvidence.matchedInvoiceId}</span>
                </div>
                <div className="text-[11px] text-amber-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Supplier:</span>
                    <span className="font-semibold">{invoice.matchedEvidence.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Amount:</span>
                    <span className="font-semibold">
                      ₹ {invoice.matchedEvidence.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Date:</span>
                    <span className="font-semibold">{invoice.matchedEvidence.date}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() =>
                      navigate(`/invoices/${invoice.matchedEvidence?.matchedInvoiceId}`)
                    }
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>View Source Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Rule Violated Box if policy limit */}
            {invoice.ruleViolated && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Rule Violated:</span>
                <p className="text-slate-600 leading-snug">{invoice.ruleViolated}</p>
              </div>
            )}

            <button
              onClick={() =>
                navigate(`/assistant?q=${encodeURIComponent(`Why was invoice ${invoice.id} flagged?`)}`)
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask AI Assistant more details</span>
            </button>
          </div>

          {/* Actions Card: Role-dependent */}
          {isRequester ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Requester Status &amp; Inquiries</h3>

              {invoice.rfiStatus === 'pending_response' ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <span>Auditor Request for Information (RFI)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-100">
                    "{invoice.rfiMessage || 'Please provide clarification or updated tax details.'}"
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Your Response / Clarification
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Verified with supplier. This is the revised delivery invoice..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">Attach corrected document:</span>
                      <button
                        type="button"
                        onClick={() => showToast('Corrected document attached (PO-revised.pdf)', 'info')}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        + Attach File
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      isLoading={isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                          invoice.rfiStatus = 'resolved';
                          invoice.notes = [...(invoice.notes || []), `Requester Response: ${actionReason || 'Clarification and corrected invoice provided.'}`];
                          setIsSubmitting(false);
                          setActionReason('');
                          showToast('Response submitted to AP Auditor queue!', 'success');
                        }, 500);
                      }}
                    >
                      Submit Response to Auditor
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <p className="font-semibold text-slate-800 mb-1">Separation of Duties Notice:</p>
                    Requesters can track and submit documents. Exception approval is managed by Accounts Payable.
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNoteModal(true)}
                  >
                    Add Submitter Note
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Auditor Actions</h3>

              {isException ? (
                <div className="space-y-2.5">
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => setShowApproveModal(true)}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Approve Invoice Exception
                  </Button>

                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setShowRejectModal(true)}
                    icon={<X className="w-4 h-4" />}
                  >
                    Reject &amp; Return to Supplier
                  </Button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNoteModal(true)}
                    >
                      Add Note
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={async () => {
                        await handleApprove();
                        showToast('Marked as reviewed and cleared', 'success');
                      }}
                    >
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Approved &amp; Ready for ERP Disbursement.</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNoteModal(true)}
                  >
                    Add Auditor Note
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Approve */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Invoice Exception"
        subtitle={`Invoice: ${invoice.id} (${invoice.supplier})`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to approve this exception? Approving will override the flagged
            rule and release the invoice for disbursement batch payment.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approval Justification / Note (Optional)
            </label>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Validated with procurement manager via email ticket #884."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApproveModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleApprove}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Reject */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Invoice"
        subtitle={`Invoice: ${invoice.id} (${invoice.supplier})`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Please specify the reason for rejecting this invoice. An audit notification will be
            sent to Accounts Payable and the vendor.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejection Reason (Required)
            </label>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Duplicate invoice submission; vendor credit note requested."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Auditor Note"
        subtitle={`Invoice: ${invoice.id}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Auditor Comment
            </label>
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Type your notes here to record in permanent audit trail..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNoteModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleAddNote}
            >
              Save Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
