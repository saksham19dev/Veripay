# VeriFlow Backend — AI-Assisted Invoice Exception Detection Engine

VeriFlow is an enterprise-grade, explainable invoice exception detection and compliance verification backend.

> **Core Philosophy:**
> **"Detect → Explain → Review → Record"**
> VeriFlow does **NOT** automatically declare invoices "fake" or claim "100% fraud detection". Instead, it validates invoices against deterministic accounting rules, flags anomalies, duplicates, and policy violations, computes an explainable risk score, and routes suspicious items to human accounts payable reviewers for verified resolution.

---

## 1. System Architecture

```
                       ┌──────────────────────┐
                       │  Uploaded Document   │
                       │   (CSV / XLSX / XLS) │
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │ Field Normalization  │
                       │ & Alias Resolution   │
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │ Deterministic Rules  │
                       │ & Duplicate Service  │
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │ Explainable Scoring  │
                       │ (0-100 Risk Engine)  │
                       └──────────┬───────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      ┌────────────────────┐            ┌────────────────────┐
      │     AUTO-PASS      │            │    HUMAN REVIEW    │
      │ (Status: "clean")  │            │ (Status: Exception)│
      └──────────┬─────────┘            └──────────┬─────────┘
                 │                                 ▼
                 │                      ┌────────────────────┐
                 │                      │   AI Explanation   │
                 │                      │   & Evidence View  │
                 │                      └──────────┬─────────┘
                 │                                 ▼
                 │                      ┌────────────────────┐
                 │                      │  Auditor Action:   │
                 │                      │  Approve / Reject  │
                 │                      └──────────┬─────────┘
                 │                                 │
                 └────────────────┬────────────────┘
                                  ▼
                       ┌──────────────────────┐
                       │ Immutable Audit Log  │
                       │ (Compliance History) │
                       └──────────────────────┘
```

---

## 2. Technology Stack

- **Python 3.11+** (Tested on Python 3.14)
- **FastAPI** — High-performance asynchronous API framework
- **Pydantic v2 & Pydantic-Settings** — Strict type validation and settings management
- **SQLAlchemy 2.0** — Database ORM (PostgreSQL-compatible architecture, SQLite default for local development)
- **Pandas & OpenPyXL** — Ingestion and normalization of multi-format invoice files (CSV, XLSX, XLS)
- **Uvicorn** — Production ASGI web server
- **Pytest & Pytest-Asyncio** — Comprehensive rule, engine, and endpoint test suite

---

## 3. Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entry point, CORS, lifespan, exception handlers
│   ├── config.py                # Environment and business rule configurations
│   ├── database.py              # SQLAlchemy engine, session factory, get_db dependency
│   │
│   ├── models/                  # SQLAlchemy ORM Models
│   │   ├── user.py              # User profiles & role-based access
│   │   ├── invoice.py           # Invoices, line items, metadata, status
│   │   ├── exception.py         # Exception records, evidence, resolution
│   │   ├── audit_log.py         # Immutable audit history
│   │   ├── chat.py              # AI Assistant query logs
│   │   └── setting.py           # Dynamic company policy rules
│   │
│   ├── schemas/                 # Pydantic Schemas (FastAPI & Frontend compatible)
│   │   ├── user.py
│   │   ├── invoice.py
│   │   ├── exception.py
│   │   ├── dashboard.py
│   │   ├── audit.py
│   │   ├── chat.py
│   │   └── setting.py
│   │
│   ├── api/                     # API Routers
│   │   ├── deps.py              # Role-based access control & user context
│   │   ├── invoices.py          # Upload, query, filter, detail, notes, delete
│   │   ├── exceptions.py        # List, detail, approve, reject, notes
│   │   ├── dashboard.py         # Stats, growth metrics, category breakdowns
│   │   ├── audit.py             # Immutable audit log queries
│   │   ├── chat.py              # Context-grounded AI Assistant
│   │   ├── users.py             # Current user context & user roster
│   │   └── settings.py          # Manager policy limits & threshold config
│   │
│   ├── services/                # Core Business Logic Services
│   │   ├── invoice_service.py   # Multi-format ingestion, column normalization
│   │   ├── validation_service.py# Rule coordination, risk score calculations
│   │   ├── duplicate_service.py # Exact & fuzzy similarity duplicate detection
│   │   ├── exception_service.py # Review workflow & auditor clearance
│   │   ├── dashboard_service.py # Aggregates, trends, rates
│   │   ├── audit_service.py     # Immutable compliance trail recording
│   │   └── ai_service.py        # Explainable AI summaries & grounded Q&A
│   │
│   └── rules/                   # Deterministic Rule Engine
│       ├── base.py              # BaseRule & RuleResult interfaces
│       ├── required_fields.py   # RULE 1: Mandatory field checks
│       ├── amount_rules.py      # RULE 2: Positivity & numeric integrity
│       ├── tax_rules.py         # RULE 3: Tax calculation & tolerance consistency
│       ├── date_rules.py        # RULE 4: Chronological integrity & future dates
│       ├── policy_rules.py      # RULE 5: High-value policy threshold checks
│       └── duplicate_rules.py   # Duplicate invoice matching
│
├── sample_data/                 # Ready-to-upload demo files
│   ├── sample_invoices.csv
│   └── sample_invoices.xlsx
│
├── tests/                       # Automated Pytest suite
│   ├── test_rules.py
│   ├── test_validation_engine.py
│   └── test_api_endpoints.py
│
├── uploads/                     # Upload storage directory
├── requirements.txt             # Python dependencies
├── .env.example                 # Configuration blueprint
├── .env                         # Local environment settings
├── seed.py                      # Realistic demo data seeder
└── README.md
```

---

## 4. Installation & Setup

### Step 1: Create and Activate Virtual Environment

From the project root (`d:\VERIPAY`):

```bash
# Windows:
python -m venv backend\venv
backend\venv\Scripts\activate

