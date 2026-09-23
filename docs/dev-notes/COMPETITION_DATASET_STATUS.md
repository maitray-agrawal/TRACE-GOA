# TRACE//GOA — Competition Dataset Reality & Forensics Audit

## 1. Executive Status

```text
REAL COMPETITION DATASET FOUND: NO
DATASET LOCATION: NOT FOUND (Workspace searched: D:\HHGOA and root drive)
README FOUND: NO (Challenge README not present in repository)
TRANSACTION ROW COUNT: 243 (Synthetic Development Fixture)
CUSTOMER COUNT: 100 (Synthetic Development Fixture)
DEVICE/IDENTITY RECORD COUNT: 150 (Synthetic Development Fixture)
CASE COUNT: 30 (Synthetic Development Fixture)
POLICY FILE: backend/app/policy/engine.py & backend/app/graphrag/synthesizer.py (Embedded Knowledge Base)
FRAUD PATTERN FILE: backend/app/patterns/engine.py (Deterministic Typology Engine)
REGULATORY FILE: backend/app/actions/sar.py & backend/app/graphrag/synthesizer.py (FinCEN BSA Rules)
BENCHMARK CASES: 20 Cases (Generated Development Benchmark)
```

---

## 2. Classification

```text
CURRENT SYSTEM DATA: SYNTHETIC DEVELOPMENT DATA
```

> **Official Declaration:**
> Synthetic development data is used locally because the competition dataset (approx. 590,000 IEEE-CIS transactions, 13,500 customers, and associated challenge identity files) is not currently present in this execution environment.
>
> The current dataset in `data/raw/` and `data/processed/` was generated via `scripts/ingest/generate_seed_dataset.py` as a high-fidelity development fixture to validate schema correctness, graph topologies, and GSQL loading syntax.

---

## 3. Detailed Data Inventory

| Asset Name | Current File Location | Type / Format | Count | Status | Notes |
|------------|-----------------------|---------------|-------|--------|-------|
| **Competition IEEE-CIS Transactions** | N/A | CSV / Parquet | 0 | **MISSING** | Expected ~590,000 rows (`train_transaction.csv`). Not found in environment. |
| **Competition IEEE-CIS Identity** | N/A | CSV / Parquet | 0 | **MISSING** | Expected ~140,000 device/IP linkage rows (`train_identity.csv`). |
| **Challenge README** | N/A | Markdown / PDF | 0 | **MISSING** | Official dataset documentation not present locally. |
| **Development Customers** | `data/raw/customers.csv` | CSV | 100 | **SYNTHETIC** | Normalized KYC entities (`CUST_0001` - `CUST_0100`). |
| **Development Devices** | `data/raw/devices.csv` | CSV | 150 | **SYNTHETIC** | Emulator flags, device fingerprints, hardware trust scores. |
| **Development Transactions** | `data/raw/transactions.csv` | CSV | 243 | **SYNTHETIC** | Sliding-window amounts, timestamps, billing coordinates. |
| **Development Cases** | `data/raw/cases.csv` | CSV | 30 | **SYNTHETIC** | Labeled outcomes, risk scores, patterns. |
| **Development Benchmark Suite** | `outputs/case_01` to `case_20` | JSON / CSV / MD | 20 | **SYNTHETIC** | Automated evaluation suite for the 17-state finite state machine. |

---

## 4. Ingestion Pipeline Readiness for Real Competition Data

While the raw competition data is absent, the ingestion architecture is ready for ingestion:
1. **Schema Mapping**: `tigergraph/schema/schema.gsql` declares native vertex types (`Customer`, `Account`, `Transaction`, `Device`, `IP`, `Merchant`, `Case`, `FraudPattern`).
2. **GSQL Loading Job**: `tigergraph/loading/load_data.gsql` maps columnar CSV data into graph vertices and directed edges.
3. **Reproducibility**: When `train_transaction.csv` and `train_identity.csv` are placed into `data/competition/`, the pipeline will execute:
   ```bash
   python scripts/ingest/ingest_competition_data.py --input-dir data/competition/
   ```
   without requiring architectural modification.
