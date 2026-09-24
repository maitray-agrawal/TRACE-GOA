# TRACE//GOA — Dataset Documentation & Setup Guide

This project evaluates agentic fraud investigations on the **Hacker House Goa 2026 IEEE-CIS Fraud Detection Benchmark** (published by Vesta Corporation & TigerGraph).

## Dataset Files

The competition dataset consists of 4 primary CSV files provided to Hacker House Goa participants:

| File | Description | Rows | Size |
|---|---|---|---|
| `transactions.csv` | Full transaction ledger with risk scores and timestamps | 590,742 | ~708 MB |
| `identity.csv` | Digital device & network identity attributes | 144,432 | ~26 MB |
| `closed_cases_history.csv` | Historical resolved cases (Months 1–4) for Case Memory | 5,565 | ~2.7 MB |
| `case_pack.csv` | 20 official benchmark test dockets (`HHG-001` – `HHG-020`) | 20 | ~3.5 KB |

## Where to Place Files

Place the raw competition files in the `data/competition/` folder:

```
data/
└── competition/
    ├── README.md                     (Competition guide & policy rules)
    ├── benchmark_subgraphs.json       (Pre-extracted neighborhoods for the 20 benchmark cases)
    ├── transactions.csv              (Large CSV - not tracked in git)
    ├── identity.csv                  (Large CSV - not tracked in git)
    ├── closed_cases_history.csv       (Closed cases - not tracked in git)
    └── case_pack.csv                 (20 exam cases - not tracked in git)
```

> [!NOTE]
> Due to GitHub file size limits (>100 MB), `transactions.csv` and `identity.csv` are excluded from version control via `.gitignore`.
> 
> However, **`data/competition/benchmark_subgraphs.json` is committed and included in the repository**, enabling instant, 100% reproducible execution of all 20 benchmark investigations and test suites out-of-the-box without downloading 750 MB of raw CSVs!

## Extracting Benchmark Subgraphs (Optional)

If you obtain the full raw CSVs and wish to re-generate the pre-extracted benchmark neighborhoods:

```powershell
python scripts/benchmark/extract_benchmark_neighborhoods.py
```
