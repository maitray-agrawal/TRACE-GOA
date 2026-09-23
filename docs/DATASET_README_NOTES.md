# Dataset & Policy Ground Truth: IEEE-CIS Hacker House Goa Edition

Source document: `data/competition/README.md`
Verification timestamp: 2026-09-23
Dataset integrity verified via: `scripts/verify_data.py` (590,742 transactions, 144,432 identities, 5,565 closed cases, 13,553 customers, 20 benchmark cases).

---

## 1. Dataset Files & Schema

### `transactions.csv` (590,742 rows, 397 columns)
- **Primary Key**: `TransactionID`
- **Added Banking Context**:
  - `customer_id`: e.g. `C01234` (~13,553 unique customers)
  - `ts`: Real timestamp `YYYY-MM-DD HH:MM:SS` (2016-07-02 to 2016-12-31)
  - `channel`: `in_person` (`ProductCD == 'W'`) or `online` (other product codes)
  - `risk_score`: 0.0 to 1.0 from bank's ML detection model (signal only, not truth)
- **Vesta / IEEE-CIS Original Columns**:
  - `TransactionDT`: Seconds from start
  - `TransactionAmt`: Transaction amount in USD
  - `ProductCD`: Product code (`W`, `C`, `H`, `R`, `S`)
  - `card1` to `card6`: Card network (`card4`), card type (`card6`), issuer codes
  - `addr1`, `addr2`: Billing region (`addr1`) and country code (`addr2`, 87 = home)
  - `dist1`, `dist2`: Physical distances
  - `P_emaildomain`, `R_emaildomain`: Purchaser and recipient email domains
  - `C1` to `C14`: Count features (addresses, phones linked)
  - `D1` to `D15`: Time delta features (days since prior events)
  - `M1` to `M9`: Match flags (e.g. name on card matching address)
  - `V1` to `V339`: Engineered relationship and ranking features

### `identity.csv` (144,432 rows, 41 columns)
- **Join Key**: `TransactionID` (present for online transactions)
- **Device & Environment**:
  - `DeviceType`: `desktop` or `mobile`
  - `DeviceInfo`: Device model/platform (e.g. `SAMSUNG SM-G935F Build/NRD90M`)
  - `id_12` to `id_38`: Categorical identity features:
    - `id_15`: Device status (`New` / `Found`)
    - `id_23`: Proxy status (`transparent`, `anonymous`, `hidden`)
    - `id_30`: Operating System (e.g. `Android 7.0`, `iOS 11.1.2`, `Windows 10`)
    - `id_31`: Browser (e.g. `chrome 62.0`, `samsung browser 6.2`)
    - `id_33`: Screen resolution (e.g. `2220x1080`, `1920x1080`)
    - `id_34`: Match status
  - `id_01` to `id_11`: Numeric encoded ratings (device rating, IP domain rating, proxy rating, login counts)

### `closed_cases_history.csv` (5,565 rows)
- **Columns**: `case_id`, `customer_id`, `card_id`, `opened_at`, `closed_at`, `outcome` (`confirmed_fraud` / `cleared`), `pattern`, `first_fraud_txn_id`, `txn_ids` (pipe-separated), `n_txns`, `exposure_usd`, `connected_card_ids`, `actions_taken`, `report_filed`, `analyst_notes`
- **Breakdown**:
  - `confirmed_fraud`: 4,665 cases
  - `cleared`: 900 cases (false alarms with `pattern = none`)
- **Distribution of Patterns in Closed History**:
  - `card_not_present_fraud`: 1,404
  - `account_takeover`: 1,205
  - `card_not_present_new_device`: 1,076
  - `out_of_region_use`: 955
  - `none`: 900
  - `card_testing`: 16
  - `undocumented`: 9

### `case_pack.csv` (20 cases: `HHG-001` to `HHG-020`)
- **Columns**: `case_id`, `opened_at`, `trigger_type` (`risk_score`, `customer_report`, `analyst_request`), `trigger_text`, `flagged_txn_id`, `card_id`, `customer_id`, `risk_score`

---

## 2. Fraud Typologies: Source of Truth

The 5 official bank patterns + 1 open category:
1. `card_testing`: 3+ tiny online authorizations (often <$5) followed by a larger purchase within an hour. Policy R5.
2. `card_not_present_fraud`: Online use without physical card; unusual amounts/products vs cardholder history; often burst of 2-4 within 48h. Policy R1-R4.
3. `card_not_present_new_device`: Pattern 2 combined with `id_15 == 'New'` device profile, sometimes behind proxy (`id_23`).
4. `out_of_region_use`: Card-present purchases in unfamiliar `addr1` region while normal activity continues at home (`addr2 == 87`).
5. `account_takeover`: Mixed-channel inconsistent activity with device/match-flag anomalies pointing to credential theft.
6. `undocumented`: Recurring coordinated abuse across customers not fitting 1-5 (e.g. shared device clusters across unrelated cards, velocity/amount ring dispersion). Policy R9.
7. `none`: Legitimate transactions / false alarms.

---

## 3. Fraud Policy & Governance Matrix

