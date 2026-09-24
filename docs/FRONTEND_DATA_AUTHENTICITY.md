# TRACE//GOA — Frontend Data Authenticity Audit Report

> **Standard of Assessment**: Verification of real backend API consumption vs client-side mocks or hardcoded data.
> **Date**: September 23, 2026

---

## 1. Frontend Data Ingestion Audit Matrix

Every view and tab in the TRACE//GOA interface was inspected to determine whether data displayed is sourced from live backend API endpoints, client-side mocks, or hardcoded UI constants.

| Interface View / Tab | Component File | Real API Data? | Mock Data? | Hardcoded Data? | Forensic Evidence & Data Flow |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **COMMAND** | `App.tsx` | **YES** | **NO** | **NO** | Consumes `GET /api/metrics` and `GET /api/investigations`. All 20 active dockets, risk scores, confidence tiers, and statuses are loaded dynamically from SQLite `cases.db`. |
| **TRACE** | `App.tsx`, `TimelineViewer.tsx` | **YES** | **NO** | **NO** | Consumes `GET /api/investigations/{case_id}` and `POST /api/investigations/{case_id}/run`. Execution timeline `[01]`–`[15]` displays real timestamps, step statuses, and tool execution rationale. |
| **NETWORK** | `GraphViewer.tsx` | **YES** | **NO** | **NO** | Consumes `GET /api/investigations/{case_id}/graph?depth=2`. Node coordinates, labels, and edge links are rendered dynamically from TigerGraph REST++ or NetworkX graph client. |
| **SIGNALS** | `EvidencePanel.tsx` | **YES** | **NO** | **NO** | Bound to `caseData.supporting_evidence`, `caseData.contradicting_evidence`, and `caseData.missing_evidence`. Updated dynamically when agent investigation completes. |
| **GUARDRAILS** | `EvidencePanel.tsx` | **YES** | **NO** | **NO** | Consumes `GET /api/policies`. Retrieves institutional rules (`POL-001` through `POL-003`, `REG-BSA-001`, `REG-E-001`) from GraphRAG institutional knowledge base. |
| **CLEARANCE** | `ApprovalCenter.tsx` | **YES** | **NO** | **NO** | Filters active cases where `c.status === "AWAITING_APPROVAL"`. Submits electronic sign-off payloads via `POST /api/investigations/{case_id}/actions/approve`, enforcing RBAC permissions. |
| **LEDGER** | `DecisionLedgerViewer.tsx` | **YES** | **NO** | **NO** | Consumes `GET /api/investigations/{case_id}/decisions` and `POST /api/ledger/verify?case_id={caseId}`. Live SHA-256 hash-chained block hashes are validated dynamically against `decision_ledger.db`. |
| **MEMORY** | `EvidencePanel.tsx` | **YES** | **NO** | **NO** | Consumes `GET /api/investigations/{case_id}/memory`. Retrieves past closed investigations from SQLite `case_memory.db` matching topological fraud patterns. |
| **TRIALS** | `DemoWalkthrough.tsx` | **YES** | **NO** | **PARTIALLY** | The 7-case dropdown selector contains predefined case names (`DEMO_CASES` constant), but clicking **RUN TRIAL** triggers real backend API execution (`fetchCaseGraph` and `runInvestigation`). |

---

## 2. Key Findings & Recommendations

1. **No Simulated Frontend Stores**: Unlike toy mockups, the TRACE//GOA frontend maintains zero mock state stores (`faker.js`, dummy in-memory arrays, or client-side fake timeouts).
2. **Clean Contract Coupling**: All frontend components interact exclusively with the backend via `frontend/src/services/api.ts` connecting to port `8000`.
3. **TRIALS Case Selector**: The dropdown in `DemoWalkthrough.tsx` currently has 7 hardcoded case labels for convenience. This should dynamically fetch the full 20 benchmark case docket list from `GET /api/investigations` so that any case can be tested in trial mode.
