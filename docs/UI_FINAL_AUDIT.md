# TRACE//GOA — UI Forensic Audit & Refinement Matrix

Date: 2026-09-24  
Auditor: Principal Front-End & Fraud Systems Engineer  
Aesthetic Alignment: Hacker House Goa 2026 Brand Kit (`#0B6839`, `#FEE101`, `#FF0080`, `#000000`, `#FFFBE8`, `#FFFFFF`)  
Information Architecture: Fraud Intelligence Terminal & Autonomous Action Engine

---

## 1. UI Forensic Review

| Area | Current State | Problem / Gap | Architectural Fix |
| :--- | :--- | :--- | :--- |
| **Hero Section** | Event-heavy feel with manifesto quote and draggable "जाँच" sticker | Can feel like a conference landing page rather than a serious fraud intelligence command center | Re-anchor hierarchy: `TRACE` / `GOA` stacked didone title, "Agentic Fraud Investigation & Next-Best Action Engine", tagline "TRACE THE SIGNAL. FIND THE NETWORK. MAKE THE MOVE.", technical metadata pill (`TIGERGRAPH • MCP • GRAPHRAG • CASE MEMORY • HUMAN APPROVAL • AUDIT LEDGER`), primary CTA "START INVESTIGATION" and secondary "VIEW BENCHMARK". |
| **Signpost Metrics** | Static/default numbers: 20 cases, 13 fraud, 5565 precedents, 87.24% accuracy | Hardcoded presentation can be misconstrued as live production claims rather than benchmark metrics | Connect metrics directly to `fetchMetrics()` and `fetchCompetitionCases()`. Explicitly label numbers as "RECORDED BENCHMARK EXAM", and display Majority-Class Baseline (65.0%) side-by-side with Backtest Accuracy (87.24%). |
| **Case Village** | 20 beach-shack grid with color-coded shutters | Hover and status metadata could communicate more explicit fraud intelligence signals | Enrich shack cards to display: Case ID, Risk Score, Confidence %, Fraud Pattern, Primary NBA, Approval Status, and Ledger status. Refine hover lift and direct zoom-in to investigation on click. |
| **Investigation View** | 3-column layout with docket header, graph, timeline, and notice board | Information density can be tightened to feel like a high-stakes intelligence operations table | Header clearly displays Case ID, Risk %, Confidence %, 70% Action Cutoff, and Status badge. Sun & Tide gauge prioritizes crisp numerical metrics over decorative aesthetics. |
| **Network Graph** | TigerGraph 2-hop traversal with SVG nodes and hop wave toggle | Node inspection details could be clearer for trigger transactions vs syndicate entities | Trigger transaction highlighted in Yellow, suspicious cluster entities in Pink, neutral/cleared entities in Green/Off-White. Explicit 1-Hop, 2-Hop, and Hop Wave buttons. |
| **Evidence Notice Board** | Cork texture with pins, tape strips, and signals/guardrails/memory tabs | Evidence categorization could differentiate supporting vs mitigating signals even more crisply | Three distinct sections: Signals (Incriminating vs Mitigating vs Uncertainty Gaps), Guardrails (Institutional Policies via GraphRAG), and Memory (Precedents from closed dockets). |
| **Next-Best Action (NBA)** | NBA card with graph delta toggle and authorize button | Needs to be the undisputed visual hero of the decision engine | Large poster card with high-impact color, explicit Before-vs-After Evidence delta ("EVIDENCE CHANGED THE DECISION" vs "EVIDENCE CONFIRMED THE DECISION"), policy citations, and RBAC authorization tier. |
| **Approval Center** | Rubber stamps (`APPROVED`, `REJECTED`, `ESCALATED`) with role input | If role is unauthorized, UI shouldn't allow pretend approval | Add padlock icon and tooltip ("Requires Fraud Manager approval") when active role does not meet required clearance level. |
| **Decision Ledger** | SHA-256 blocks with sweep integrity button | Historical mention of "Merkle" needed deprecation to match true hash-chaining implementation | Strictly label as "SHA-256 HASH-CHAINED DECISION LEDGER". Visual flow shows Block N -> Hash(N) -> Hash(N+1) with Prev Hash, Event, Actor, Decision, Timestamp, and Current Hash. |
| **Demo Walkthrough** | 5-step guided walkthrough | Could be ambiguous whether execution is live or replay | Prominently label: "▶ RUN JUDGE DEMO (REPLAY OF RECORDED INVESTIGATION)". Add Pause, Next, Previous, and Restart controls. |
| **Header Badges** | Backend diagnostic badges in header | Needs strict honesty about runtime modes | Reflect exact status from `GET /api/system/diagnostics`: `GRAPH: TIGERGRAPH (LIVE)` vs `GRAPH: SIMULATOR`, `LLM: GEMINI` vs `LLM: DETERMINISTIC RULES`. |

---

## 2. Refinement Implementation Plan

1. **Header & Diagnostics**:
   - Verify `Header.tsx` binds directly to `fetchDiagnostics()`.
   - Badges show live runtime status (`GRAPH: TIGERGRAPH` / `SIMULATOR`, `LLM: GEMINI` / `DETERMINISTIC`).
2. **Hero Section (`HeroSection.tsx`)**:
   - Product-centric hierarchy:
     - `TRACE // GOA`
     - `Agentic Fraud Investigation & Next-Best Action Engine`
     - Subline: `TRACE THE SIGNAL. FIND THE NETWORK. MAKE THE MOVE.`
     - Metadata pills: `TIGERGRAPH • MCP • GRAPHRAG • CASE MEMORY • HUMAN APPROVAL • AUDIT LEDGER`
     - Primary button: `START INVESTIGATION` -> scrolls to or opens investigation.
     - Secondary button: `VIEW BENCHMARK` -> navigates to demo mode.
     - Draggable pink Devanagari **"जाँच"** sticker preserved.
3. **Signpost Stats (`SignpostStats.tsx`)**:
   - Display real counts from API.
   - Show Majority-Class Baseline (65.0%) alongside Accuracy (87.24%).
   - Label explicitly as "BENCHMARK EXAM RUN".
4. **Investigation Centerpiece**:
   - `SunTideGauge.tsx`: Clear numbers (Risk 78%, Confidence 84%, Stop-Rule 70%, ENOUGH TO ACT / STEP-UP REQ).
   - `ActionCard.tsx`: Before vs After Evidence comparison ("EVIDENCE CHANGED THE DECISION" or "EVIDENCE CONFIRMED THE DECISION").
   - `ApprovalCenter.tsx`: Padlock when unauthorized by active role.
   - `DecisionLedgerViewer.tsx`: "SHA-256 HASH-CHAINED DECISION LEDGER", Block N -> Hash(N) -> Hash(N+1).
   - `DemoWalkthrough.tsx`: "REPLAY OF RECORDED RUN" vs "LIVE RUN", step controls (PAUSE, NEXT, PREV, RESTART).
