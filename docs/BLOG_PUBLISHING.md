# TRACE//GOA — Blog Publishing Kit

Use this guide to copy-paste and publish the technical blog post on Dev.to, Hashnode, or Medium.

---

## 1. Publishing Metadata

- **Post Title**: Building a Graph-Native Agentic Fraud Investigation System on TigerGraph
- **Subtitle**: How we combined TigerGraph GSQL, Model Context Protocol (MCP), Gemini 2.5, and deterministic policy gating to investigate fraud rings at Hacker House Goa 2026.
- **Author**: Maitray Agrawal
- **Reading Time**: ~7 min
- **Primary Tags**: `#tigergraph`, `#fraudprevention`, `#aiagents`, `#graphdatabase`, `#hackathon`
- **Secondary Tags**: `#gsql`, `#mcp`, `#cybersecurity`, `#fintech`
- **Canonical URL**: `https://github.com/maitray-agrawal/TRACE-GOA/blob/main/docs/BLOG.md`
- **Repository URL**: `https://github.com/maitray-agrawal/TRACE-GOA`

---

## 2. Dev.to / Hashnode Frontmatter (Copy-Paste Ready)

```yaml
---
title: Building a Graph-Native Agentic Fraud Investigation System on TigerGraph
published: true
description: How we built TRACE//GOA, an agentic fraud investigation engine on TigerGraph and Gemini for Hacker House Goa 2026.
tags: tigergraph, aiagents, fraudprevention, fintech
cover_image: https://raw.githubusercontent.com/maitray-agrawal/TRACE-GOA/main/docs/assets/screenshots/hero_1440x900.png
canonical_url: https://github.com/maitray-agrawal/TRACE-GOA/blob/main/docs/BLOG.md
---
```

---

## 3. Recommended Cover Image Asset

- Primary asset in repository: `docs/assets/screenshots/hero_1440x900.png`
- Alternative banner prompt:
  > "Sun-drenched retro Goa hacker aesthetic command center with neon amber and deep cobalt graph network visualizations, palm trees silhouette, modern flat vector poster art, 4k ultra-crisp"

---

## 4. Social Sharing Snippets

### A. Twitter / X Thread

```text
🚀 Excited to unveil TRACE//GOA for the @TigerGraphDB Hackathon at @HackerHouseGoa!

Traditional fraud systems look at transactions in silos. TRACE//GOA treats fraud as a connected graph problem.

Here’s how we built an agentic investigation engine that flips actions when evidence arrives 🧵👇

1/6 Fraud isn't a flat table. A single Samsung phone shared across 23 card accounts is invisible in a single transaction row, but glows bright in a 2-hop TigerGraph GSQL traversal.

2/6 We authored 7 custom GSQL queries and exposed them to Google Gemini 2.5 Flash via the official Model Context Protocol (MCP) standard. 68 MCP tool calls across 20 benchmark cases.

3/6 The Agentic Loop: Subgraph Discovery ➔ GraphRAG Synthesis ➔ Uncertainty Stopping Rule ➔ Customer Evidence Loop ➔ Deterministic Policy Gating (R1-R10) ➔ Next-Best Action.

4/6 Real Next-Best Action Flips: 4 out of 20 benchmark cases (20%) flipped their action after customer feedback (e.g. HHG-001 flipped from MONITOR to ALLOW after travel verification).

5/6 Proven Numbers:
✅ 87.24% accuracy on 5,565 historical closed cases (+3.59 pp lift over 83.65% baseline)
✅ 0.9412 PR-AUC & 0.9004 Fraud F1
✅ SHA-256 hash-chained decision ledger
✅ 20/20 cases written back to TigerGraph memory

6/6 Explore the open-source repo & reproducible benchmark:
👉 https://github.com/maitray-agrawal/TRACE-GOA
#TigerGraph #AIAgents #GraphDatabase #Fintech #HackerHouseGoa
```

### B. LinkedIn Post

```text
Proud to share our project for the Hacker House Goa 2026 Hackathon: TRACE//GOA — Graph-Native Agentic Fraud Investigation & Next-Best Action Engine.

Fraud detection today faces a chronic problem: alert fatigue and high false positive rates. When fraud analysts review tabular alerts, half of high-scoring transactions are actually legitimate cardholders traveling or using family devices.

We built TRACE//GOA on TigerGraph to solve this:
🔹 Graph Schema & GSQL: 10 vertex types and 7 custom GSQL queries to detect device-sharing rings, velocity bursts, and out-of-region clusters in milliseconds.
🔹 Model Context Protocol (MCP): Official TigerGraph MCP client integration enabling LLMs to autonomously query graph neighborhoods.
🔹 Agentic Evidence Loop: Evaluates epistemic uncertainty and pauses for step-up evidence, demonstrating real Next-Best Action flips in 20% of benchmark cases.
🔹 Deterministic Policy Engine: Banking actions are governed by strict rule gates (R1–R10) with multi-tiered approval routes (auto, L1, L2).
🔹 SHA-256 Hash-Chained Ledger: Full cryptographic audit trail for regulatory compliance.

Benchmark Results on 590k IEEE-CIS transactions:
• 87.24% accuracy across 5,565 closed cases (+3.59 pp lift over baseline)
• 0.9412 PR-AUC / 0.9004 Fraud F1
• 100% offline reproducible with verified benchmark outputs

Check out our full technical write-up and GitHub repository:
https://github.com/maitray-agrawal/TRACE-GOA

#TigerGraph #GraphDatabases #ArtificialIntelligence #Fintech #FraudPrevention #OpenSource
```
