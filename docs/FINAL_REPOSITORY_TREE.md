# TRACE//GOA — Canonical Repository Tree

This document outlines the final layout of the `TRACE-GOA` repository at release.

```text
TRACE-GOA/
├── .env.example                               # Pinned environment variable template
├── .gitignore                                 # Clean exclusion rules (large CSVs, .env, dist)
├── Makefile                                   # Unix-compatible commands
├── README.md                                  # Primary project overview, Mermaid architecture, quickstart
├── requirements.txt                           # Pinned Python dependencies
│
├── backend/                                   # FastAPI backend & Agentic Pipeline
│   ├── app/
│   │   ├── main.py                            # FastAPI application entrypoint
│   │   ├── config.py                          # Environment and runtime settings
│   │   ├── agent/                             # Autonomous investigation loop
│   │   │   ├── core.py                        # Hypothesis-driven investigation engine
│   │   │   ├── stopping.py                    # Epistemic uncertainty evaluation
│   │   │   └── explainability.py              # Natural language synthesis
│   │   ├── api/                               # REST & SSE API endpoints
│   │   │   └── routes.py                      # Cases, diagnostics, stream endpoints
│   │   ├── graph/                             # Graph database client layer
│   │   │   ├── client.py                      # pyTigerGraph client & in-memory simulator
│   │   │   └── queries.py                     # GSQL query abstractions
│   │   ├── ledger/                            # Cryptographic audit ledger
│   │   │   └── audit.py                       # SHA-256 hash-chained block engine
│   │   ├── llm/                               # Model providers
│   │   │   ├── provider.py                    # Gemini & deterministic rule fallback
│   │   │   └── prompts.py                     # Structured few-shot prompt templates
│   │   ├── mcp/                               # Model Context Protocol
│   │   │   └── client.py                      # TigerGraph MCP tool dispatcher
│   │   ├── patterns/                          # Fraud typology detectors
│   │   │   └── detector.py                    # 5 documented + 2 discovered typologies
│   │   └── policy/                            # Deterministic governance
│   │       ├── engine.py                      # Rules R1–R10 evaluation
│   │       └── approval.py                    # Multi-tiered action clearance (auto/L1/L2)
│
├── cache/                                     # Deterministic response cache
│   └── llm/                                   # Pre-recorded LLM outputs for offline benchmark
│
├── data/                                      # Competition datasets
│   ├── README.md                              # Dataset documentation and provenance
│   ├── DATASET_README.md                      # IEEE-CIS challenge details
│   └── competition/
│       ├── README.md                          # Instructions for downloading full 700MB raw CSVs
│       └── benchmark_subgraphs.json           # 26,643 txns (committed 14MB fixture for instant eval)
│
├── dev_fixtures/                              # Isolated legacy development fixtures
│   ├── README.md                              # Notice: fixtures for schema tests, not benchmark truth
│   ├── raw/                                   # Synthetic 243-txn seed CSVs
│   ├── processed/                             # Synthetic benchmark JSONs
│   └── legacy_runs/                           # Early single-case trial artifacts (case_01..case_20)
│
├── docs/                                      # Documentation suite
│   ├── ARCHITECTURE.md                        # Detailed technical architecture
│   ├── BLOG.md                                # Full technical publication article
│   ├── BLOG_PUBLISHING.md                     # Ready-to-copy social & platform metadata
│   ├── DATASET_ANALYSIS.md                    # Statistical profiling of 590k transactions
│   ├── DATA_DICTIONARY.md                     # Entity attribute definitions
│   ├── DECISION_MODEL.md                      # Policy rules R1–R10 formal specifications
│   ├── DEMO_SCRIPT.md                         # 3–5 min judge presentation walkthrough
│   ├── FINAL_REPOSITORY_TREE.md               # This directory manifest
│   ├── FINAL_RELEASE_REPORT.md                # Submission release summary
│   ├── FINAL_SUBMISSION_CHECKLIST.md          # Pre-flight checklist
│   ├── JUDGE_SCORECARD.md                     # 6 judging criteria cross-reference
│   ├── PRE_SUBMISSION_FORENSIC_AUDIT.md       # Claim-truth verification matrix
│   ├── REPOSITORY_CLEANUP.md                  # Restructuring audit log
│   ├── SOCIAL_POST.md                         # Short-form social media snippets
│   ├── THREAT_MODEL.md                        # Fraudster attack vectors & countermeasures
│   ├── UI_DESIGN_NOTES.md                     # Hacker House Goa design rationale
│   ├── assets/screenshots/                    # UI screenshots across resolutions
│   └── dev-notes/                             # Internal audit notes & transition memos
│
├── frontend/                                  # React 19 + TypeScript + Vite UI
│   ├── index.html                             # Single-page application entrypoint
│   ├── package.json                           # Dependencies & scripts
│   ├── vite.config.ts                         # Vite configuration
│   └── src/                                   # Goa poster visual design system
│       ├── App.tsx                            # Root application component
│       ├── index.css                          # Typography, CSS variables, poster palette
│       └── components/                        # UI components
│           ├── Header.tsx                     # Sun-drenched banner & runtime badges
│           ├── SignpostMetrics.tsx            # Backtest accuracy & baseline cards
│           ├── CaseVillage.tsx                # Interactive 20-case hut grid
│           ├── TimelineViewer.tsx             # Investigation trace & tide gauge
│           ├── GraphViewer.tsx                # TigerGraph topological neighborhood view
│           ├── EvidenceNoticeBoard.tsx        # Dynamic evidence cards & hypothesis tests
│           ├── ActionClearanceBoard.tsx       # Next-Best Action cards & approval stamps
│           ├── DecisionLedgerView.tsx         # SHA-256 hash-chained block explorer
│           ├── ExplainabilityAccordion.tsx    # Natural language rationale & rule citations
│           └── PastEditionsMemoryStrip.tsx    # Historical closed-case memory precedents
│
├── outputs/                                   # Canonical benchmark outputs
│   ├── INDEX.md                               # Artifact manifest with hashes and sizes
│   ├── RUN_METADATA.json                      # Machine-readable execution telemetry
│   ├── benchmark/
│   │   ├── canonical_results.json             # Single source of benchmark ground truth
│   │   └── canonical_report.md                # Formatted markdown benchmark report
│   └── cases/                                 # 20 competition answer JSONs
│       ├── HHG-001.json
│       ├── ...
│       └── HHG-020.json
│
├── scripts/                                   # Automation scripts
│   ├── run_all.ps1                            # Windows PowerShell one-command runner
│   ├── run_all.sh                             # Linux/macOS one-command runner
│   ├── validate_outputs.py                    # Strict JSON schema validator for 20 cases
│   ├── benchmark/
│   │   ├── run_competition_benchmark.py       # Canonical benchmark execution engine
│   │   └── generate_canonical_artifacts.py    # Report & metadata generator
│   └── ingest/
│       ├── generate_seed_dataset.py           # Synthetic seed generator (dev only)
│       └── prepare_subgraphs.py               # Subgraph extractor from IEEE-CIS CSVs
│
├── tests/                                     # Automated test suite (43 passed)
│   ├── conftest.py                            # Pytest fixtures and mocks
│   ├── unit/                                  # 33 unit tests
│   │   ├── test_agent.py
│   │   ├── test_graph_client.py
│   │   ├── test_ledger.py
│   │   ├── test_mcp_client.py
│   │   ├── test_patterns.py
│   │   └── test_policy.py
│   └── integration/                           # 10 integration tests
│       ├── test_api.py
│       └── test_pipeline.py
│
└── tigergraph/                                # TigerGraph Native GSQL Assets
    ├── schema/
    │   └── schema.gsql                        # 10 vertex types, 14 edge types
    ├── loading_jobs/
    │   └── load_data.gsql                     # Parallel batch loading script
    └── queries/                               # 7 production GSQL queries
        ├── device_reuse_detection.gsql
        ├── ip_reuse_detection.gsql
        ├── shared_device_clusters.gsql
        ├── shared_identity_attributes.gsql
        ├── similar_cases.gsql
        ├── temporal_velocity_burst.gsql
        └── transaction_neighborhood.gsql
```
