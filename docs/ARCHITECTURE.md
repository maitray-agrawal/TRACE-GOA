# HHGOA System Architecture: TigerGraph Agentic Fraud Investigation & Next-Best Action

This document describes the end-to-end architecture, component boundaries, execution flows, and state machines of the **HHGOA Fraud Investigation Platform**.

---

## 1. High-Level Architectural Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ANALYST COMMAND CENTER                          │
│        React 19 + TypeScript + Vite + Interactive Graph Explorer       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / Server-Sent Events (SSE)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI APPLICATION SERVER                          │
│                                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌───────────────┐  │
│   │ Investigation Agent │   │ Policy Engine     │   │ Approval Eng. │  │
│   │ State Machine       │   │ (Deterministic)   │   │ (Role RBAC)   │  │
│   └──────────┬──────────┘   └─────────┬─────────┘   └───────┬───────┘  │
│              │                        │                     │          │
│   ┌──────────▼──────────┐   ┌─────────▼─────────┐   ┌───────▼───────┐  │
│   │ GraphRAG Synthesizer│   │ Decision Ledger   │   │ Case Memory   │  │
│   │ (Hybrid Retrieval)  │   │ (SHA-256 Chained) │   │ (SQLite+Vec)  │  │
│   └──────────┬──────────┘   └───────────────────┘   └───────────────┘  │
└──────────────┼─────────────────────────────────────────────────────────┘
               │ Tool Invocations / GSQL
┌──────────────▼─────────────────────────────────────────────────────────┐
│                      TIGERGRAPH GRAPH ENGINE                           │
│                                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ TigerGraph MCP Server (Model Context Protocol Standard)         │  │
│   ├─────────────────────────────────────────────────────────────────┤  │
│   │ Deterministic GSQL Queries & Graph Algorithms:                  │  │
│   │  • transaction_neighborhood (2-hop ego expansion)               │  │
│   │  • device_reuse_detection (cross-account entity sharing)        │  │
│   │  • ip_reuse_detection (subnet & proxy co-occurrence)            │  │
│   │  • temporal_velocity_burst (micro-window card testing)          │  │
│   │  • community_detection (Louvain / Weakly Connected Components)   │  │
│   │  • topological_case_similarity (Jaccard / Graph Edit Distance)  │  │
│   ├─────────────────────────────────────────────────────────────────┤  │
│   │ Execution Engines:                                              │  │
│   │  1. Live TigerGraph Savanna / Enterprise REST++ Endpoint        │  │
│   │  2. In-Memory Graph Engine (Deterministic NetworkX Fallback)    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Investigation Agent State Machine

The investigation agent is an explicit, observable state machine where each transition produces audit telemetry:

```text
               ┌───────────────────────┐
               │    TRIGGER_INGEST     │
               └───────────┬───────────┘
                           │ Parse trigger & payload
                           ▼
               ┌───────────────────────┐
               │     CASE_CREATION     │
               └───────────┬───────────┘
                           │ Initialize Case (Status: INVESTIGATING)
                           ▼
               ┌───────────────────────┐
               │ INVESTIGATION_PLANNER │
               └───────────┬───────────┘
                           │ Plan required graph queries
                           ▼
               ┌───────────────────────┐
               │   GRAPH_INVESTIGATOR  │
               └───────────┬───────────┘
                           │ Execute TigerGraph GSQL & MCP tools
                           ▼
               ┌───────────────────────┐
               │   EVIDENCE_COLLECTOR  │
               └───────────┬───────────┘
                           │ Assemble Relational & Semantic Evidence
                           ▼
               ┌───────────────────────┐
               │    PATTERN_ANALYZER   │
               └───────────┬───────────┘
                           │ Match 5 Canonical Fraud Typologies
                           ▼
               ┌───────────────────────┐
               │     RISK_ASSESSOR     │
               └───────────┬───────────┘
                           │ Calculate Risk & Graph Anomaly Score
                           ▼
               ┌───────────────────────┐
               │  UNCERTAINTY_ANALYZER │
               └───────────┬───────────┘
                           │ Evaluate Evidence Completeness
                           ▼
             ┌───────────────────────────┐
             │  Enough Evidence to Act?  │
             └─────────────┬─────────────┘
                           │
             NO ───────────┴─────────── YES
             │                           │
             ▼                           ▼
 ┌───────────────────────┐   ┌───────────────────────┐
 │   REQUEST_EVIDENCE    │   │     ACTION_PLANNER    │
 └───────────┬───────────┘   └───────────┬───────────┘
             │ Step-up Auth              │ Propose Next-Best Actions
             ▼                           ▼
 ┌───────────────────────┐   ┌───────────────────────┐
 │   EVIDENCE_PROCESSOR  │   │     POLICY_ENGINE     │
 └───────────┬───────────┘   └───────────┬───────────┘
             │ Update Case               │ Validate against hard rules
             ▼                           ▼
 ┌───────────────────────┐   ┌───────────────────────┐
 │     REASSESSMENT      │   │    APPROVAL_ENGINE    │
 └───────────┬───────────┘   └───────────┬───────────┘
             │                           │ Check Role (Analyst/Manager)
             └───────────────────────────┤
                                         ▼
                             ┌───────────────────────┐
                             │    ACTION_EXECUTOR    │
                             └───────────┬───────────┘
                                         │ Execute / Mock External Action
                                         ▼
                             ┌───────────────────────┐
                             │     CASE_UPDATER      │
                             └───────────┬───────────┘
                                         │ Transition to RESOLVED / ESCALATED
                                         ▼
                             ┌───────────────────────┐
                             │     LEDGER_RECORD     │
                             └───────────┬───────────┘
                                         │ SHA-256 Block Chained Event
                                         ▼
                             ┌───────────────────────┐
                             │     MEMORY_WRITER     │
                             └───────────────────────┘
                                         Store Case in Vector/Graph Index
```

