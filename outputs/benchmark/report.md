# TRACE//GOA — 20-Case Benchmark Evaluation Report

## Executive Summary

- **Total Benchmark Cases Processed**: 20
- **SHA-256 Ledger Integrity**: 20/20 Chains Cryptographically Valid (100%)
- **TigerGraph Case Write-Back**: 20/20 Persisted (100%)
- **SAR Filings Generated (FinCEN BSA)**: 3 Cases

## Benchmark Results Table

| Case ID | Pattern | Risk | Conf | Pre-Ev NBA | Post-Ev NBA | Approval Role | Write-Back | Ledger |
|---------|---------|------|------|------------|-------------|---------------|------------|--------|
| CASE-001 | DEVICE_FARM | 0.94 | 0.68 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-002 | DEVICE_FARM | 0.88 | 0.66 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-003 | ATO_ADDRESS_LAUNDER | 0.73 | 0.84 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-004 | CARD_TESTING | 0.92 | 0.70 | STEP_UP_CHALLENGE | FILE_REPORT | FRAUD_MANAGER | SUCCESS | VALID |
| CASE-005 | CARD_TESTING | 0.85 | 0.62 | STEP_UP_CHALLENGE | MONITOR_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-006 | NONE | 0.22 | 0.14 | MONITOR_TRANSACTION | ALLOW_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-007 | NONE | 0.35 | 0.17 | MONITOR_TRANSACTION | ALLOW_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-008 | DEVICE_FARM | 0.91 | 0.67 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-009 | DEVICE_FARM | 0.86 | 0.66 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-010 | CARD_TESTING | 0.82 | 0.62 | STEP_UP_CHALLENGE | MONITOR_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-011 | CARD_TESTING | 0.89 | 0.69 | STEP_UP_CHALLENGE | FILE_REPORT | FRAUD_MANAGER | SUCCESS | VALID |
| CASE-012 | ATO_ADDRESS_LAUNDER | 0.78 | 0.85 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-013 | NONE | 0.18 | 0.12 | MONITOR_TRANSACTION | ALLOW_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-014 | DEVICE_FARM | 0.95 | 0.68 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-015 | DEVICE_FARM | 0.87 | 0.66 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-016 | ATO_ADDRESS_LAUNDER | 0.93 | 0.89 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |
| CASE-017 | DEVICE_FARM | 0.90 | 0.69 | STEP_UP_CHALLENGE | FILE_REPORT | FRAUD_MANAGER | SUCCESS | VALID |
| CASE-018 | CARD_TESTING | 0.84 | 0.62 | STEP_UP_CHALLENGE | MONITOR_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-019 | NONE | 0.64 | 0.52 | STEP_UP_CHALLENGE | MONITOR_TRANSACTION | NONE | SUCCESS | VALID |
| CASE-020 | DEVICE_FARM | 0.98 | 0.69 | STEP_UP_CHALLENGE | BLOCK_TRANSACTION | SENIOR_ANALYST | SUCCESS | VALID |

## Subsystem Verification Matrix

- [x] **TigerGraph Graph Traversal**: 2-hop neighborhood expansion and centrality computed.
- [x] **GraphRAG Synthesis**: Evidence pack structured with immutable provenance.
- [x] **Uncertainty Loop**: Step-up challenges dispatched when risk is elevated but graph confidence is incomplete.
- [x] **Deterministic NBA**: PolicyEngine rules enforce institutional and regulatory constraints.
- [x] **RBAC Clearance**: High-impact actions (e.g. account freezing) correctly routed to senior fraud roles.
- [x] **Tamper-Evident Ledger**: Full SHA-256 state transition verification.
