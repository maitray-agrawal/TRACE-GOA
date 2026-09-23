# HHGOA Decision Model: Uncertainty, Policy Rules, and Next-Best Action

This document details the deterministic decision engine, confidence calculations, uncertainty scoring matrices, and next-best action resolution algorithms used across the **HHGOA Fraud Investigation System**.

---

## 1. Multi-Factor Risk & Confidence Scoring

Confidence and risk are never hallucinated by an LLM. They are computed deterministically across seven objective dimensions:

$$\text{Confidence} = w_1 S_{\text{risk}} + w_2 S_{\text{graph}} + w_3 S_{\text{pattern}} + w_4 S_{\text{history}} + w_5 S_{\text{policy}} + w_6 S_{\text{completeness}} - w_7 S_{\text{contradiction}}$$

### Factor Definitions & Weights:

| Factor | Notation | Weight ($w_i$) | Calculation Methodology |
| :--- | :---: | :---: | :--- |
| **Model Risk Score** | $S_{\text{risk}}$ | 0.20 | Raw baseline transaction anomaly score $[0.0, 1.0]$. |
| **Graph Strength** | $S_{\text{graph}}$ | 0.25 | Density of suspicious edges (device reuse degree, shared IP subnets, known fraud entity co-occurrence). |
| **Pattern Confidence** | $S_{\text{pattern}}$ | 0.25 | Max confidence among matched canonical fraud typologies ($0.0$ if no pattern matches). |
| **Historical Similarity** | $S_{\text{history}}$ | 0.10 | Cosine/Jaccard similarity to confirmed historical fraud cases stored in Case Memory. |
| **Policy Alignment** | $S_{\text{policy}}$ | 0.10 | Degree to which transaction matches explicit bank policy red flags. |
| **Evidence Completeness**| $S_{\text{completeness}}$| 0.10 | Ratio of present required signals (Device, IP, Geolocation, Email, Amount) to total required (5). |
| **Contradictory Penalty**| $S_{\text{contradiction}}$| 0.15 | Penalty deducted for benign signals (e.g. established 2-year account, biometric match, physical merchant PIN verified). |

---

## 2. Uncertainty Decision Matrix

Based on computed Risk and Confidence, the system routes the investigation into four deterministic operational tiers:

```text
  1.0 ┌─────────────────────────────┬─────────────────────────────┐
      │  HIGH RISK / LOW CONFIDENCE │  HIGH RISK / HIGH CONFIDENCE│
      │  Tier: INSUFFICIENT EVIDENCE│  Tier: DEFINITIVE FRAUD     │
      │  Action: Step-up Auth OTP   │  Action: BLOCK_TRANSACTION  │
      │          Customer Challenge │          + ESCALATE TO SAR  │
 R    ├─────────────────────────────┼─────────────────────────────┤
 I    │  LOW RISK / LOW CONFIDENCE  │  LOW RISK / HIGH CONFIDENCE │
 S    │  Tier: AMBIGUOUS BENIGN     │  Tier: DEFINITIVE LEGITIMATE│
 K    │  Action: MONITOR_TRANSACTION│  Action: ALLOW_TRANSACTION  │
      │          Passive Telemetry  │          Zero Friction      │
  0.0 └─────────────────────────────┴─────────────────────────────┘
      0.0                        Confidence                     1.0
```

### Operational Rules:
1. **Definitive Fraud** ($\text{Risk} \ge 0.75 \text{ and } \text{Confidence} \ge 0.70$):
   - Sufficient evidence exists to take enforcement action.
   - Propose `BLOCK_TRANSACTION` and `BLOCK_ACCOUNT`.
   - Route to `SENIOR_ANALYST` or `FRAUD_MANAGER`.
2. **Insufficient Evidence / Uncertainty Gap** ($\text{Risk} \ge 0.60 \text{ and } \text{Confidence} < 0.70$):
   - Propose `REQUEST_STEP_UP_AUTH` or `REQUEST_CUSTOMER_VALIDATION`.
   - Transition case state to `AWAITING_EVIDENCE`.
   - Await OTP response or document verification.
   - Upon receiving evidence, initiate `REASSESSMENT`.
3. **Ambiguous Benign** ($\text{Risk} < 0.60 \text{ and } \text{Confidence} < 0.70$):
   - Propose `MONITOR_TRANSACTION` or `WARN_CUSTOMER`.
   - No customer-facing friction.
4. **Definitive Legitimate** ($\text{Risk} < 0.40 \text{ and } \text{Confidence} \ge 0.65$):
   - Propose `ALLOW_TRANSACTION`.
   - Auto-resolve case as `CLEARED_FALSE_POSITIVE`.

---

## 3. The 12 Next-Best Action (NBA) Definitions

Each proposed action includes priority, default approval requirement, and execution effect:

| Action Code | Priority | Approval Level | Mock Execution Effect |
| :--- | :--- | :--- | :--- |
| `ALLOW_TRANSACTION` | NORMAL | None | Marks transaction approved in core banking engine |
| `BLOCK_TRANSACTION` | CRITICAL | Senior Analyst | Emits payment gateway reject webhook; reverses pending authorization |
| `MONITOR_TRANSACTION` | LOW | None | Tags transaction in stream processing for 72-hour observation |
| `BLOCK_ACCOUNT` | CRITICAL | Fraud Manager | Suspends customer online portal access, disables debit cards |
| `MONITOR_ACCOUNT` | MEDIUM | Analyst | Adds customer ID to heightened fraud monitoring watchlist |
| `WARN_CUSTOMER` | MEDIUM | None | Dispatches transactional SMS warning: "Suspicious login attempt detected" |
| `CREATE_CASE` | LOW | None | Initializes new case docket in Case Management DB |
| `REQUEST_MORE_EVIDENCE`| MEDIUM | Analyst | Puts payment on 15-minute operational hold pending manual review |
| `REQUEST_CUSTOMER_VALIDATION`| HIGH | Analyst | Sends out-of-band email prompt to verify transaction legitimacy |
| `REQUEST_STEP_UP_AUTH`| HIGH | Analyst | Triggers mobile push notification / biometrics / OTP prompt |
| `ESCALATE_TO_ANALYST` | HIGH | Senior Analyst | Routes case docket to Senior Financial Crime queue |
| `FILE_REPORT` | CRITICAL | Fraud Manager | Generates structured Suspicious Activity Report (SAR) XML/JSON draft |

---

## 4. Policy Engine Constraints

The `PolicyEngine` enforces four categorical outcomes:
1. `ALLOWED`: Action conforms to all bank operating policies and risk parameters.
2. `ALLOWED_WITH_APPROVAL`: Permitted only after explicit electronic sign-off by designated role.
3. `PROHIBITED`: Action violates hard constraints (e.g. attempting to block an account without high-confidence multi-entity graph proof).
4. `REQUIRES_MORE_EVIDENCE`: Action deferred until missing critical attributes (e.g. OTP validation or merchant verification) are collected.

### Regulatory Thresholds:
- **Bank Secrecy Act (BSA) / FinCEN SAR Requirement**: If cumulative fraudulent transactions across connected graph entities exceed **$5,000 USD** (or $2,000 where an insider is suspected), `FILE_REPORT` is automatically flagged as mandatory.
- **Regulation E**: Consumers must not be held liable for unauthorized electronic fund transfers when reporting promptly; transactions flagged as Account Takeover (`ATO_ADDRESS_LAUNDER`) mandate provisional credit recommendations.
