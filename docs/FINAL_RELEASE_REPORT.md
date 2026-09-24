# TRACE//GOA — Final Submission & Release Report

**Project**: TRACE//GOA  
**Tagline**: *Trace the signal. Find the network. Make the move.*  
**Track**: TigerGraph Agentic Fraud Investigation Track (Hacker House Goa 2026)  
**Submission Date**: 24 September 2026  
**Final Release Status**: **PRODUCTION CANDIDATE — 100% PASS**

---

## 1. Release Overview

TRACE//GOA is a graph-native agentic fraud investigation engine designed to eliminate alert fatigue, detect multi-entity fraud rings, and synthesize legally defensible, policy-compliant Next-Best Actions (NBAs). By orchestrating **TigerGraph (GSQL)** via the **Model Context Protocol (MCP)**, **Google Gemini 2.5 Flash**, an **Adaptive Evidence Loop**, and a **Deterministic Policy Engine (R1–R10)**, TRACE//GOA achieves industry-grade accuracy with mathematical auditability.

---

## 2. Hard Verification Gates Passed

Every quality and compliance gate required for submission has been verified through live command execution:

| Gate | Requirement | Live Result | Status |
| :--- | :--- | :--- | :---: |
| **Security & Secrets** | 0 committed keys or tokens | 0 secrets found across all commits and working tree | **PASSED** |
| **Repository Size** | Total repo size < 100 MB | **66.11 MiB** pack size | **PASSED** |
| **Backend Test Suite** | 0 failures in pytest | **43 passed in 13.16s** (33 unit, 10 integration) | **PASSED** |
| **Benchmark Validation** | 20 schema-valid outputs | **20/20 valid** (`python scripts/validate_outputs.py`) | **PASSED** |
| **Frontend Lint** | 0 lint errors/warnings | **0 errors, 0 warnings** (oxlint on 31 files) | **PASSED** |
| **Frontend Build** | Clean Vite production build | **Compiled in 620ms** (`dist/` 348 kB gzip-optimized) | **PASSED** |
| **Cryptographic Honesty** | Zero fake "Merkle" claims | **100% SHA-256 Hash-Chained Decision Ledger** | **PASSED** |
| **Reproducibility** | One-command execution | Tested with `.\scripts\run_all.ps1` & `scripts/run_all.sh` | **PASSED** |

---

## 3. Canonical Performance Metrics

All metrics below originate from the single source of benchmark ground truth in `outputs/benchmark/canonical_results.json`:

### A. Historical Generalization (5,565 Closed Cases)
- **Model Accuracy**: **87.24%**
- **Majority-Class Baseline**: **83.65%**
- **Accuracy Lift**: **+3.59 percentage points** (+3.59 pp)
- **Fraud Precision**: **0.9241** (92.41%)
- **Fraud Recall**: **0.8778** (87.78%)
- **Fraud F1-Score**: **0.9004**
- **PR-AUC**: **0.9412**

### B. Canonical Benchmark Suite (20 Exam Cases)
- **Total Cases Evaluated**: 20 (`HHG-001` through `HHG-020`)
- **Verdict Distribution**:
  - **Confirmed Fraud**: 3 cases (15.0%) — `HHG-006`, `HHG-012`, `HHG-014`
  - **Cleared Legitimate**: 3 cases (15.0%) — `HHG-001`, `HHG-005`, `HHG-007`
  - **Uncertain / Pending Evidence**: 14 cases (70.0%) — Avoids premature blocking
- **Next-Best Action (NBA) Flips**:
  - **4 cases (20.0%)** dynamically flipped recommendations after receiving evidence:
    - `HHG-001`: `MONITOR_CARD` ➔ `ALLOW_TRANSACTION` (Travel confirmed)
    - `HHG-005`: `MONITOR_CARD` ➔ `ALLOW_TRANSACTION` (Step-up auth success)
    - `HHG-007`: `MONITOR_CARD` ➔ `ALLOW_TRANSACTION` (Subscription validated)
    - `HHG-012`: `MONITOR_CARD` ➔ `BLOCK_CARD` (Customer denied transaction)
- **Autonomous Tool Execution**:
  - **68 total MCP tool calls** across 20 cases (average 3.4 calls/case).
  - 1,553 measured LLM tokens consumed.
- **Graph State Commit**:
  - **20/20 cases** successfully executed write-back to TigerGraph vertices.

---

## 4. Key Architectural Highlights

1. **Graph-Native Topology over Tabular Silos**:
   7 custom GSQL queries (`transaction_neighborhood`, `shared_device_clusters`, `temporal_velocity_burst`, etc.) execute sub-second 2-hop traversals over 26,643 subgraphs.
2. **Standardized Model Context Protocol (MCP)**:
   The LLM agent interacts with TigerGraph via standardized MCP tools with real-time argument and latency recording.
3. **Adaptive Epistemic Uncertainty Loop**:
   When fraud probability is between 0.30 and 0.70, the agent triggers step-up verification or customer inquiry rather than making brittle guesses.
4. **Deterministic Policy Gating (R1–R10)**:
   Financial interventions are strictly governed by deterministic compliance rules with multi-level approval hierarchies (Auto, L1 Analyst, L2 Officer).
5. **SHA-256 Hash-Chained Decision Ledger**:
   Every investigation step is cryptographically linked to the previous block hash, ensuring tamper-evident provenance.
6. **Goa Hacker House Poster Visual System**:
   A high-fidelity React 19 + TypeScript frontend inspired by the retro-futuristic aesthetic of Hacker House Goa 2026.

---

## 5. Quickstart & Verification

### Run on Windows PowerShell
```powershell
# 1. Setup Python environment
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Run complete benchmark, validation, and test suite
.\scripts\run_all.ps1

# 3. Start Backend & Frontend
# Terminal 1:
uvicorn backend.app.main:app --port 8000
# Terminal 2:
cd frontend && npm install && npm run dev
```

### Run on Linux / macOS
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
bash scripts/run_all.sh
```

---

## 6. Judge Reference Links

- **Judging Scorecard**: [JUDGE_SCORECARD.md](file:///d:/HHGOA/docs/JUDGE_SCORECARD.md)
- **3–5 Min Demo Walkthrough**: [DEMO_SCRIPT.md](file:///d:/HHGOA/docs/DEMO_SCRIPT.md)
- **Forensic Claim-Truth Audit**: [PRE_SUBMISSION_FORENSIC_AUDIT.md](file:///d:/HHGOA/docs/PRE_SUBMISSION_FORENSIC_AUDIT.md)
- **Technical Blog**: [BLOG.md](file:///d:/HHGOA/docs/BLOG.md)
- **Canonical Results File**: [canonical_results.json](file:///d:/HHGOA/outputs/benchmark/canonical_results.json)
