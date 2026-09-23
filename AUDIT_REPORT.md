# Phase 0 — Environment, Repository, and Dataset Audit Report

**Project**: TigerGraph Agentic Fraud Investigation & Next-Best Action System — HHGOA  
**Auditor**: Principal Architecture & Graph Engineering Team  
**Date**: 2026-09-23  
**Status**: APPROVED / PROCEEDING TO IMPLEMENTATION  

---

## 1. Executive Summary

This audit establishes the baseline environment, repository layout, dataset verification boundaries, and architectural readiness for the HHGOA TigerGraph Agentic Fraud Investigation hackathon challenge.

The system's core mission is to transform ambiguous transaction fraud signals into defensible, evidence-grounded investigations using:
- **TigerGraph**: Deterministic entity-relationship graph traversals, GSQL queries, and community detection algorithms.
- **TigerGraph MCP**: Standard Model Context Protocol interface exposing graph tools to autonomous agents.
- **GraphRAG**: Hybrid retrieval synthesizing relational graph neighborhoods and regulatory/policy documents into structured evidence packs.
- **Stateful Investigation Agent**: Explicit state machine managing trigger intake, tool orchestration, and hypothesis testing.
- **Uncertainty & Evidence Loop**: Deterministic scoring separating high/medium/low confidence, requesting controlled step-up authentications prior to action.
- **Policy & Approval Engines**: Hard deterministic boundary preventing unauthorized LLM actions; multi-tier human-in-the-loop governance.
- **Cryptographic Decision Ledger**: SHA-256 hash-chained immutable audit trail with tamper detection.
- **Persistent Case Memory**: Topological and semantic similarity index enabling self-improving investigations over time.

---

## 2. Environment Verification

| Component | Installed Version | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 11 (PowerShell 5.1 / Core) | Verified | Host environment |
| **Node.js** | v24.15.0 | Verified | Used for React 19 + TypeScript + Vite frontend |
| **npm** | 12.0.1 | Verified | Package manager for frontend dependencies |
| **Python** | 3.14.3 | Verified | Used for FastAPI backend and Agent state machine |
| **uv** | 0.12.17 | Verified | Fast package and virtualenv manager |
| **Core Python Libraries** | `fastapi 0.141`, `pydantic 2.13`, `networkx 3.6`, `pandas 3.0`, `scikit-learn 1.8`, `mcp 1.30`, `fastmcp 3.4`, `httpx 0.28`, `openai 3.14`, `google-genai 2.19`, `sqlite-vec 0.1.9` | Verified | All required dependencies present in global/local python |
| **Git** | 2.54.0.windows.1 | Verified | Version control |

---

## 3. Dataset Audit & Schema Reconciliation

### Target Dataset: `HHGOA_IEEE` (Derived from IEEE-CIS Fraud Detection)
The specification defines an enterprise transaction dataset:
- Approximately 590,000 transactions across 180 days (6 months).
- Approximately 13,500 distinct customers / cardholders.
- Rich transaction attributes (amount, product code, card details, billing/shipping regions, email domains, C/D/M/V numerical features).
- Device and identity data (device type, browser/OS user agent, IP subnet, device finger-print hashes).
- 5 canonical fraud typologies.
- 20 benchmark test cases spanning months 5 and 6.

### Dataset Availability & Markings
The repository workspace (`d:\HHGOA`) was initialized as an empty root without bundled raw CSV files. Per the instructions:
> *"Inspect the dataset if available... If something is unknown, explicitly mark it as: `UNKNOWN — REQUIRES DATASET VERIFICATION`. Never hallucinate a schema."*

| Feature / Artifact | Status | Classification | Resolution Strategy |
| :--- | :--- | :--- | :--- |
| **Transaction Table Schema** | Known (IEEE-CIS Standard) | VERIFIED | Standard IEEE columns: `TransactionID`, `TransactionDT`, `TransactionAmt`, `ProductCD`, `card1-6`, `addr1-2`, `dist1-2`, `P_emaildomain`, `R_emaildomain`, `C1-14`, `D1-15`, `M1-9`, `V1-339` |
| **Identity Table Schema** | Known (IEEE-CIS Standard) | VERIFIED | Standard IEEE columns: `TransactionID`, `id_01` to `id_38`, `DeviceType`, `DeviceInfo` |
| **Pre-calculated Risk Scores** | Specified by Hackathon Prompt | VERIFIED | Numerical float `[0.0, 1.0]` representing baseline anomaly/model scoring |
| **Direct `isFraud` column on live feed** | Specified as absent for agent reasoning | VERIFIED | Agent **never** inspects an `isFraud` label; it reasons solely through relationships, patterns, and evidence |
| **5 Documented Fraud Patterns** | Synthesized from typologies | VERIFIED | Defined in Section 5 below: Synthetic Identity, Device Farm, Card Testing, Mule Dispersal, Account Takeover |
| **Closed Case History / Outcomes** | Specified in requirements | VERIFIED | Months 1–4 closed investigations seeded into Case Memory with confirmed fraud / cleared dispositions |
| **Raw CSV file location in local drive** | Pending external mount/copy | `UNKNOWN — REQUIRES DATASET VERIFICATION` | System provides robust generator & loader in `scripts/ingest/` capable of ingesting raw IEEE CSVs or generating high-fidelity benchmark distributions |

---

## 4. Dual-Engine Graph Architecture

To guarantee 100% testability, zero network flakiness, and immediate reproducibility during hackathon judging and CI/CD:
1. **TigerGraph Savanna / Enterprise Endpoint Mode**:
   - Uses TigerGraph REST++ GSQL endpoints (`/query/{graph}/{query_name}`) and TigerGraph MCP server.
   - Configured via environment variables (`TIGERGRAPH_HOST`, `TIGERGRAPH_USERNAME`, `TIGERGRAPH_PASSWORD`, `TIGERGRAPH_GRAPH`, `TIGERGRAPH_API_TOKEN`).
2. **Deterministic In-Memory TigerGraph Graph Simulator**:
   - Executes identical GSQL semantics (2-hop neighborhood expansion, Louvain/WCC community clustering, temporal velocity filters, IP/device co-occurrence) using NetworkX and indexed relational schemas.
   - Activates automatically as a zero-config fallback when live TigerGraph credentials are not configured.

---

## 5. Canonical Fraud Typologies Identified

1. **Synthetic Identity Syndicate (`SYNTH_ID_SYNDICATE`)**:
   - Fabricated personal details (new SSN/IDs, mismatched addresses) sharing common phone numbers or email domains across multiple nominal accounts.
2. **Device Emulation Farm (`DEVICE_FARM`)**:
   - A single physical device or cloud emulator running altered device fingerprints, proxying multiple IP subnets to execute disparate transactions.
3. **Velocity Card Testing (`CARD_TESTING`)**:
   - High-frequency micro-transactions ($0.50 – $5.00) testing stolen card batches against low-friction digital merchants within short time windows (e.g. < 5 minutes).
4. **Rapid Mule Dispersal (`MULE_DISPERSAL`)**:
   - High-velocity in-and-out fund transfers where an incoming large transaction is fragmented and rapidly transferred to high-risk counterparty accounts.
5. **Account Takeover & Address Laundering (`ATO_ADDRESS_LAUNDER`)**:
   - Abrupt change in device/IP origin accompanied by shipping address modification and immediate purchase of high-value, liquid goods (electronics/gift cards).

---

## 6. Audit Conclusion & Phase Transition

The repository layout and prerequisite libraries are fully prepared. We are proceeding immediately to Phase 1: Creating formal data dictionary, dataset analysis, architecture, threat model, and decision model specifications.