# Linux/macOS:
python3 -m venv backend/venv
source backend/venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cd backend
copy .env.example .env   # Windows
# or: cp .env.example .env (Linux/macOS)
```

Default settings in `.env`:
```ini
DATABASE_URL=sqlite:///./veriflow.db
MAX_AUTO_APPROVAL_AMOUNT=300000.0
DUPLICATE_WINDOW_DAYS=30
TAX_TOLERANCE_PERCENTAGE=1.0
AI_PROVIDER=mock
```

---

## 5. Seed Demo Data

Run the seeder to populate the SQLite database with realistic scenarios:

```bash
# From d:\VERIPAY:
backend\venv\Scripts\python.exe backend/seed.py
```

This populates:
1. **Clean Invoice (`INV-00123`)** — Passes all rules → **AUTO-PASS**
2. **Duplicate Invoice (`INV-00124`)** — Matches `INV-00120` on vendor, amount (₹120,500), and date → **HIGH Risk Exception**
3. **Tax Mismatch (`INV-00125`)** — Base ₹80,000 + Tax ₹9,500 ≠ Billed ₹96,500 → **HUMAN REVIEW**
4. **Policy Limit Invoice (`INV-00126`)** — Amount ₹345,000 exceeds company threshold of ₹300,000 → **POLICY VIOLATION**
5. **Missing Fields Invoice (`INV-00127`)** — Missing mandatory invoice number → **EXCEPTION**
6. **Users & Roles**:
   - `Alex Rivera` (`REQUESTER`)
   - `Jordan Lee` (`AP_REVIEWER`)
   - `Elena Rostova` (`FINANCE_MANAGER`)
7. **Compliance Audit Logs**

---

## 6. Running the Backend Server

Start Uvicorn:

```bash
# Navigate to backend/
cd backend
..\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# or with active virtual environment:
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Server endpoints:
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc Documentation: `http://127.0.0.1:8000/redoc`
- Health Check: `http://127.0.0.1:8000/health`

---

## 7. Connecting to the React Frontend

The frontend communicates with the backend via `VITE_API_URL`.

Ensure `.env` in the root workspace has:
```ini
VITE_API_URL=http://localhost:8000
```

Start the Vite development frontend:
```bash
# In project root:
npm run dev
```
Open `http://localhost:5173` in your browser. All stats, tables, filters, uploads, chat assistant, and approvals will run against the real FastAPI backend!

---

## 8. Role-Based Access Control (RBAC)

The backend enforces permissions on every request using headers:
- `X-User-Role`: `REQUESTER` | `AP_REVIEWER` | `FINANCE_MANAGER`
- `X-User-Id`: User ID (e.g. `usr-rev-02`)
- `X-User-Name`: User Display Name

| Capability | REQUESTER | AP_REVIEWER | FINANCE_MANAGER |
|---|:---:|:---:|:---:|
| Upload Invoices | Yes | Yes | Yes |
| View Own Submissions | Yes | Yes | Yes |
| View All Invoices | No (Forbidden) | Yes | Yes |
| Approve / Reject Exceptions | No (HTTP 403) | Yes | Yes |
| Add Reviewer Notes | No | Yes | Yes |
| Configure Policy Rules | No (HTTP 403) | No (HTTP 403) | Yes |
| View Audit Logs | No | Yes | Yes |

---

## 9. Running the Automated Tests

Run the complete test suite using Pytest:

```bash
backend\venv\Scripts\pytest backend/tests -v
```

Tests include:
- Required field validation
- Amount anomaly & negative value detection
- Tax consistency and tolerance calculations
- Date and chronologic ordering checks
- Policy threshold violations
- Duplicate invoice detection (exact and fuzzy vendor matching)
- Auto-pass vs Human-review decision routing
- Risk scoring and categorization (LOW, MEDIUM, HIGH, CRITICAL)
- CSV file upload pipeline
- Auditor approve/reject workflow & immutable audit logging
- Role-based authorization enforcement
- AI Assistant grounded Q&A

---

## 10. Example API Requests

### 1. Ingest Invoices from File
```bash
curl -X POST "http://localhost:8000/api/invoices/upload" \
  -H "X-User-Role: AP_REVIEWER" \
  -F "file=@backend/sample_data/sample_invoices.csv"
```

### 2. Get Dashboard Stats
```bash
curl -X GET "http://localhost:8000/api/dashboard/stats" \
  -H "X-User-Role: AP_REVIEWER"
```

### 3. Approve an Exception
```bash
curl -X POST "http://localhost:8000/api/exceptions/INV-00125/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Role: AP_REVIEWER" \
  -d '{"note": "Vendor provided credit note reconcilation CN-401"}'
```

### 4. Query AI Assistant
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Why was invoice INV-00124 flagged?", "invoice_id": "INV-00124"}'
```
