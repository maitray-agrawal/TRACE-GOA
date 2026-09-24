# TRACE//GOA — Hackathon Judge Scorecard & Criteria Mapping

This document provides a direct, cross-referenced mapping between the **6 official judging criteria** of the Hacker House Goa / TigerGraph Hackathon and the corresponding code, data, tests, and proof artifacts in this repository.

---

## Scorecard Overview

| Judging Criterion | Weight | Key Repository Asset | Primary Verification Command |
| :--- | :---: | :--- | :--- |
| **1. Investigation Accuracy** | **25%** | `outputs/benchmark/canonical_results.json`<br>`scripts/benchmark/run_competition_benchmark.py` | `python scripts/validate_outputs.py` |
| **2. Next-Best Action (NBA)** | **25%** | `backend/app/policy/engine.py`<br>`backend/app/policy/approval.py` | `pytest tests/unit/test_policy.py` |
| **3. TigerGraph Algorithms & Schema** | **20%** | `tigergraph/schema/schema.gsql`<br>`tigergraph/queries/*.gsql` | `pytest tests/unit/test_graph_client.py` |
| **4. Innovation & Discovery** | **15%** | `backend/app/patterns/detector.py`<br>`backend/app/agent/core.py` | `pytest tests/unit/test_patterns.py` |
| **5. Explainability & Compliance** | **10%** | `backend/app/ledger/audit.py`<br>`backend/app/agent/explainability.py` | `pytest tests/unit/test_ledger.py` |
| **6. Demo Polish & UX Quality** | **10%** | `frontend/src/`<br>`docs/assets/screenshots/` | `cd frontend && npm run build` |

---

## Detailed Criteria Breakdown

### 1. Investigation Accuracy (25%)

**Requirement**: Accurate classification of fraud vs legitimate transactions, handling ambiguity gracefully, and demonstrating measurable lift over standard baselines.

- **Historical Backtest Performance** (5,565 Closed Cases):
  - **Accuracy**: **87.24%** vs **83.65%** majority-class baseline (**+3.59 pp lift**).
  - **Precision (Fraud Class)**: 0.9241 (92.41%).
  - **Recall (Fraud Class)**: 0.8778 (87.78%).
  - **F1-Score**: 0.9004.
  - **PR-AUC**: 0.9412.
- **Canonical Benchmark Outputs** (20 Cases, `HHG-001`–`HHG-020`):
  - **3 Confirmed Fraud** (15%): `HHG-006`, `HHG-012`, `HHG-014`.
  - **3 Cleared Legitimate** (15%): `HHG-001`, `HHG-005`, `HHG-007`.
  - **14 Uncertain / Pending Evidence** (70%): Avoids false-positive blocking; triggers evidence collection.
- **Where to verify**:
  - `outputs/benchmark/canonical_results.json`
  - `outputs/benchmark/canonical_report.md`
  - Run: `python scripts/validate_outputs.py` (20/20 valid schema files).

---

### 2. Next-Best Action (NBA) & Evidence Loop (25%)

**Requirement**: Dynamic action recommendations governed by policy rules that change when new evidence or customer responses arrive.

- **Action Flip Rate**: **4 out of 20 benchmark cases (20.0%) dynamically flipped actions**:
  - `HHG-001`: Initial `MONITOR_CARD (auto)` ➔ Flipped to `ALLOW_TRANSACTION (auto)` (Travel verified).
  - `HHG-005`: Initial `MONITOR_CARD (auto)` ➔ Flipped to `ALLOW_TRANSACTION (auto)` (Step-up auth success).
  - `HHG-007`: Initial `MONITOR_CARD (auto)` ➔ Flipped to `ALLOW_TRANSACTION (auto)` (Subscription verified).
  - `HHG-012`: Initial `MONITOR_CARD (auto)` ➔ Flipped to `BLOCK_CARD (requires_human)` (Customer denied transaction).
- **Deterministic Policy Rules (R1–R10)**:
  - `R1`: Low/medium risk monitoring without customer interruption.
  - `R2`: Customer dispute / out-of-region denial requires immediate card block.
  - `R9`: Discovered proxy ring / device sharing cluster requires blocking connected cards.
  - `R10`: Clean step-up verification permits transaction release.
- **Where to verify**:
  - `backend/app/policy/engine.py` (Rule evaluation logic).
  - `backend/app/policy/approval.py` (Tiered approval routing: auto, L1 Risk Analyst, L2 Compliance Officer).
  - Run: `pytest tests/unit/test_policy.py`.

---

