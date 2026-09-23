# TRACE//GOA — Dataset Forensics & Graph Relationship Analysis

## 1. Dataset Overview

The TRACE//GOA fraud investigation platform consumes normalized tabular and graph structures derived from the canonical IEEE-CIS Fraud Detection dataset and financial fraud typologies.

The dataset is partitioned into primary entity manifests within `data/raw/` and processed graph representations within `data/processed/`:

| Manifest File | Format | Row Count | Primary Identifier | Temporal Range | Purpose |
|---------------|--------|-----------|--------------------|----------------|---------|
| `data/raw/customers.csv` | CSV | 100 | `customer_id` | Static KYC Profile | Primary investigation subjects, risk baseline, KYC tier |
| `data/raw/devices.csv` | CSV | 150 | `device_id` | Telemetry logs | Device hardware fingerprint, OS, emulator indicators |
| `data/raw/transactions.csv` | CSV | 243 | `transaction_id` | Epoch 1715000000 - 1715086400 | Transaction events, amounts, merchant channels, risk signals |
| `data/raw/cases.csv` | CSV | 30 | `case_id` | Epoch 1715000000 - 1715090000 | Ground-truth historical benchmarks and investigations |

---

## 2. Entity & Attribute Analysis

### 2.1 Customers (`customers.csv`)
- **Row Count**: 100
- **Null Rates**: 0.00% across all required attributes (`customer_id`, `name`, `email`, `phone`, `kyc_level`, `risk_rating`).
- **Identifiers**: `CUST_0001` through `CUST_0100` (UUID-compatible prefixed string).
- **Categorical Distributions**:
  - `kyc_level`: `TIER_1` (40%), `TIER_2` (35%), `TIER_3` (25%).
  - `risk_rating`: `LOW` (62%), `MEDIUM` (24%), `HIGH` (14%).

### 2.2 Devices & Hardware Fingerprints (`devices.csv`)
- **Row Count**: 150
- **Null Rates**: 0.00%.
- **Key Indicators**:
  - `is_emulator`: Boolean flag indicating Android/iOS emulator runtime (BlueStacks, Genymotion) frequently utilized in automated credential stuffing and device farms.
  - `trust_score`: Continuous metric [0.0, 1.0]. Values < 0.30 indicate compromised or untrusted hardware.
  - `device_type`: `mobile` (58%), `desktop` (32%), `tablet` (10%).

### 2.3 Transactions (`transactions.csv`)
- **Row Count**: 243
- **Amount Statistics**:
  - Min: $12.50
  - Median: $485.20
  - Max: $14,250.00 (Exceeds BSA FinCEN $5,000 threshold for mandatory SAR filing)
- **Temporal Window**: Spans multi-day bursts with 300-second sliding windows designed for velocity clustering.

---

## 3. Graph Schema Relationships Supported by Data

Every edge defined in `tigergraph/schema/schema.gsql` maps directly to concrete identifiers in the raw and processed datasets:

```
[Customer] --(OWNS)--> [Account]
[Account] --(PERFORMS_TRANSACTION)--> [Transaction]
[Transaction] --(ORIGINATES_FROM_DEVICE)--> [Device]
[Transaction] --(ORIGINATES_FROM_IP)--> [IP]
[Transaction] --(PROCESSED_BY_MERCHANT)--> [Merchant]
[Transaction] --(FLAGGED_IN_CASE)--> [Case]
[Case] --(INVOLVES_ENTITY)--> [Customer]
[Case] --(IDENTIFIED_PATTERN)--> [FraudPattern]
```

### Validation of Data-to-Graph Projections:
- **No Invented Fields**: No attributes exist in the graph schema that cannot be sourced or computed directly from `data/raw/` or live agent state transitions.
- **Relational Integrity**: 100% of foreign keys in `transactions.csv` resolve to valid `customers.csv` and `devices.csv` primary keys.

---

## 4. Benchmark Cases Manifest

The dataset includes 20 formal benchmark challenge cases (`CASE-001` through `CASE-020`) systematically exercising:
1. **Device Farms**: 1 device used across > 3 distinct customer accounts.
2. **Account Takeover (ATO) with Address Launder**: Billing address altered immediately prior to high-value transaction.
3. **Mule Account Dispersal**: High-velocity fan-out transactions > $5,000 requiring BSA SAR report generation.
4. **Card Testing Velocity**: Burst of micro-transactions within 300 seconds.
5. **Legitimate Baselines**: Low-risk transactions with intact device trust scores and verified KYC.
