# TRACE//GOA — Judge Demo Script
## 3–5 Minute Walkthrough

---

### Before You Start

Ensure the following are running:

```bash
# Terminal 1 — Backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
# → http://localhost:5173
```

Also verify the dataset and benchmark outputs are present:

```bash
python scripts/verify_data.py
# Expected: 590,742 transactions | 13,553 customers | 5,565 closed cases | 20 benchmark cases
```

---

## Minute 0:30 — Open with the dataset

**Say:** "TRACE//GOA runs on the real IEEE-CIS HHGOA competition dataset — 590,742 real card transactions from July to December 2016. The fraud flag is removed; we only have a bank risk score as a starting signal."

**Show in terminal:**
```
python scripts/verify_data.py
```
**Point out:** 590,742 transactions, 5,565 closed historical investigations — that is the agent's memory.

---

## Minute 1:00 — Run the 20 benchmark cases

**Say:** "The benchmark gives us 20 live alerts — HHG-001 through HHG-020 — from November and December 2016. Let's run the agent on all 20."

**Show in terminal:**
```
python scripts/benchmark/run_competition_benchmark.py
```
**Point out:** 13 fraud verdicts, 3 legitimate, 4 uncertain — the agent does not block everything. Half the false alarms are correctly allowed.

```
python scripts/validate_outputs.py
```
**Point out:** 20/20 schema-valid JSON files matching the exact competition answer format.

---

## Minute 2:00 — Evidence flip: HHG-012

**Say:** "HHG-012 is an out-of-region risk score alert, score 0.55. That is ambiguous. Watch what happens when the evidence comes in."

**Show the output file:**
```bash
python -m json.tool cases/HHG-012.json
```
**Walk through:**
- `next_best_actions.initial`: `MONITOR_CARD + VERIFY_WITH_CUSTOMER` — because probability 0.55 < 0.70 (Policy R1)
- `evidence_requests`: customer stated they never visited billing region 494.0
- `next_best_actions.final`: `BLOCK_CARD (L1) + CREATE_CASE` — customer denial triggered Policy R2
- `what_changed`: one sentence showing exactly what shifted the recommendation

**Key point:** "This is not a scripted flip. It is a policy-driven reaction to the assumed evidence response."

---

## Minute 3:00 — Undocumented pattern: HHG-014

**Say:** "HHG-014 was flagged by an analyst who noticed several cards showing purchases from the same unusual device profile. We didn't know what pattern to expect."

**Show:**
```bash
python -m json.tool cases/HHG-014.json
```
**Walk through:**
- `case.pattern`: `undocumented`
- `case.pattern_description`: cross-card proxy ring — Samsung SM-G935F behind anonymous proxy linked to 23+ cards
- `case.similar_prior_cases`: CC-2649, CC-2971 — historical precedents from months 1–4
- `next_best_actions.final`: `BLOCK_CARD + CREATE_CASE + FILE_REPORT (L2) + MONITOR_CONNECTED_CARDS` — Policy R9 triggered
- `case.written_to_graph`: true — this case is now in TigerGraph for future investigations

**Key point:** "This pattern is not hardcoded. It was discovered by reading the 9 `undocumented` closed cases in the historical data."

---

## Minute 4:00 — UI walkthrough (http://localhost:5173)

**Navigate:**
1. **COMMAND tab** — show the 20-case queue with real risk scores and trigger types
2. **Click HHG-014** → **TRACE tab** — show the investigation timeline and evidence list
3. **NETWORK tab** — show the graph entity view with connected cards highlighted
4. **CLEARANCE tab** — show BLOCK_CARD (L1) and FILE_REPORT (L2) with their approval routes
5. **LEDGER tab** — show the hash-chained audit entries proving tamper-evidence
6. **Header indicators** — point out `GRAPH: SIMULATOR | LLM: DETERMINISTIC | DATA: DEV_FIXTURE` (or `TIGERGRAPH | GEMINI | HHGOA` if live .env is configured)

---

## Closing Statement

"TRACE//GOA demonstrates four things the judging criteria ask for:

1. **Investigation accuracy** — 87.24% decision accuracy on 1,113 held-out historical cases, with precision/recall per pattern.
2. **Next-best action** — pre- and post-evidence recommendations in every output, with a clear explanation of what changed.
3. **Agentic design** — the stopping rule is evidence-driven, not scripted. Different cases produce different tool sequences. The agent correctly allows legitimate alerts.
4. **Innovation** — two undocumented fraud patterns discovered from the data itself, not from a hardcoded list."

---

*Full technical walkthrough in [docs/BLOG.md](BLOG.md).*
