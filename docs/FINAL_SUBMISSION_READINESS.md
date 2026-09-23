# TRACE//GOA — Final Submission Readiness

> This document summarizes whether TRACE//GOA is ready to be submitted.
> All claims are verified by runnable scripts in this repository.

---

## Verdict: ✅ READY TO SUBMIT

All required deliverables are present, verified, and reproducible.

---

## Submission Checklist

| Category | Item | Status |
|---|---|---|
| **Dataset** | IEEE-CIS HHGOA dataset loaded | ✅ 590,742 transactions |
| **Dataset** | 5,565 historical cases present | ✅ Used as agent memory |
| **Dataset** | 20 benchmark cases present | ✅ HHG-001 to HHG-020 |
| **Output** | 20 competition answer files | ✅ `cases/HHG-*.json` |
| **Output** | Schema validation 20/20 | ✅ `python scripts/validate_outputs.py` |
| **Output** | No label leakage | ✅ `pytest tests/unit/test_no_leakage.py` |
| **Analysis** | Historical backtest | ✅ 87.24% accuracy on 1,113 held-out cases |
| **Analysis** | Confidence calibration | ✅ `scripts/analysis/calibrate_confidence.py` |
| **Analysis** | Undocumented patterns | ✅ 2 discovered (proxy ring + structuring burst) |
| **Graph** | TigerGraph GSQL schema | ✅ 11 vertex types, 14 edge types |
| **Graph** | GSQL queries | ✅ 7 queries installed |
| **Graph** | MCP server integration | ✅ Official TigerGraph MCP server wired |
| **Agent** | PolicyEngine R1–R10 | ✅ Deterministic, LLM cannot bypass |
| **Agent** | Evidence request lifecycle | ✅ Pre- and post-evidence NBA per case |
| **Agent** | NBA flip demonstrated | ✅ HHG-001, HHG-005, HHG-012 |
| **Agent** | Audit ledger | ✅ SHA-256 hash-chained |
| **Backend** | FastAPI starts | ✅ 200 OK on `/health` |
| **Backend** | Case write-back | ✅ Cases written to graph after investigation |
| **Frontend** | Production build | ✅ 0 TypeScript errors, 0 Vite errors |
| **Frontend** | 8 views functional | ✅ All views verified |
| **Frontend** | Live diagnostics | ✅ Header shows backend status |
| **Tests** | Full suite | ✅ 38 passed |
| **Docs** | README as demo guide | ✅ `README.md` |
| **Docs** | Technical blog | ✅ `docs/BLOG.md` |
| **Docs** | Judge demo script | ✅ `docs/DEMO_SCRIPT.md` |
| **Docs** | Verified results | ✅ `docs/FINAL_RESULTS.md` |
| **Docs** | Honest status | ✅ `docs/STATUS.md` |
| **Docs** | Screenshots (8 views) | ✅ `docs/assets/screenshots/` |
| **Legal** | License file | ✅ MIT `LICENSE` |

---

## Reproduction Commands (Clean Machine)

```bash
# 1. Clone
git clone https://github.com/maitray-agrawal/TRACE-GOA && cd TRACE-GOA

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Place dataset in data/competition/ and verify
python scripts/verify_data.py

# 5. Extract transaction neighborhoods for 20 benchmark cases
python scripts/benchmark/extract_benchmark_neighborhoods.py

# 6. Run 20 competition benchmark cases
python scripts/benchmark/run_competition_benchmark.py

# 7. Validate all 20 output files against competition schema
python scripts/validate_outputs.py

# 8. Run full test suite
pytest -q

# 9. Run historical backtest
python scripts/analysis/backtest.py

# 10. Train calibration model
python scripts/analysis/calibrate_confidence.py

# 11. Start backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# 12. Start frontend (new terminal)
cd frontend && npm run dev
# → http://localhost:5173
```

---

## Scoring Alignment

| Judging Criterion | Weight | Implementation |
|---|---|---|
| Investigation accuracy | 25% | 87.24% backtest + per-pattern precision/recall |
| Next-best action | 25% | Policy R1–R10 + pre/post-evidence NBA + 3 demonstrated flips |
| Agentic design/engineering | 15% | FSM with evidence loop + 7 MCP tool calls per case + policy gating |
| Innovation | 15% | 2 undocumented patterns discovered + GraphRAG on 590k-row real dataset |
| Case summary/explainability | 10% | `reasoning`, `what_changed`, `pattern_description` per case JSON |
| Demo | 10% | 8-view UI + 4-minute demo script + reproducible in one session |