### 3. TigerGraph Graph Algorithms & Schema (20%)

**Requirement**: Natively modeling entity relationships in TigerGraph, deploying GSQL queries, and leveraging graph traversals.

- **Graph Schema**:
  - 10 vertex types: `Customer`, `Card`, `Transaction`, `DeviceProfile`, `BillingRegion`, `EmailDomain`, `Case`, `ClosedCase`, `Finding`, `Action`.
  - 14 bidirectional edge types: `USED_DEVICE`, `ASSOCIATED_EMAIL`, `LOCATED_IN`, `HAS_TRANSACTION`, `IDENTIFIED_PATTERN`, etc.
- **7 Purpose-Built GSQL Queries**:
  - `transaction_neighborhood.gsql`: 2-hop topological ego-network.
  - `shared_device_clusters.gsql`: Multi-card device ring discovery.
  - `device_reuse_detection.gsql`: Hardware fingerprint reuse.
  - `ip_reuse_detection.gsql`: IP clustering and proxy detection.
  - `shared_identity_attributes.gsql`: Shared billing address & email domain rings.
  - `temporal_velocity_burst.gsql`: Sliding-window velocity structuring.
  - `similar_cases.gsql`: Historical closed-case similarity retrieval.
- **MCP Client Integration**:
  - Standardized Model Context Protocol client calling TigerGraph queries as tools.
  - 68 live tool calls recorded across the benchmark suite (avg 3.4/case).
- **Graph Write-Back**:
  - 20/20 cases write completed findings, updated risk states, and actions back to TigerGraph.
- **Where to verify**:
  - `tigergraph/schema/schema.gsql`
  - `tigergraph/queries/*.gsql`
  - `backend/app/graph/client.py`
  - `backend/app/mcp/client.py`
  - Run: `pytest tests/unit/test_graph_client.py tests/unit/test_mcp_client.py`.

---

### 4. Innovation & Discovered Typologies (15%)

**Requirement**: Beyond standard baseline models; novel architectures, discovered patterns, and autonomous investigation workflows.

- **Discovered Undocumented Fraud Typologies**:
  - **Cross-Card Anonymous Proxy Ring**: Single device operating behind anonymous proxies across 23+ accounts. Detected in `HHG-014`.
  - **Sub-Threshold Structuring Burst**: 4 transactions in 40 minutes structured just below $500 threshold to evade AML monitoring.
- **Adaptive Hypothesis-Driven Agent Loop**:
  - Subgraph assembly ➔ Pattern detection ➔ GraphRAG context synthesis ➔ Epistemic uncertainty evaluation ➔ Evidence acquisition ➔ Deterministic policy gating.
- **Where to verify**:
  - `backend/app/patterns/detector.py`
  - `backend/app/agent/core.py`
  - Run: `pytest tests/unit/test_patterns.py`.

---

### 5. Explainability & Compliance (10%)

**Requirement**: Clear natural-language rationale, regulatory defensibility, and tamper-evident audit trails.

- **Plain-English Rationale**: Every case output provides a synthesized explanation referencing exact evidence findings and policy rules.
- **SHA-256 Hash-Chained Decision Ledger**:
  - Sequential cryptographic hashing of every investigation event (`prev_hash` + payload = `block_hash`).
  - Mathematical tamper detection (verified by unit test).
  - Strictly transparent: no false claims of sparse Merkle proofs.
- **Where to verify**:
  - `backend/app/ledger/audit.py`
  - `backend/app/agent/explainability.py`
  - Run: `pytest tests/unit/test_ledger.py`.

---

### 6. Demo & Polish (10%)

**Requirement**: Engaging, high-fidelity user interface, responsive layout, and seamless presentation.

- **Goa Hacker House Poster Visual System**:
  - Bespoke color palette: Sun-drenched Amber (`#ff6b35`, `#ffd166`), Deep Arabian Sea Cobalt (`#073b4c`), Palm Sage (`#06d6a0`).
  - Microcopy, retro typography, and custom SVG illustrations (beach shacks, coconut palms, sun/tide risk gauge).
- **Interactive Command Center**:
  - Case Village with 20 selectable case huts.
  - Interactive Graph Traversal visualization.
  - Evidence Notice Board and Next-Best Action decision cards with approval stamps.
  - Live runtime honesty badges (`GRAPH`, `LLM`, `MCP`, `DATA`).
- **Where to verify**:
  - `frontend/src/`
  - Screenshots in `docs/assets/screenshots/`
  - Run: `cd frontend && npm run build` (Clean build in <1s, 0 lint warnings).
