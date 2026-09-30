# VeriFlow - AI-Powered AP Invoice Exception Management

> **"Smarter invoice processing. Faster exception resolution."**

VeriFlow is an enterprise SaaS frontend for automated Accounts Payable (AP) invoice exception handling, duplicate detection, and compliance auditing.

---

## 👥 Role-Based User Portals (RBAC)

VeriFlow provides three tailored role experiences sharing the same underlying invoice ledger, exception engine, AI copilot, and audit trail:

### 1. 💼 Requester / Business User Portal (`/requester/*`)
- **Active User**: *Alex Rivera* (Business Requisitioner - Procurement)
- **Navigation**: Dashboard, Submit Invoice, My Invoices, Notifications, Profile
- **Permissions**:
  - Submit invoices with receipt & PO attachments.
  - Live pre-validation check (detects duplicate submissions & spend limits before filing).
  - Track real-time verification stage (`Submitted` → `Validation` → `AP Review` → `Approved & Paid`).
  - Respond to AP Auditor Requests for Information (RFI) & upload corrected invoices.
  - **Strictly Restricted**: Cannot approve/reject invoices, modify policies, or view other departments' confidential submissions.

### 2. 🔍 AP / Finance Reviewer Portal (Primary AP Hub)
- **Active User**: *Jordan Lee* (Senior AP Auditor)
- **Navigation**: Dashboard, Upload Invoices, All Invoices, Exceptions, AI Assistant, Audit Log, Settings
- **Permissions**:
  - Review exceptions, duplicate matches, and tax anomalies.
  - AI Assistant root-cause analysis with matched fields.
  - Approve or Reject exceptions with reason modals & toast alerts.
  - Request Information (RFI) from business requesters.
  - Full audit logging & CSV export.

### 3. 👑 Finance Manager / Admin Portal (`/manager/*`)
- **Active User**: *Elena Rostova* (VP Finance & Operations)
- **Navigation**: Dashboard, Invoices, Exceptions, Analytics, Users & Roles, Policy Rules, Audit Log, Settings
- **Permissions**:
  - Executive oversight KPIs (Total spend volume, touchless rate, risk exposure).
  - Deep Recharts analytics (monthly ingestion trajectories, vendor risk rankings, resolution SLAs).
  - AP team reviewer workload and velocity monitoring.
  - Policy rules engine configuration (corporate spend caps, department-level limits, duplicate window).
  - User role provisioning and separation of duties matrix.

> **Instant Demo Switcher**: Use the **Portal Switcher** dropdown in the top header to seamlessly toggle between the 3 portals with zero friction!

---

## 🚀 Key Features & Workflow

1. **Enterprise Dashboard (`/dashboard`)**:
   - Exact visual reproduction of the design specification and screenshot.
   - **4 KPI Cards**: Total Invoices (128), Auto-Passed (102), Exceptions (26), Pending Review (18) with monthly trends.
   - **Interactive Invoices Table**: Status tabs (`All (128)`, `Clean (102)`, `Exceptions (26)`, `Pending Review (18)`), pagination, row selection, quick review actions.
   - **Exception Breakdown**: Interactive donut chart with centered total and categorized drill-down.
   - **Recent Activity Feed**: Real-time audit events with severity indicators.
   - **Mobile App & Quick Action Promo Card**: Native-style companion card.
   - **Integrated AI Assistant Panel**: Interactive chat widget with suggested prompts, matched field tags, and source links.

2. **Upload Invoices (`/upload`)**:
   - Drag-and-drop CSV and XLSX file uploader with file validation.
   - Download sample CSV templates.
   - One-click standard demo batch load (128 records).
   - Animated 6-stage verification progress (File upload → Normalize → Validate → Duplicate Check → Results).
   - Summary results card with direct link to Exceptions.

3. **All Invoices Ledger (`/invoices`)**:
   - Multi-field search (invoice #, vendor, amount).
   - Filters for status, exception type, and vendor.
   - Multi-criteria sorting (Date, Amount, Invoice ID) and pagination.
   - CSV export functionality.

4. **Invoice Verification Dossier (`/invoices/:id`)**:
   - Dynamic banner for **Clean (Auto-Passed)** vs **Exception Detected**.
   - Tax compliance validation (GSTIN, verification status, calculated taxes).
   - Multi-tier evidence panel displaying matched duplicate invoices side-by-side.
   - AI explanation card highlighting matched fields and rule violations.
   - Auditor actions with confirmation modals (Approve, Reject, Add Note, Mark Reviewed).
   - Real-time toast notifications and audit trail appending.

5. **Dedicated Exceptions Hub (`/exceptions`)**:
   - Triage dashboard with severity scoring (Critical, High, Medium, Low).
   - Quick filters for Duplicate Invoices, Policy Limits, Missing Fields, and Tax Issues.

6. **Audit Log & Compliance Trail (`/audit-log`)**:
   - Immutable audit history with timestamp, invoice ID, action taken, status transitions (`Previous → New`), reason, and auditor.
   - Searchable and exportable to CSV for SOX compliance.

7. **AI Assistant (`/assistant`)**:
   - Full-page AP Copilot with natural language querying.
   - Handles root-cause exception analysis, vendor summary requests, and batch inquiries.

8. **Settings & Policy Engine (`/settings`)**:
   - Configurable policy thresholds (e.g., Maximum Invoice Amount of ₹300,000).
   - Duplicate detection lookback window (days) and auto-approval confidence thresholds.
   - Email & Slack dispatch preferences.

---

## 🛠 Tech Stack

- **React 19** with **TypeScript**
- **Vite** (Fast dev server and optimized production build)
- **Tailwind CSS** (Custom enterprise design system)
- **React Router v7** (Client-side routing)
- **Recharts** (Exception breakdown donut chart)
- **Lucide React** (Clean enterprise icons)

---

## 💻 Running the Application

### 1. Start the Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173/`

### 2. Build for Production
```bash
npm run build
```

---

## 🔌 Connecting to FastAPI Backend

The frontend contains a centralized API service layer in [src/services/api.ts](file:///d:/VERIPAY/src/services/api.ts).

To connect to your real FastAPI backend, specify the `VITE_API_URL` environment variable:

```bash
# In .env or .env.local:
VITE_API_URL=http://localhost:8000
```

When `VITE_API_URL` is set, API calls (`GET /api/invoices`, `POST /api/chat`, `POST /api/invoices/upload`, `POST /api/exceptions/:id/approve`, etc.) will query the FastAPI backend. If the backend is offline or not configured, it seamlessly falls back to the interactive mock service [src/services/mockApi.ts](file:///d:/VERIPAY/src/services/mockApi.ts) with full `localStorage` persistence.
