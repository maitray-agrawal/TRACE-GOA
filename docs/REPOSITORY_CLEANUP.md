# TRACE//GOA — Repository Restructuring & Hygiene Report

**Date**: 2026-09-24  
**Auditor**: Release Engineering Team  
**Scope**: Codebase hygiene, secret scanning, repository footprint, and file organization.

---

## 1. Objectives

1. **Eliminate Confusing Duplication**: Ensure there is exactly **one** canonical location for benchmark case outputs (`outputs/cases/HHG-*.json`).
2. **Isolate Development Fixtures**: Separate early synthetic development fixtures from competition evaluation data.
3. **Repository Footprint Discipline**: Ensure git repository size is strictly under 100 MB by ignoring multi-hundred-megabyte raw transaction CSVs while keeping necessary subgraph JSONs committed for instant offline execution.
4. **Secret Sanitization**: Zero API keys, passwords, or cloud tokens committed in code or git history.

---

## 2. Directory Reorganization Log

### A. Root Directory Cleanup
The repository root was cleared of non-standard directories. Only required top-level folders remain:

```text
TRACE-GOA/
├── backend/          # FastAPI backend, agent pipeline, graph client, policy engine
├── frontend/         # React 19 + TypeScript + Vite Goa poster UI
├── tigergraph/       # TigerGraph GSQL schemas, loading jobs, and queries
├── scripts/          # Ingestion, benchmark runners, evaluation scripts
├── tests/            # Pytest test suite (unit and integration)
├── outputs/          # Canonical benchmark outputs and run metadata
├── docs/             # Technical architecture, threat model, demo scripts, audits
├── data/             # Competition subgraph dataset and data dictionary
├── dev_fixtures/     # Isolated development fixtures and legacy synthetic runs
└── cache/            # LLM response cache for offline deterministic reproducibility
```

### B. Relocated & Consolidated Files

| Original Location | New Location | Rationale |
| :--- | :--- | :--- |
| `cases/HHG-*.json` | *Removed* | Duplicate of `outputs/cases/HHG-*.json`. Consolidated to single source of truth. |
| `outputs/case_01/` … `outputs/case_20/` | `dev_fixtures/legacy_runs/` | Legacy runs from initial single-case synthetic iterations. Kept for auditability without confusing benchmark judges. |
| `data/raw/*.csv` (synthetic) | `dev_fixtures/raw/` | 100-customer / 243-txn synthetic seed data moved to fixtures so judges are not misled into thinking it is the competition dataset. |
| `data/processed/*.json` (synthetic) | `dev_fixtures/processed/` | Synthetic benchmark and historical case JSON fixtures moved alongside raw fixtures. |
| `docs/BACKEND_AUTHENTICITY_AUDIT.md` | `docs/dev-notes/` | Internal working draft moved to dev-notes to preserve clean top-level documentation. |
| `docs/COMPETITION_DATASET_STATUS.md` | `docs/dev-notes/` | Internal transition memo moved to dev-notes. |
| `docs/DATASET_REALISM_AUDIT.md` | `docs/dev-notes/` | Internal transition memo moved to dev-notes. |

### C. Created Disclaimer Files
- `dev_fixtures/README.md`: Explicitly documents that files inside `dev_fixtures/` are development fixtures used for unit testing schema topologies, and not the competition evaluation benchmark.
- `outputs/INDEX.md`: Maps every benchmark artifact and output file with its MD5 hash, size, and purpose.

---

## 3. Git Footprint & Secret Scanning

### A. Secret Scan Results
A multi-pattern regex scan was performed across all tracked files, untracked files, and historical git commits for known secret prefixes:
- Google Gemini API Keys (`AIza[0-9A-Za-z-_]{35}`, `AQ.[0-9A-Za-z-_]{40,}`)
- TigerGraph Savanna API Keys (`Ss7beSjZc[0-9A-Za-z-_]{20,}`)
- GitHub Personal Access Tokens (`ghp_[0-9A-Za-z]{36}`)
- Private Keys (`-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----`)

**Result**: **0 leaks found.** All sensitive values are loaded via environment variables (`.env`) and `.env.example` contains sanitized placeholders.

### B. Repository Size Verification
```powershell
git count-objects -vH
# size-pack: 66.11 MiB
```
The repository size is **66.11 MiB**, well below the 100 MiB limit. Large raw CSV files (`transactions.csv`, `identity.csv`) are ignored in `.gitignore`. The lightweight `data/competition/benchmark_subgraphs.json` (14.23 MB) is committed, enabling 100% offline reproducible evaluations without multi-gigabyte downloads.

---

## 4. Verification Commands

Judges can verify the clean structure with:
```powershell
# Verify test suite
pytest -q

# Verify 20 canonical outputs
python scripts/validate_outputs.py

# Verify frontend build
cd frontend ; npm run lint ; npm run build
```
