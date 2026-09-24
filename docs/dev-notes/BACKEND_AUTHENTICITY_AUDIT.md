# TRACE//GOA — Backend Authenticity & Architecture Audit Report

> **Standard of Assessment**: Strict engineering verification. No generous assumptions.
> **Date**: September 23, 2026
> **Scope**: Backend, Data Pipeline, TigerGraph Engine, MCP Server, GraphRAG, Agent State Machine, Policy & Approval Engines, Ledger, Memory, and Benchmarks.

---

## 1. Executive Summary & Forensic Verdict

TRACE//GOA was subjected to an exhaustive codebase forensic audit. While the repository contains significant deterministic foundations (including GSQL queries, GSQL schema, SHA-256 block ledger, 5 pattern detection typologies, and an in-memory NetworkX TigerGraph simulator), several critical production architectural layers were found to be **SIMULATED**, **PARTIALLY REAL**, or **HARDCODED**.

### Overall System Classification

| Subsystem | Classification | Primary Finding |
| :--- | :--- | :--- |
| **Dataset Ingestion** | **PARTIALLY REAL** | Synthetic generator exists in Python memory, but raw IEEE-CIS CSVs are not written to disk, preventing `load_data.gsql` from running reproducibly. |
| **TigerGraph Connection** | **PARTIALLY REAL** | `TigerGraphRESTClient` exists, but defaults silently to `InMemoryTigerGraphSimulator` without real schema verification, connection health check, or GSQL installation pipeline. |
| **GSQL Queries** | **REAL** | 6 parameterized GSQL queries and 1 community detection GSQL algorithm exist in `tigergraph/queries/` and `tigergraph/algorithms/`. |
| **Graph Algorithms** | **REAL** | Weakly Connected Components (WCC) query and NetworkX equivalent are implemented. |
| **TigerGraph MCP** | **PARTIALLY REAL** | FastMCP server exists in `tigergraph/mcp/server.py`, but agent bypasses MCP and calls `client.py` directly; audit logging with latency/status is missing. |
| **GraphRAG Synthesizer** | **PARTIALLY REAL** | Synthesizer exists, but Evidence Pack does not strictly follow the provenance contract or separate regulatory vs statutory citations. |
| **Agent State Machine** | **PARTIALLY REAL** | Monolithic linear loop executing 10 steps rather than an explicit 17-state stateful machine with discrete state transitions, failure handlers, and audit records. |
| **Tool Selection** | **HARDCODED** | Exact same sequence executed across all cases rather than dynamic investigation planning based on trigger topology. |
| **Uncertainty Engine** | **REAL** | Deterministic multi-factor scoring (risk, pattern, graph density, completeness, contradiction penalty) implemented. |
| **Evidence Loop (Step-Up)** | **SIMULATED** | Step-up auth trigger exists, but customer response is an in-process simulated flag rather than an asynchronous event or out-of-band challenge verification. |
| **Next-Best Action (NBA)** | **REAL** | Deterministic policy evaluation mapping candidate actions to risk, amount, pattern, and confidence. |
| **Policy Engine** | **REAL** | Deterministic rule checker enforcing FinCEN BSA $5,000 threshold and Regulation E protections. |
| **Approval Engine (RBAC)** | **REAL** | 3-tier human-in-the-loop authorization (`ANALYST [L1]`, `SENIOR ANALYST [L2]`, `FRAUD MANAGER [L3]`). |
| **Case Write-Back** | **MISSING** | Cases are stored in SQLite (`cases.db`), but NEVER written back to TigerGraph vertices (`Case`) or edges (`FLAGGED_IN_CASE`, `INVOLVES_ENTITY`). |
| **Case Memory** | **REAL** | SQLite database with similarity search across historical fraud dockets. |
| **Decision Ledger** | **REAL** | SHA-256 hash-chained block audit trail with cryptographic tamper detection. |
| **Benchmark Pipeline** | **PARTIALLY REAL** | Generates `outputs/case_XX/`, but script name differs from spec (`run_benchmarks.py` vs `run_benchmark.py`), and consolidated `results.json`, `results.csv`, `report.md` are missing. |