### Canonical Actions
- `ALLOW_TRANSACTION`: Let flagged authorization stand (Auto)
- `DECLINE_TRANSACTION`: Decline flagged authorization only (L1)
- `MONITOR_CARD`: Card active; raise monitoring sensitivity for 72h (Auto)
- `MONITOR_CONNECTED_CARDS`: Monitor cards linked by device/region/ring (Auto)
- `WARN_CUSTOMER`: Informational alert / recurring charge reminder (Auto)
- `VERIFY_WITH_CUSTOMER`: Inquire if cardholder made transaction (Auto)
- `STEP_UP_AUTH`: Require OTP or app confirmation (Auto)
- `BLOCK_CARD`: Block and reissue card (L1 if exposure <= $2,500; L2 if exposure > $2,500)
- `BLOCK_ALL_CARDS`: Block all cards customer holds (L2 always; requires R10: 2+ compromised cards or compromised credentials)
- `GENERATE_REPORT`: Internal investigation write-up without opening case (Auto)
- `CREATE_CASE`: Open internal fraud case and write to graph (Auto; probability >= 0.30, evidence requested, or dispute)
- `FILE_REPORT`: File SAR with regulator (L2 always; confirmed/suspected fraud AND exposure > $1,000 OR shared device/region/ring OR undocumented R9)
- `ESCALATE_TO_ANALYST`: Route case with evidence to human analyst (Auto; uncertain and exposure > $500, or conflicting evidence, or R9)
- `CLOSE_NO_FRAUD`: Close alert as legitimate (Auto)

### Decision & Approval Routing Rules
- **Rule R1**: Verify before blocking on weak/single signal if `fraud_probability < 0.70`. Must recommend `VERIFY_WITH_CUSTOMER` or `STEP_UP_AUTH`.
- **Rule R2**: Customer denies transaction -> Recommend `BLOCK_CARD` and `CREATE_CASE`. Add `FILE_REPORT` if exposure > $1,000 or connected to shared device/ring.
- **Rule R3**: Customer confirms transaction -> Recommend `CLOSE_NO_FRAUD`.
- **Rule R4**: Customer no-reply within 24h -> `MONITOR_CARD` + `DECLINE_TRANSACTION`. Escalate if exposure > $500.
- **Rule R5**: Card testing sequence -> `DECLINE_TRANSACTION` + `STEP_UP_AUTH`. If cleared txn > $100 -> `BLOCK_CARD`.
- **Rule R6**: Shared origin across multiple cards -> `CREATE_CASE` + `FILE_REPORT` + `MONITOR_CONNECTED_CARDS`.
- **Rule R7**: Disputed recurring charge matching customer history -> `CREATE_CASE` + `VERIFY_WITH_CUSTOMER` + `WARN_CUSTOMER`. Do not block.
- **Rule R8**: Uncertain verdict with exposure > $500 or conflicting evidence -> `ESCALATE_TO_ANALYST`.
- **Rule R9**: Undocumented pattern with coordinated abuse -> `CREATE_CASE` + `FILE_REPORT` + `ESCALATE_TO_ANALYST`. Describe in `pattern_description`.
- **Rule R10**: Never `BLOCK_ALL_CARDS` unless 2+ cards confirmed fraud or credentials compromised.

---

## 4. Benchmark Answer File Format Specification

Every case output must be saved to `outputs/<case_id>.json` (or `cases/<case_id>.json`) adhering to the exact schema:
```json
{
  "case_id": "HHG-001",
  "case": {
    "status": "open | closed_fraud | closed_legitimate | escalated",
    "verdict": "fraud | legitimate | uncertain",
    "fraud_probability": 0.85,
    "pattern": "card_testing | card_not_present_fraud | card_not_present_new_device | out_of_region_use | account_takeover | undocumented | none",
    "pattern_description": "",
    "affected_txn_ids": ["3514030"],
    "first_suspicious_txn_id": "3514030",
    "connected_card_ids": [],
    "connected_device_profiles": [],
    "exposure_usd": 77.07,
    "evidence": [
      {
        "claim": "string",
        "source": "graph | document | customer | external",
        "ref": "query:name | document:section | evidence_request:id",
        "entity_ids": ["3514030"]
      }
    ],
    "similar_prior_cases": ["CC-0141"],
    "summary": "Analyst summary...",
    "written_to_graph": true,
    "graph_case_id": "CASE-HHG-001"
  },
  "evidence_requests": [
    {
      "type": "customer_validation | step_up_auth | analyst_info",
      "asked_after_step": 3,
      "assumed_response": "Customer denied transaction"
    }
  ],
  "next_best_actions": {
    "initial": [
      { "action": "VERIFY_WITH_CUSTOMER", "route": "auto", "reason": "R1: ..." }
    ],
    "final": [
      { "action": "BLOCK_CARD", "route": "L1", "reason": "R2: ..." }
    ],
    "what_changed": "Explanation of recommendation shift"
  },
  "sar": {
    "file": true,
    "reason": "R2: ...",
    "narrative": "Complete FinCEN narrative...",
    "subjects": ["C12382", "C12382-K1"],
    "total_amount_usd": 77.07,
    "activity_dates": ["2016-12-05", "2016-12-05"]
  },
  "stop_reason": "Policy stopping rule met...",
  "tool_calls": 8,
  "tokens": 4200,
  "latency_s": 3.4
}
```

---

## 5. Additional Evidence & Simulation Mechanics
Per Section 5 & 3b of README:
- When initial signals are ambiguous (`fraud_probability < 0.70`), the agent requests evidence via `evidence_requests`.
- Responses are simulated with realistic scenarios:
  1. `customer_denied`: Customer denies transaction (triggers R2).
  2. `customer_confirmed`: Customer confirms transaction as legitimate (triggers R3 -> `CLOSE_NO_FRAUD`).
  3. `no_response_24h`: Timeout (triggers R4 -> `MONITOR_CARD` + `DECLINE_TRANSACTION`).
  4. `disputed_recurring`: Customer disputes a known recurring transaction (triggers R7).
  5. `step_up_success`: Cardholder passes biometrics/OTP.
  6. `step_up_failed`: Unauthorized party fails challenge.
- Pre-evidence recommendations (`initial`) and post-evidence recommendations (`final`) must be tracked distinctly in `next_best_actions`.
