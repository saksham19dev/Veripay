from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.schemas.exception import ExceptionResponse


class LineItemSchema(BaseModel):
    id: Optional[str] = None
    description: str
    quantity: float = 1.0
    unitPrice: float = 0.0
    total: float = 0.0


class MatchedEvidenceSchema(BaseModel):
    matchedInvoiceId: str
    supplier: str
    amount: float
    date: str
    matchedFields: List[str]


class TaxInfoSchema(BaseModel):
    gstNumber: Optional[str] = None
    taxAmount: Optional[float] = None
    taxRate: Optional[float] = None
    isVerified: bool = True
    notes: Optional[str] = None


class InvoiceBase(BaseModel):
    id: str
    invoice_number: Optional[str] = None
    supplier: str
    supplier_id: Optional[str] = None
    date: str
    due_date: Optional[str] = None
    amount: float
    tax_amount: float = 0.0
    total_amount: float = 0.0
    currency: str = "INR"
    purchase_order: Optional[str] = None
    department: Optional[str] = "Operations"
    status: str = "clean"
    workflow_status: str = "AUTO_PASS"
    reason: Optional[str] = None
    exception_type: Optional[str] = None
    rule_violated: Optional[str] = None
    risk_score: int = 0
    risk_level: str = "LOW"
    payment_terms: Optional[str] = "Net 30"
    submitted_by: Optional[str] = None
    submitter_name: Optional[str] = None
    attachment_name: Optional[str] = None
    rfi_status: Optional[str] = "none"
    rfi_message: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    tax_details: Optional[Dict[str, Any]] = None
    matched_evidence: Optional[Dict[str, Any]] = None
    ai_explanation: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    line_items: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    # Direct camelCase aliases for React frontend components
    exceptionType: Optional[str] = None
    ruleViolated: Optional[str] = None
    taxDetails: Optional[Dict[str, Any]] = None
    matchedEvidence: Optional[Dict[str, Any]] = None
    aiExplanation: Optional[str] = None
    lineItems: Optional[List[Dict[str, Any]]] = None
    paymentTerms: Optional[str] = None
    submittedBy: Optional[str] = None
    submitterName: Optional[str] = None
    attachmentName: Optional[str] = None
    rfiStatus: Optional[str] = None
    rfiMessage: Optional[str] = None
    riskScore: Optional[int] = None
    riskLevel: Optional[str] = None
    workflowStatus: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    exceptions: Optional[List[ExceptionResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    totalPages: int


class InvoiceUploadResponse(BaseModel):
    total: int
    clean: int
    exceptions: int
    newInvoices: List[InvoiceResponse]


class AddNoteRequest(BaseModel):
    note: str