---

## 2. Detailed Component Audit Table

| Component | Current Status | Forensic Evidence | Architectural Gap | Required Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Dataset** | `PARTIALLY REAL` | `scripts/ingest/generate_seed_dataset.py` creates 100 customers, 150 devices, 50 merchants, 234 txns in Python memory. `data/raw/` is empty. | GSQL `load_data.gsql` cannot run because raw CSVs (`customers.csv`, `devices.csv`, `transactions.csv`, `cases.csv`) are not persisted on disk. | Export normalized CSV files to `data/raw/` and update generator to reproducibly load via GSQL or client. |
| **TigerGraph** | `PARTIALLY REAL` | `backend/app/graph/client.py` has `TigerGraphRESTClient` and `InMemoryTigerGraphSimulator`. | The REST client lacks live connectivity verification, token auto-refresh, and healthcheck endpoints. Auto-fallback to simulator happens silently. | Implement explicit connection verification, healthcheck endpoint, and clear mode logging (`LIVE_TIGERGRAPH` vs `SIMULATOR_TEST`). |
| **GSQL** | `REAL` | 6 GSQL files in `tigergraph/queries/` with proper parameters, accumulators, and syntax. | No automated test running GSQL syntax checks or mock compiler verification. | Add GSQL query compilation test harness and live deployment script in `scripts/setup/`. |
| **Graph Algorithms** | `REAL` | `community_detection.gsql` implements Weakly Connected Components. `InMemoryTigerGraphSimulator` implements `nx.weakly_connected_components`. | Algorithm only clusters 5 entity types; doesn't compute centrality (PageRank or Degree) to identify high-degree mule hubs. | Add PageRank/Degree Centrality scoring for account and device vertices to detect laundering hubs. |
| **TigerGraph MCP** | `PARTIALLY REAL` | FastMCP server exists in `tigergraph/mcp/server.py` with 9 `@mcp.tool` definitions. | Agent in `state_machine.py` directly imports `get_default_graph_client()` instead of querying tools through the MCP registry. No tool audit log (latency, status, arguments). | Refactor agent to invoke graph operations via the MCP tool dispatcher and record an audit log for every MCP call. |
| **GraphRAG** | `PARTIALLY REAL` | `backend/app/graphrag/synthesizer.py` merges graph nodes, historical cases, and `POLICY_KNOWLEDGE_BASE`. | Evidence Pack does not conform to the exact contract schema in Prompt Section 11 (`transaction_evidence`, `regulatory_evidence`, `uncertainty_gaps`). Provenance metadata is incomplete. | Overhaul `EvidencePack` schema to match Section 11 contract exactly, ensuring every evidence item contains immutable source provenance. |
| **Agent** | `PARTIALLY REAL` | `FraudInvestigationAgent` executes 10 steps linearly in `state_machine.py`. | Not a true state machine. Does not support discrete state transitions, state rollback, or the 17 explicit states required in Prompt Section 12. | Refactor agent into an explicit 17-state state machine with discrete transition guards, failure handlers, and audit records. |
| **Uncertainty** | `REAL` | Formulaic confidence scoring combining model risk, pattern confidence, graph density, completeness, and contradiction penalty. | Confidence thresholds are hardcoded in the method rather than driven by institutional policy configuration. | Move uncertainty thresholds (`min_confidence_threshold`, `step_up_trigger_risk`) into institutional policy configuration. |
| **Evidence Loop** | `SIMULATED` | `allow_evidence_step_up` and `simulate_step_up_success` flags simulate OTP expiry and hostile takeover. | There is no asynchronous API endpoint for a human investigator or external system to provide real step-up verification payloads. | Ensure API `/api/investigations/{case_id}/evidence` accepts real verification payloads and drives the state transition from `AWAITING_EVIDENCE` to `REASSESSMENT`. |
| **Next-Best Action** | `REAL` | `CandidateAction` selection maps to 12 `ActionType` enums and checks `PolicyEngine`. | LLM is not used to synthesize human-readable justification for the recommended action. | Add structured LLM or deterministic justification generator that cites graph evidence and policy mandates. |
| **Policy** | `REAL` | `PolicyEngine` deterministically checks BSA $5,000 threshold, CFPB Reg E, and supervisory approval routes. | Policy rules are hardcoded in `engine.py` rather than dynamically loaded from institutional knowledge. | Bind policy rules directly to GraphRAG knowledge base entries (`POL-001`, `REG-BSA-001`, etc.). |
| **Approval** | `REAL` | `ApprovalEngine` enforces `ANALYST [L1]`, `SENIOR_ANALYST [L2]`, `FRAUD_MANAGER [L3]` and prevents unauthorized role execution. | None. Fully functional and covered by unit tests. | Maintain current RBAC and add edge-case failure tests. |
| **Case Write-Back** | `MISSING` | Schema defines `Case` vertex and `FLAGGED_IN_CASE` / `INVOLVES_ENTITY` / `IDENTIFIED_PATTERN` edges, but client has no write method. | Cases are never written to TigerGraph! Investigation findings remain trapped in SQLite and memory. | Implement `write_back_case()` on `BaseGraphClient`, `InMemoryTigerGraphSimulator`, and `TigerGraphRESTClient`. Call upon case resolution. |
| **Memory** | `REAL` | SQLite database `case_memory.db` with keyword/topology similarity search. | Embeddings are simple string matches rather than semantic dense vector embeddings. | Add vector representation fallback (TF-IDF / hashed n-gram cosine similarity) for robust cross-typology retrieval. |
| **Ledger** | `REAL` | SHA-256 hash-chained block ledger with `verify_case_ledger()`. | None. Fully functional, tested for tamper detection. | Maintain current cryptographic guarantees. |
| **Benchmark** | `PARTIALLY REAL` | `scripts/benchmark/run_benchmarks.py` processes 20 cases and outputs individual JSON files in `outputs/case_XX/`. | Missing consolidated `outputs/benchmark/results.json`, `results.csv`, `report.md`. Script is named `run_benchmarks.py` instead of `run_benchmark.py`. | Implement `scripts/benchmark/run_benchmark.py` generating `results.json`, `results.csv`, and `report.md` with pre/post evidence comparisons. |

