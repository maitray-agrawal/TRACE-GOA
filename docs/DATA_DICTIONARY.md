# HHGOA Data Dictionary: IEEE-CIS Fraud Investigation Domain

This document specifies the exact fields, data types, semantic definitions, constraints, and TigerGraph graph vertex/edge mappings used in the **HHGOA Fraud Investigation & Next-Best Action System**.

---

## 1. Primary Entity Schemas

### 1.1 Transaction Entity (`Transaction`)
Corresponds to individual transaction events in the IEEE-CIS dataset.

| Field Name | Type | Description | IEEE Mapping / Source | TigerGraph Property |
| :--- | :--- | :--- | :--- | :--- |
| `transaction_id` | String (PK) | Unique transaction identifier | `TransactionID` | Vertex ID (STRING) |
| `timestamp` | Integer | Seconds elapsed from reference epoch | `TransactionDT` | `UINT timestamp` |
| `amount` | Float | Transaction amount in USD | `TransactionAmt` | `DOUBLE amount` |
| `product_code` | String | Product category code (W, C, R, H, S) | `ProductCD` | `STRING product_code` |
| `card_id` | String (FK) | Composite card fingerprint | Hash(`card1`..`card6`) | Edge -> `Card` |
| `customer_id` | String (FK) | Inferred customer account ID | Customer grouping | Edge -> `Customer` |
| `card_type` | String | Card network (visa, mastercard, discover, amex) | `card4` | `STRING card_type` |
| `card_category` | String | Card category (credit, debit, charge) | `card6` | `STRING card_category` |
| `billing_region` | String | Billing state/province code | `addr1` | `STRING billing_region` |
| `billing_country` | String | Billing country numeric code | `addr2` | `STRING billing_country` |
| `dist1` | Float | Distance between billing & transaction IP/device | `dist1` | `DOUBLE dist1` |
| `dist2` | Float | Distance between billing & shipping address | `dist2` | `DOUBLE dist2` |
| `payer_email_domain` | String | Purchaser email domain (e.g. gmail.com) | `P_emaildomain` | Edge -> `Email` |
| `recipient_email_domain` | String | Recipient email domain (e.g. protonmail.com) | `R_emaildomain` | Edge -> `Email` |
| `risk_score` | Float | Pre-computed baseline transaction risk [0.0 - 1.0] | Model baseline score | `DOUBLE risk_score` |
| `device_id` | String (FK) | Fingerprinted device identifier | `DeviceInfo` + `id_30`-`id_33` | Edge -> `Device` |
| `ip_address` | String (FK) | Originating IPv4 or IPv6 subnet | `id_30` / Network IP | Edge -> `IP` |
| `merchant_id` | String (FK) | Aggregated merchant terminal identifier | Derived from `ProductCD` + `dist` | Edge -> `Merchant` |

---

### 1.2 Customer / Account Entity (`Customer`, `Account`)
Represents nominal identity holders and financial accounts.

| Field Name | Type | Description | Source | TigerGraph Property |
| :--- | :--- | :--- | :--- | :--- |
| `customer_id` | String (PK) | Unique customer identifier | Aggregated IEEE identities | Vertex ID (STRING) |
| `first_name` | String | Synthetic masked name for analyst view | Identity synthesis | `STRING first_name` |
| `last_name` | String | Synthetic masked surname for analyst view | Identity synthesis | `STRING last_name` |
| `primary_email` | String | Verified registered email address | Domain + Account mapping | Edge -> `Email` |
| `phone_number` | String | Masked registered phone number | Identity synthesis | `STRING phone_number` |
| `account_created_at` | Integer | Epoch timestamp of account opening | Synthesized temporal history | `UINT created_at` |
| `account_status` | String | Status: `ACTIVE`, `SUSPENDED`, `LOCKED` | Application state | `STRING status` |
| `risk_tier` | String | Baseline customer risk: `LOW`, `MEDIUM`, `HIGH` | Graph history | `STRING risk_tier` |

---

### 1.3 Device Entity (`Device`)
Represents user agent, mobile, or desktop hardware signatures.

