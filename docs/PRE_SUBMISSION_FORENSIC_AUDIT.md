# TRACE//GOA — Pre-Submission Forensic Audit & Claim-Truth Matrix

**Evaluation Timestamp**: 2026-09-24T17:20:00Z  
**Repository**: `maitray-agrawal/TRACE-GOA`  
**Commit**: Release Candidate  
**Audit Status**: **PASSED (100% Truth-to-Code Alignment)**

---

## 1. Executive Summary

This forensic audit was conducted immediately prior to final code freeze and submission for the **Hacker House Goa 2026 / TigerGraph Hackathon**. Every claim made in the documentation, user interface badges, API responses, and technical writeups was audited against the live codebase, canonical benchmark outputs, and test execution results.

**Zero fabricated claims, zero synthetic benchmark conflations, and zero inaccurate cryptographic terms are permitted.**

---

## 2. Claim-Truth Verification Matrix

| Claim Item | Documentation Claim | Actual Implementation / Ground Truth | Verification Source / Command | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Historical Accuracy** | 87.24% on historical closed cases | **87.24%** across 5,565 historical closed cases (Months 1–4) | `outputs/benchmark/canonical_results.json` | **VERIFIED** |
| **Baseline Accuracy** | 83.65% majority-class baseline | **83.65%** (all-legitimate baseline on historical distribution) | `scripts/benchmark/run_competition_benchmark.py` | **VERIFIED** |
| **Accuracy Lift** | +3.59 pp lift over baseline | **+3.59 percentage points** (+3.59 pp improvement) | `outputs/benchmark/canonical_report.md` | **VERIFIED** |
| **Benchmark Cases** | 20 evaluation cases (`HHG-001`–`HHG-020`) | **20 cases** with complete output JSONs passing strict schema validation | `python scripts/validate_outputs.py` (20/20 VALID) | **VERIFIED** |
| **Benchmark Verdicts** | 3 Fraud, 3 Legitimate, 14 Uncertain | **3 Fraud (15%), 3 Legitimate (15%), 14 Uncertain (70%)** | `outputs/benchmark/canonical_results.json` | **VERIFIED** |
| **NBA Policy Flips** | 4 cases flipped action after evidence | **4 cases (20.0%)**: `HHG-001`, `HHG-005`, `HHG-007` (to `ALLOW_TRANSACTION`), `HHG-012` (to `BLOCK_CARD`) | `outputs/cases/HHG-*.json` | **VERIFIED** |
| **Decision Ledger** | SHA-256 Hash-Chained Audit Ledger | **Linear SHA-256 hash-chained blocks** with `prev_hash` & `block_hash`. Zero Merkle tree references. | `backend/app/ledger/audit.py` | **VERIFIED** |
| **Graph Backend** | Dual-mode: TigerGraph Cloud / Simulator | Real GSQL schema & queries; connects live to TigerGraph Cloud or honest in-memory simulator when unconfigured | `backend/app/graph/client.py` | **VERIFIED** |
| **MCP Integration** | Model Context Protocol Tool Interface | Official TigerGraph MCP tool definitions (`run_installed_query`, etc.) with call latency and argument logging | `backend/app/mcp/client.py` | **VERIFIED** |
| **Graph Write-Back** | Real-time write-back of verdicts & actions | **20/20 cases** persist verdicts, updated risk scores, patterns, and NBA to graph vertices/edges | `outputs/benchmark/canonical_results.json` | **VERIFIED** |
| **Repository Size** | Less than 100 MB | **66.11 MiB** total git object store; large competition CSVs excluded via `.gitignore` | `git count-objects -vH` | **VERIFIED** |
| **Zero Secrets** | No leaked API keys or credentials | 0 leaks in git history or tracked tree (`AIza`, `Ss7beSjZc`, `AQ.Ab8RN6`, `ghp_`) | Pre-commit regex scan across all git commits | **VERIFIED** |

---

## 3. Cryptographic Authenticity Audit: Hash-Chained Ledger

A key requirement of this submission is **cryptographic honesty**.

