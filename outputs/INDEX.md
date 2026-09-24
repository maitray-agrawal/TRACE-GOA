# TRACE//GOA — Canonical Benchmark Index (20 Cases)

Generated automatically from canonical execution files in `outputs/cases/`.

| Case ID | Verdict | Pattern | Exposure | Initial NBA | Ev. Req? | Final NBA | What Changed? | SAR? | Graph WB? | Model |
|---|---|---|---|---|---|---|---|---|---|---|
| `HHG-001` | **LEGITIMATE** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `ALLOW_TRANSACTION (auto)` | Customer response changed verdict from UNCERTAIN to LEGITIMATE. Deterministic rule: prob=0.09, sources=2, confirmed=True, denied=False. | NO | YES | `gemini-2.5-flash` |
| `HHG-002` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-003` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-004` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-005` | **LEGITIMATE** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `ALLOW_TRANSACTION (auto)` | Customer response changed verdict from UNCERTAIN to LEGITIMATE. Deterministic rule: prob=0.08, sources=2, confirmed=True, denied=False. | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-006` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-007` | **LEGITIMATE** | `none` | $0.00 | `BLOCK_CARD (L1)` | YES | `ALLOW_TRANSACTION (auto)` | Customer response changed verdict from FRAUD to LEGITIMATE. Deterministic rule: prob=0.13, sources=2, confirmed=True, denied=False. | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-008` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-009` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-010` | **FRAUD** | `card_not_present_new_device` | $1000.03 | `BLOCK_CARD (L1)` | NO | `BLOCK_CARD (L1)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-011` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-012` | **FRAUD** | `out_of_region_use` | $30.91 | `MONITOR_CARD (auto)` | YES | `BLOCK_CARD (L1)` | Customer response changed verdict from UNCERTAIN to FRAUD. Deterministic rule: prob=0.85, sources=2, confirmed=False, denied=True. | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-013` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-014` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-015` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-016` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-017` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-018` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-019` | **FRAUD** | `card_not_present_new_device` | $99.92 | `BLOCK_CARD (L1)` | NO | `BLOCK_CARD (L1)` | nothing | NO | YES | `DETERMINISTIC_RULES` |
| `HHG-020` | **UNCERTAIN** | `none` | $0.00 | `MONITOR_CARD (auto)` | YES | `MONITOR_CARD (auto)` | nothing | NO | YES | `DETERMINISTIC_RULES` |

## Summary Metrics

- **Total Cases**: 20
- **Verdicts**: 3 Fraud · 3 Legitimate · 14 Uncertain
- **Evidence-Driven Flips**: 4 cases (HHG-001, HHG-005, HHG-007, HHG-012)
- **SAR Filings (Policy R1/R2)**: 0
- **Total Tool Calls**: 68 (Avg 3.4 per case)
- **Total Tokens (Measured)**: 1553
- **Graph Write-Back**: 20/20 Cases Verified
