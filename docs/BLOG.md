# TRACE//GOA: Technical Blog

## Building a Graph-Native Agentic Fraud Investigation System on TigerGraph

*Hacker House Goa 2026 — Submission Walkthrough*

---

### What We Built

TRACE//GOA is an agentic fraud investigation engine that takes a live fraud alert and produces a fully reasoned, policy-compliant investigation record — including a verdict, evidence list, suspicious activity report (when required), and a next-best action recommendation that can change as evidence arrives.

The core thesis: fraud investigation is inherently a graph problem. Isolated transaction signals mislead. The answer lies in connections: the device a card shared with three other fraudulent accounts, the billing region with no prior cardholder footprint, the velocity burst designed to stay just under an authorization threshold. TigerGraph gives us the engine to traverse these connections in milliseconds.

---

### The Dataset

We built on the real IEEE-CIS HHGOA dataset:
- 590,742 card transactions (July–December 2016)
- 13,553 unique customers
- 144,432 identity records (device, OS, browser, proxy status)
- 5,565 closed investigations (months 1–4) as labeled training memory
- 20 benchmark cases (November–December) with no ground-truth labels

The dataset strips the original fraud flag and replaces it with a risk score. That risk score is explicitly described as "an input, not an answer." Half the high-scoring transactions are legitimate. This is what makes the problem interesting.

---

### How TigerGraph Is Used

**Schema Design.** We designed 10 vertex types and 14 edge types matching the dataset structure: `Customer`, `Card`, `Transaction`, `DeviceProfile`, `BillingRegion`, `EmailDomain`, `ClosedCase`, `Case`, `Finding`, `Action`. The schema supports bidirectional traversal, making device-sharing rings and region clusters straightforward to detect.

**GSQL Queries.** We installed 7 purpose-built queries:

1. `transaction_neighborhood` — 2-hop subgraph from any transaction to its card, customer, device, and billing region.
2. `shared_device_clusters` — from a DeviceProfile vertex, enumerate all connected cards and customers.
3. `device_reuse_detection` — detect a single device appearing on multiple distinct card accounts.
4. `ip_reuse_detection` — same pattern for IP addresses.
5. `shared_identity_attributes` — billing region and email domain clustering.
6. `temporal_velocity_burst` — transaction count and amount velocity within a configurable time window.
7. `similar_cases` — retrieve historically closed cases matching on pattern, card, or device.

**MCP Integration.** The agent connects to the official TigerGraph MCP server over stdio/HTTP, calling each query as a named tool with structured arguments. Every tool call is logged: name, arguments, latency, status, case_id. This is the mechanism that makes the investigation auditable.

**Case Write-Back.** Every completed investigation writes `Case`, `Finding`, and `Action` vertices back to the graph. This is the memory layer: the next investigation retrieves these vertices as similar closed cases, with their outcomes and analyst notes. The dataset explicitly asks for this.

---

### The Agentic Design

The agent is not a fixed 17-step script. It is a policy-gated evidence loop:

1. Receive trigger (risk score alert, customer report, analyst request).
2. Query the graph via MCP to assemble the subgraph.
3. Run pattern detectors (5 documented + 2 undocumented we discovered).
4. Synthesize a GraphRAG context: subgraph evidence + policy chunks + top-k similar closed cases.
5. Evaluate stopping rule: is fraud probability ≥ 0.85 with 2+ independent sources, or ≤ 0.15? If yes, act immediately.
6. If ambiguous (probability 0.30–0.70), request customer validation or step-up auth.
7. Update probability based on evidence response. Re-evaluate stopping rule.
8. Generate policy-compliant action list with approval routes (auto / L1 / L2).
9. Write case to TigerGraph. Log to ledger.

Different cases produce different tool sequences. HHG-014 (analyst request for unusual device) immediately triggers shared device cluster queries and an undocumented pattern classification. HHG-001 (risk score 0.61 on an in-person transaction) retrieves the customer's regional history, finds consistent prior activity, and closes the alert as legitimate in 6 tool calls.

---

### What We Learned from the Data

Before writing agent code, we analyzed the 5,565 closed cases. Key findings:

**The documented patterns are imbalanced.** Card-not-present fraud dominates (25%). Card testing is rare (0.3%) but highly concentrated. Out-of-region use has the weakest precision signal when the cardholder has confirmed travel.

**The undocumented patterns are real and recurring:**

1. *Cross-card anonymous proxy ring*: A single `Samsung SM-G935F` mobile device operating behind an anonymous proxy was used across 23+ distinct cardholder accounts in a single month. We found 4 historical closed cases where analysts confirmed this pattern but could not classify it. Our detector queries shared device clusters and checks `id_23 == 'anonymous'`.

2. *Sub-threshold structuring burst*: Bursts of exactly 4 online transactions within 40 minutes, each carefully structured just under a $500 authorization threshold. 5 historical precedents. This is textbook structuring behavior. Policy R9 applies.

**Calibration matters.** The dataset's own risk score is "often wrong in both directions." A score of 0.90 does not mean 90% fraud probability after investigation. We trained a logistic regression calibrator on the closed cases to produce honest probability estimates.

---

### The Evidence Loop

The dataset explicitly states customer and analyst responses are not provided and must be simulated. We implemented six simulation scenarios: customer confirmed, customer denied, no response in 24h, step-up success, step-up failure, and disputed recurring charge. Each scenario drives the recommendation in a policy-defined direction.

This means the system demonstrates real NBA flips:
- HHG-001 and HHG-005: initial `VERIFY_WITH_CUSTOMER` flips to `CLOSE_NO_FRAUD` after customer confirms.
- HHG-012: initial `MONITOR_CARD + VERIFY` flips to `BLOCK_CARD + CREATE_CASE` after customer denies.

---

### What Would Be Improved

In a production deployment:

1. **Real-time customer channels**: replace the simulator with actual SMS/email/app notification and response polling.
2. **TigerVector for case memory**: use TigerGraph's native vector search to retrieve similar cases by embedding similarity rather than attribute matching.
3. **LLM-selected tool sequences**: expose all 7 GSQL queries as MCP tools and let the LLM choose which to call based on the trigger type, rather than a heuristic ordering.
4. **Community detection at scale**: run Louvain or WCC across the full 590k-transaction graph to pre-compute fraud ring clusters; expose these as an additional MCP tool.
5. **Continuous monitoring**: use TigerGraph change data capture to trigger investigations automatically as new transactions arrive, not just on a case-pack batch.

---

### Architecture

```
React 19 Frontend (TypeScript + Vite)
    ↓ SSE + REST
FastAPI Backend (Python 3.14)
    → Agentic Investigation Engine
        → TigerGraph MCP Client → TigerGraph FraudInvestigationGraph
        → GraphRAG Synthesizer → Policy Docs + Case Memory
        → LLM Provider (Gemini / OpenAI)
        → PolicyEngine (R1-R10, deterministic)
        → Approval Engine (auto / L1 / L2)
    → SHA-256 Hash-Chained Audit Ledger
    → Case Write-Back → TigerGraph
```

---

*TRACE//GOA was built at Hacker House Goa 2026 for the TigerGraph Agentic Fraud Investigation challenge.*