| Field Name | Type | Description | IEEE Mapping | TigerGraph Property |
| :--- | :--- | :--- | :--- | :--- |
| `device_id` | String (PK) | Composite device fingerprint hash | Hash(`DeviceInfo`, `DeviceType`, `id_30`..`id_33`) | Vertex ID (STRING) |
| `device_type` | String | Category: `mobile`, `desktop`, `tablet`, `emulator` | `DeviceType` | `STRING device_type` |
| `os_name` | String | Operating system: `iOS`, `Android`, `Windows`, `Linux` | `id_30` | `STRING os_name` |
| `browser_name` | String | Browser engine: `Chrome`, `Safari`, `Firefox`, `Headless`| `id_31` | `STRING browser_name` |
| `screen_resolution` | String | Resolution: e.g. `1920x1080`, `2560x1440` | `id_33` | `STRING screen_resolution` |
| `is_emulator` | Boolean | True if user agent exhibits bot/emulator headers | `DeviceInfo` heuristic | `BOOL is_emulator` |

---

### 1.4 IP Entity (`IP`)
Represents transaction origin network endpoints and routing infrastructure.

| Field Name | Type | Description | IEEE Mapping | TigerGraph Property |
| :--- | :--- | :--- | :--- | :--- |
| `ip_address` | String (PK) | Normalized IP address (or /24 subnet block) | `id_30`/Subnet | Vertex ID (STRING) |
| `ip_type` | String | Connection classification: `RESIDENTIAL`, `DATACENTER`, `VPN`, `TOR` | Proxy heuristics | `STRING ip_type` |
| `isp` | String | Internet Service Provider name | Geographic resolution | `STRING isp` |
| `country_code` | String | ISO country code | GeoIP mapping | `STRING country_code` |
| `reputation_score`| Float | Third-party reputation score [0.0 - 1.0] | IP Threat Intel | `DOUBLE reputation` |

---

### 1.5 Card Entity (`Card`)
Represents financial payment instruments.

| Field Name | Type | Description | IEEE Mapping | TigerGraph Property |
| :--- | :--- | :--- | :--- | :--- |
| `card_id` | String (PK) | Card fingerprint token (e.g. `CARD_4111_XXXX`) | Hash(`card1`, `card2`, `card3`, `card5`) | Vertex ID (STRING) |
| `bin_number` | String | Bank Identification Number (first 6 digits) | `card1` | `STRING bin_number` |
| `issuer_bank` | String | Card issuing bank identifier | `card2` | `STRING issuer_bank` |
| `brand` | String | Brand: `VISA`, `MASTERCARD`, `AMEX`, `DISCOVER` | `card4` | `STRING brand` |
| `category` | String | Category: `DEBIT`, `CREDIT`, `PREPAID`, `BUSINESS` | `card6` | `STRING category` |

---

### 1.6 Case & Investigation Entities (`Case`, `Evidence`, `DecisionLedger`)
Managed inside relational/application state and synchronized to TigerGraph for topological case memory.

| Entity | Primary Fields | Lifecycle States / Types |
| :--- | :--- | :--- |
| `Case` | `case_id`, `trigger_id`, `subject_id`, `risk_score`, `confidence`, `status`, `created_at`, `closed_at`, `final_disposition` | `NEW`, `INVESTIGATING`, `AWAITING_EVIDENCE`, `REASSESSMENT`, `ACTION_PENDING`, `AWAITING_APPROVAL`, `ACTION_EXECUTED`, `ESCALATED`, `RESOLVED`, `CLOSED` |
| `Evidence` | `evidence_id`, `case_id`, `source`, `evidence_type`, `direction`, `payload`, `weight`, `recorded_at` | Directions: `SUPPORTING`, `CONTRADICTING`, `MISSING`. Sources: `GRAPH`, `POLICY`, `EXTERNAL_STEP_UP`, `TELEMETRY` |
| `Decision` | `decision_id`, `case_id`, `action`, `priority`, `confidence`, `reason`, `policy_id`, `approval_level`, `execution_status` | Actions: 12 Next-Best Action types; Approval: `NONE`, `ANALYST`, `SENIOR_ANALYST`, `FRAUD_MANAGER` |
| `LedgerEntry` | `entry_id`, `case_id`, `timestamp`, `actor`, `event_type`, `payload`, `previous_hash`, `current_hash` | Cryptographic SHA-256 block chain |

---

## 2. TigerGraph Graph Schema Mappings

