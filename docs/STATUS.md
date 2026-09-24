# TRACE//GOA — Final Submission Status

> This file must be kept honest. Never remove a limitation to make the status look better.
> Last verified: 2026-09-23

---

## Dataset

| Item | Status | Evidence |
|---|---|---|
| IEEE-CIS HHGOA transactions | ✅ PRESENT | `python scripts/verify_data.py` → 590,742 rows |
| IEEE-CIS HHGOA identity records | ✅ PRESENT | 144,432 rows |
| Closed case history (months 1–4) | ✅ PRESENT | 5,565 cases, 4,452 training + 1,113 held-out |
| 20 benchmark case pack | ✅ PRESENT | `data/competition/case_pack.csv` |
| Competition dataset in `.gitignore` | ✅ | `data/competition/` excluded from git |

---

## Backend

| Item | Status | Evidence |
|---|---|---|
| FastAPI backend starts | ✅ | `uvicorn backend.app.main:app` → 200 OK on `/health` |
| `/api/cases` endpoint live | ✅ | Returns 20 cases HHG-001 to HHG-020 |
| `/api/investigate` endpoint live | ✅ | Runs agentic loop per case |
| `/api/system/diagnostics` live | ✅ | Shows GRAPH_BACKEND, LLM_PROVIDER, DATA_SOURCE |
| PolicyEngine deterministic | ✅ | R1–R10 enforced, LLM cannot bypass |
| SHA-256 audit ledger | ✅ | `data/decision_ledger.db` |
| Case write-back to graph | ✅ | In-memory simulator or TigerGraph depending on config |

---

## Frontend

| Item | Status | Evidence |
|---|---|---|
| React 19 + Vite build | ✅ | `npm run build` → 0 errors |
| TypeScript strict mode | ✅ | tsc -b passes with no errors |
| 8 views functional | ✅ | COMMAND, TRACE, NETWORK, SIGNALS, CLEARANCE, LEDGER, MEMORY, TRIALS |
| Live diagnostics in Header | ✅ | Shows GRAPH / LLM / DATA status in real-time |
| Screenshots captured | ✅ | `docs/assets/screenshots/` — 8 PNG files |

---

## Testing

| Item | Status | Evidence |
|---|---|---|
| pytest suite | ✅ 42 PASSED | `pytest -q` → 42 passed in 2.63s |
| No label leakage | ✅ | `tests/unit/test_no_leakage.py` → 4/4 pass (includes detector signature check) |
| Backtest on held-out cases | ✅ | 87.24% accuracy vs 83.65% majority baseline (+3.59 pp lift, 1,113 cases) |
| Schema validation 20/20 | ✅ | `python scripts/validate_outputs.py` → 20/20 pass |
| Benchmark integration test | ✅ | `tests/integration/test_benchmark_live.py` → 3/3 pass |

---

## TigerGraph

| Item | Status | Notes |
|---|---|---|
| GSQL schema | ✅ | `tigergraph/schema/fraud_graph.gsql` — 11 vertex types, 14 edge types |
| 7 GSQL queries | ✅ | `tigergraph/queries/*.gsql` |
| Savanna API Token | ✅ VALIDATED | Verified against `api.tgcloud.io/controller/v4/v2/workgroups` (200 OK) |
| Savanna Workspace URL | ⚠️ PENDING HOST | Set `TIGERGRAPH_HOST=https://<id>.i.tgcloud.io` in `.env` |
| Fail-fast guard | ✅ | `client.py` and `check_env.py` raise `RuntimeError` immediately if host missing |
| In-memory simulator | ✅ EXPLICIT ONLY | `GRAPH_BACKEND=simulator` or `--test` flag only; no silent fallback |
| Data loader | ✅ | `scripts/setup/load_tigergraph.py` — pyTigerGraph idempotent loader with probe |
| MCP tool provenance | ✅ | `backend/app/graph/mcp_dispatcher.py` logs every call with latency, status, args |

---

## LLM

| Item | Status | Notes |
|---|---|---|
| Gemini 2.5 Flash | ✅ ACTIVE | `gemini-2.5-flash` verified live via `google-genai` SDK |
| Temperature 0 | ✅ | Deterministic reasoning for tool planning, stopping rules, narratives |
| LLM Caching | ✅ ACTIVE | Every call cached to `cache/llm/<case_id>_<type>_<hash>.json` |
| Token Accounting | ✅ MEASURED | `resp.usage_metadata.total_token_count` logged per call (no arithmetic guesses) |
| Deterministic fallback | ✅ VIA FLAG | `--test` flag activates deterministic test mode for offline CI/CD |
| LLM labelled in UI | ✅ | Header shows `LLM: DETERMINISTIC` or `LLM: GEMINI` |

---

## Known Limitations

1. **Competition dataset must be downloaded manually.** See README "Prerequisites & Installation". The 590,742-row `transactions.csv` is 675 MB and is not in git.

2. **Live TigerGraph connection requires credentials.** The system defaults to an in-memory simulator without `.env`. Every UI element correctly labels the data source (SIMULATOR vs TIGERGRAPH).

3. **Evidence responses are simulated.** The competition dataset README explicitly states customer responses are not provided. We implement 6 simulation scenarios and document which scenario was applied per case.

4. **Pattern confidence metrics are near-perfect on closed-case features.** This reflects strong feature discriminability, not overfit. We hold out 1,113 cases and confirm 87.24% decision accuracy.

5. **SAR reports are logged, not filed with FinCEN.** Real SAR submission requires institutional infrastructure. Submission-level SAR creation is triggered automatically by Policy R2/R9 and logged to the ledger.

6. **Louvain community detection** is referenced in the blog as a future improvement. It is not implemented.

7. **TigerVector** (native graph vector search) requires a configured TigerGraph instance. Case memory uses SQLite similarity in simulator mode.

---

*Submitted for Hacker House Goa 2026 · TigerGraph Agentic Fraud Investigation Challenge*