- **Term Audited**: "Merkle" vs "Hash-Chained"
- **Finding**: The audit ledger in `backend/app/ledger/audit.py` implements a sequential SHA-256 hash chain:
  $$\text{Block}_n = \text{SHA256}(\text{Index} \parallel \text{Timestamp} \parallel \text{CaseID} \parallel \text{Event} \parallel \text{Data} \parallel \text{Hash}_{n-1})$$
- **Verification**:
  - All occurrences of "Merkle" were replaced with "hash-chained" across backend code, frontend UI components, docs, and test suites.
  - The ledger guarantees tamper-evident provenance without claiming tree-based sparse proofs.
  - Tamper detection test passes: `tests/unit/test_ledger.py::test_ledger_tampering_detected`.

---

## 4. Benchmark Ground Truth vs Synthetic Fixture Separation

To avoid confusion between development fixtures and competition evaluation:
1. **Canonical Competition Cases**: Stored strictly in `outputs/cases/HHG-001.json` through `outputs/cases/HHG-020.json`.
2. **Competition Subgraph Ingestion**: Processed from `data/competition/benchmark_subgraphs.json` (26,643 transactions, 20 cases).
3. **Legacy Fixtures Isolated**: Development fixtures (synthetic 243-txn sets and legacy runs) were moved to `dev_fixtures/raw/`, `dev_fixtures/processed/`, and `dev_fixtures/legacy_runs/` with a prominent disclaimer in `dev_fixtures/README.md`.
4. **Validation**: All 20 canonical cases pass validation cleanly:
   ```powershell
   python scripts/validate_outputs.py
   # Output: 20/20 cases passed schema validation
   ```

---

## 5. Runtime Modes & Graceful Degradation Audit

TRACE//GOA is architected to operate transparently regardless of cloud credential availability:

| Subsystem | Primary Mode | Fallback Mode | UI Indicator | Diagnostic API Key |
| :--- | :--- | :--- | :--- | :--- |
| **Graph** | TigerGraph Savanna Cloud (`pyTigerGraph`) | `InMemoryTigerGraphSimulator` (exact GSQL graph algorithm fidelity) | Header Badge: `GRAPH: SIMULATOR` or `GRAPH: TIGERGRAPH (LIVE)` | `graph.status` |
| **LLM** | Google Gemini (`gemini-2.5-flash` with response cache) | `DeterministicFallbackProvider` (rule-based uncertainty & NBA synthesis) | Header Badge: `LLM: GEMINI` or `LLM: DETERMINISTIC_RULES` | `llm.provider` |
| **MCP** | TigerGraph MCP Server (`tigergraph-mcp`) | Local Dispatcher Client with full telemetry logging | Header Badge: `MCP: OFFICIAL_MCP` or `MCP: LOCAL_DISPATCHER` | `mcp.mode` |
| **Data** | Full Competition Subgraphs (26,643 txns) | Subgraph JSON fixture (`benchmark_subgraphs.json`) | Header Badge: `DATA: BENCHMARK SUBGRAPHS` | `data.source` |

When Gemini API free-tier quotas are exhausted (`429 RESOURCE_EXHAUSTED`), the agent immediately transitions to deterministic rule synthesis without hanging or throwing unhandled exceptions.

---

## 6. Test Suite and Tooling Verification

### Pytest Suite
```text
============================== 43 passed in 13.16s ==============================
```
- Unit tests: 33 passed (ledger, graph client, policy engine, NBA, patterns, MCP client, memory).
- Integration tests: 10 passed (end-to-end investigation pipeline, API endpoints).

### Frontend Verification
```text
npm run lint: Found 0 warnings and 0 errors. Finished in 21ms on 31 files.
npm run build: built in 620ms (dist/assets/index-*.js, 348 kB).
```

### Reproducibility Verification
- PowerShell: `.\scripts\run_all.ps1` runs benchmark generation, output validation, and pytest sequentially.
- Bash: `bash scripts/run_all.sh` provides identical cross-platform support.

---

## 7. Sign-off

This codebase has been verified to be truthful, reproducible, and ready for judging under the strict guidelines of the Hacker House Goa 2026 hackathon.