---

## 3. Prioritized Gap Breakdown

### Critical Gaps (Must be fixed immediately)
1. **Case Write-Back to TigerGraph**: Completed cases, findings, and identified patterns must be persisted to TigerGraph (`Case` vertex and `FLAGGED_IN_CASE`, `INVOLVES_ENTITY`, `IDENTIFIED_PATTERN` edges), not merely saved to SQLite.
2. **17-State Agent State Machine**: Refactor `state_machine.py` into an explicit state machine implementing all 17 required states with deterministic transition guards and audit events.
3. **Evidence Pack Contract & Provenance**: Enforce the exact JSON contract from Prompt Section 11 with immutable source provenance for every evidence item.
4. **Data Ingestion Export**: Export normalized IEEE-CIS CSV files to `data/raw/` so that TigerGraph `load_data.gsql` can reproducibly load the graph from disk.

### High Priority
5. **TigerGraph MCP Tool Registry & Dispatcher**: Wire the investigation agent through the MCP tool dispatcher, recording full tool invocation audits (`case_id`, `run_id`, `tool`, `arguments`, `latency`, `status`).
6. **Benchmark Pipeline Alignment**: Create `scripts/benchmark/run_benchmark.py` and output consolidated `results.json`, `results.csv`, and `report.md`.
7. **Dynamic Investigation Planning**: Enable case-dependent tool execution paths rather than a rigid fixed pipeline.

### Medium Priority
8. **Graph Centrality Algorithm**: Implement PageRank / Degree Centrality in GSQL and Python simulator to identify money mule dispersal hubs.
9. **Expanded Test Suite**: Add dedicated tests for TigerGraph client, MCP tool dispatch, security (prompt injection & RBAC override attempts), and failure modes.

### Low Priority
10. **Vector Representation in Memory**: Upgrade keyword similarity in `case_memory.db` to dense n-gram cosine similarity.