---

## 3. Subsystem Breakdown

### 3.1 GraphRAG Subsystem
- **Dual-Stream Context Retrieval**:
  1. *Graph Neighborhood Stream*: 2-hop graph paths connecting transaction, customer, card, device, IP, and prior cases.
  2. *Regulatory & Policy Vector Stream*: Bank fraud policy sections, Reg E compliance, BSA/FinCEN thresholds, SAR filing requirements.
- **Evidence Pack Synthesis**:
  Produces an immutable JSON payload containing:
  - `observed_facts`: Concrete attributes (amount, IP, device OS, card BIN).
  - `graph_paths`: Structural connection chains linking entities.
  - `matched_patterns`: Typology detector outcomes and confidence levels.
  - `contradictions`: Evidence weakening fraud hypothesis (e.g. valid biometric authentication, 3-year account tenure).
  - `uncertainties`: Known missing signals (e.g. unverified phone number, missing shipping distance).

### 3.2 Decision Ledger Subsystem
- **Cryptographic Hash Chaining**:
  Every state transition and decision generates an event record:
  $$\text{Hash}_i = \text{SHA256}(\text{Hash}_{i-1} \parallel \text{Timestamp} \parallel \text{CaseID} \parallel \text{EventType} \parallel \text{Actor} \parallel \text{DecisionData})$$
- **Tamper Verification**:
  `verify_case_ledger(case_id)` iterates through all events from genesis, re-computing each block hash. If any event content was modified, the chain breaks at that exact index.

### 3.3 Next-Best Action (NBA) Engine
- Proposes prioritized actions across 12 canonical options:
  1. `ALLOW_TRANSACTION`: Zero restrictions, risk $\le 0.30$.
  2. `BLOCK_TRANSACTION`: Immediate decline, high confidence fraud $\ge 0.80$.
  3. `MONITOR_TRANSACTION`: Allow with enhanced post-transaction telemetry.
  4. `BLOCK_ACCOUNT`: Freeze nominal customer account and associated cards.
  5. `MONITOR_ACCOUNT`: Place account on 30-day watchlist.
  6. `WARN_CUSTOMER`: Send automated SMS/push notification regarding suspicious attempt.
  7. `CREATE_CASE`: Formal investigation case file opened.
  8. `REQUEST_MORE_EVIDENCE`: Internal hold pending external data acquisition.
  9. `REQUEST_CUSTOMER_VALIDATION`: Out-of-band identity challenge.
  10. `REQUEST_STEP_UP_AUTH`: Challenge customer with biometric or SMS OTP.
  11. `ESCALATE_TO_ANALYST`: Route case to Senior Analyst or Fraud Manager.
  12. `FILE_REPORT`: Generate automated Suspicious Activity Report (SAR).

### 3.4 Role-Based Approval Engine (RBAC)
- **Levels**:
  - `ANALYST`: Can execute low-impact actions (`MONITOR_ACCOUNT`, `REQUEST_STEP_UP_AUTH`, `WARN_CUSTOMER`).
  - `SENIOR_ANALYST`: Can execute medium-impact actions (`BLOCK_TRANSACTION`, `ALLOW_TRANSACTION` override).
  - `FRAUD_MANAGER`: Required for critical actions (`BLOCK_ACCOUNT`, `FILE_REPORT` / SAR filing, financial clawbacks).
- Actions requiring approvals stay in state `AWAITING_APPROVAL` until confirmed in the UI.

---

## 4. Technology Stack Justification

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, CSS Variables | High performance, zero runtime overhead, responsive canvas graph visualization, strict type safety. |
| **Backend** | Python 3.14, FastAPI, Pydantic v2 | Native async architecture, automated OpenAPI documentation, high-speed validation. |
| **Graph** | TigerGraph Savanna / GSQL / NetworkX Engine | Industry standard graph analytics, sub-millisecond multi-hop queries, deterministic pattern traversal. |
| **Graph Interface** | FastMCP / Model Context Protocol | Open agentic standard exposing tool capabilities with strict JSON schemas. |
| **Vector / Memory** | SQLite + Faiss / sqlite-vec | Embedded, ultra-reliable zero-maintenance persistent vector search for case memory. |
| **LLM Interface** | Gemini / OpenAI / Deterministic Local Provider | Pluggable interface supporting multi-model execution and 100% offline benchmark reliability. |
