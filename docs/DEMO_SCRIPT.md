# TRACE//GOA — Judge Demo Script & Presentation Guide

**Recorded Video Walkthrough**: [https://youtu.be/ZbGbMlKf6bQ](https://youtu.be/ZbGbMlKf6bQ)  
**Time Target**: 3 to 5 Minutes  
**Focus**: 6 Judging Criteria (Investigation Accuracy, NBA Flips, TigerGraph Algorithms, Innovation, Explainability, Demo Polish)

---

## 0. Quick Setup (Before the Demo Starts)

Ensure backend and frontend are running:
```powershell
# Terminal 1 — Backend (from repo root)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend (from frontend directory)
cd frontend
npm run dev
# Browser opens at: http://localhost:5173
```

---

## Minute 0:00 – 0:45 | Criterion 6: Demo Polish & The Goa Aesthetic

**Action**: Open browser to `http://localhost:5173`. Show the sun-drenched HackerHouse Goa poster UI.

**Say**:
> "Welcome to **TRACE//GOA** — our agentic fraud investigation and next-best action engine built natively on **TigerGraph** for Hacker House Goa 2026.
> 
> Notice the top status badges immediately: we report runtime honesty. We show whether the graph engine is connected live or running in high-fidelity simulator mode, whether the LLM is using Gemini or deterministic policy rules, and the exact transaction count in our evaluation subgraph: **26,643 transactions across 20 benchmark cases**."

**Point Out**:
- Real signpost metrics: **87.24% Backtest Accuracy** alongside the **83.65% Majority-Class Baseline** (+3.59 pp lift).
- Runtime mode badges: `GRAPH: SIMULATOR / TIGERGRAPH`, `LLM: GEMINI / RULES`, `DATA: BENCHMARK SUBGRAPHS`.

---

## Minute 0:45 – 1:45 | Criterion 1: Investigation Accuracy (25%) & Ground Truth

**Action**: Open terminal or point to the Case Village in the UI.

**Say**:
> "Traditional fraud systems evaluate transactions as flat, isolated tabular records. In the IEEE-CIS competition dataset of 590,742 transactions, high-risk scores are often false positives: cardholders traveling abroad or families sharing laptops.
> 
> Rather than auto-blocking every high-risk alert, TRACE//GOA conducts an automated multi-hop investigation. Across our 20 canonical benchmark cases (`HHG-001` through `HHG-020`):
> - **3 Confirmed Fraud** (15%)
> - **3 Cleared Legitimate** (15%)
> - **14 Uncertain / Pending Evidence** (70%)
> 
> On 5,565 historically closed cases from Months 1–4, our GraphRAG-calibrated agent achieved **87.24% accuracy** (vs 83.65% baseline), with **0.9412 PR-AUC** and **0.9004 F1-score** on the fraud class."

**Show Terminal Proof**:
```powershell
python scripts/validate_outputs.py
# Output: 20/20 cases passed schema validation (0 errors)
```

---

## Minute 1:45 – 2:45 | Criterion 2: Next-Best Action (25%) & The Evidence Loop

**Action**: In the UI, click on case **`HHG-001`** and then case **`HHG-012`**.

**Say**:
> "The heart of our agent is the **Adaptive Evidence Loop**. The agent doesn't just guess; when uncertainty is between 0.30 and 0.70, it pauses to request step-up validation or customer verification.
> 
> Look at **`HHG-001`**:
> - Initial transaction alert carried a high risk score. Initial recommendation: `MONITOR_CARD (auto)`.
> - The agent requested out-of-region travel verification. The customer responded confirming legitimate travel.
> - **Next-Best Action FLIP**: Verdict changed to Legitimate, and the action flipped to `ALLOW_TRANSACTION (auto)`!
> 
> Now contrast this with **`HHG-012`**:
> - Initial alert was an out-of-region $50 transaction. Initial action: `MONITOR_CARD (auto)`.
> - Customer verification was requested. The customer replied *denying* the transaction.
> - **Next-Best Action FLIP**: Verdict changed to Confirmed Fraud, and action flipped to **`BLOCK_CARD (requires_human)`** with approval routing to L1 Risk Analyst.
> 
> Across the benchmark, **4 cases (20.0%) dynamically flipped action** based on evidence."

---

## Minute 2:45 – 3:45 | Criterion 3: TigerGraph Graph Algorithms & Schema (20%)

**Action**: Click the **Network / Graph Traversal** tab in the UI or show GSQL queries in `tigergraph/queries/`.

**Say**:
> "How does the agent make these decisions? Natively inside TigerGraph.
> 
> Our schema defines 10 vertex types (`Customer`, `Card`, `Transaction`, `DeviceProfile`, `BillingRegion`, etc.) and 14 bidirectional edge types.
> 
> We authored and deployed **7 custom GSQL queries**, including:
> 1. `transaction_neighborhood`: 2-hop ego-network retrieval.
> 2. `shared_device_clusters`: Detects multi-account device rings.
> 3. `temporal_velocity_burst`: Evaluates sub-threshold velocity structuring.
> 4. `similar_cases`: GraphRAG topological retrieval of closed case precedents.
> 
> These queries are invoked by our agent via the **official TigerGraph Model Context Protocol (MCP)** server. The agent executed **68 MCP tool calls** across the 20 benchmark cases (averaging 3.4 calls per case)."

---

## Minute 3:45 – 4:30 | Criterion 4: Innovation (15%) & Discovered Typologies

**Action**: Point to **`HHG-014`** or the Discovered Typologies section in the UI.

**Say**:
> "We didn't just hardcode standard textbook rules. By clustering the 5,565 historical closed cases in TigerGraph, our system uncovered **2 undocumented fraud typologies**:
> 1. **Cross-Card Anonymous Proxy Ring**: A single `Samsung SM-G935F` device operating behind an anonymous proxy linked to 23+ cardholder accounts.
> 2. **Sub-Threshold Structuring Burst**: Rapid sequences of 4 transactions structured just under $500 to dodge automated AML alerts.
> 
> In **`HHG-014`**, the agent traversed the device cluster, matched the topological footprint against historical case `CC-2649`, detected the proxy ring, and triggered policy `R9` to block connected cards."

---

## Minute 4:30 – 5:00 | Criterion 5: Explainability (10%) & Ledger Proof

**Action**: Scroll to the **Decision Ledger** and **Explainability Accordion** in the UI.

**Say**:
> "Every decision made by TRACE//GOA is legally defensible and auditable:
> 1. **Plain-English Rationale**: The agent explains *why* the verdict was reached, citing exact policy rules (R1–R10) and graph evidence.
> 2. **SHA-256 Hash-Chained Decision Ledger**: Every block cryptographically seals timestamp, event payload, and previous block hash. Zero fake Merkle claims—it is a verifiable, linear SHA-256 hash chain.
> 3. **Graph Write-Back**: All 20 cases write verdicts, findings, and actions back to TigerGraph vertices, updating organizational memory for future cases."

---

## 6. Closing Statement

> "TRACE//GOA turns fraud investigation from a slow, manual reactive queue into an agentic, graph-native intelligence loop. Every number in our demo is backed by code you can run yourself in 60 seconds with `.\scripts\run_all.ps1`.
> 
> Thank you! We welcome any questions."