```gsql
CREATE VERTEX Customer(PRIMARY_ID id STRING, first_name STRING, last_name STRING, phone STRING, risk_tier STRING, created_at UINT)
CREATE VERTEX Account(PRIMARY_ID id STRING, account_type STRING, status STRING, balance DOUBLE)
CREATE VERTEX Transaction(PRIMARY_ID id STRING, amount DOUBLE, timestamp UINT, product_code STRING, risk_score DOUBLE)
CREATE VERTEX Card(PRIMARY_ID id STRING, bin STRING, issuer STRING, brand STRING, category STRING)
CREATE VERTEX Device(PRIMARY_ID id STRING, device_type STRING, os_name STRING, browser_name STRING, is_emulator BOOL)
CREATE VERTEX IP(PRIMARY_ID id STRING, ip_type STRING, country_code STRING, reputation DOUBLE)
CREATE VERTEX Email(PRIMARY_ID id STRING, domain STRING, is_disposable BOOL)
CREATE VERTEX Address(PRIMARY_ID id STRING, region STRING, country STRING)
CREATE VERTEX Merchant(PRIMARY_ID id STRING, category STRING, risk_level STRING)
CREATE VERTEX Case(PRIMARY_ID id STRING, trigger_type STRING, risk_score DOUBLE, status STRING, final_outcome STRING)
CREATE VERTEX FraudPattern(PRIMARY_ID id STRING, name STRING, severity STRING)

CREATE DIRECTED EDGE OWNS(FROM Customer, TO Account)
CREATE DIRECTED EDGE PERFORMS_TRANSACTION(FROM Account, TO Transaction, timestamp UINT)
CREATE DIRECTED EDGE USES_CARD(FROM Transaction, TO Card)
CREATE DIRECTED EDGE USES_DEVICE(FROM Transaction, TO Device)
CREATE DIRECTED EDGE ORIGINATES_FROM_IP(FROM Transaction, TO IP)
CREATE DIRECTED EDGE ASSOCIATED_EMAIL(FROM Transaction, TO Email)
CREATE DIRECTED EDGE SHIPPED_TO_ADDRESS(FROM Transaction, TO Address)
CREATE DIRECTED EDGE INVOLVES_MERCHANT(FROM Transaction, TO Merchant)
CREATE DIRECTED EDGE FLAGGED_IN_CASE(FROM Transaction, TO Case)
CREATE DIRECTED EDGE IDENTIFIED_PATTERN(FROM Case, TO FraudPattern, confidence DOUBLE)
```

---

## 3. Raw Disk File Manifest (`data/raw/`)

The ingestion pipeline produces normalized CSV files that directly map to TigerGraph's GSQL loading job `load_fraud_data` in `tigergraph/loading/load_data.gsql`:

| File Name | Row Count | Column Count | Disk Size | Null Rate | Target Vertices / Edges Loaded |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `customers.csv` | 100 rows | 10 columns | ~9.3 KB | 0.0% | `Customer`, `Account`, `OWNS` |
| `devices.csv` | 150 rows | 6 columns | ~8.7 KB | 0.0% | `Device` |
| `transactions.csv` | 243 rows | 31 columns | ~56.2 KB | 0.0% | `Transaction`, `Card`, `IP`, `Email`, `Address`, `Merchant`, `PERFORMS_TRANSACTION`, `USES_CARD`, `USES_DEVICE`, `ORIGINATES_FROM_IP`, `ASSOCIATED_EMAIL`, `SHIPPED_TO_ADDRESS`, `INVOLVES_MERCHANT` |
| `cases.csv` | 30 rows | 12 columns | ~4.1 KB | 0.0% | `Case`, `FLAGGED_IN_CASE`, `INVOLVES_ENTITY`, `IDENTIFIED_PATTERN` |

---

## 4. Data Integrity & Masking Policies
- All raw credit card primary account numbers (PAN) are tokenized before entering the graph.
- Emails and phone numbers are normalized, hashed for entity resolution, and masked for analyst display (e.g., `j****@domain.com`, `+1 (555) ***-9281`).
- Missing numerical fields in IEEE-CIS (e.g. `dist1`, `dist2`) are populated with sentinel `-1.0` or null and explicitly recognized by GraphRAG as missing evidence.

