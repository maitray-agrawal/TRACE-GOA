import os
import sys
import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.schemas.case import CaseRecord, CaseStatus, RecommendedAction, ActionType, ApprovalRole

def sync_competition_cases(db_path: str = None):
    if db_path is None:
        db_path = os.getenv("TRACE_CASES_DB", "data/cases.db")
    
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            case_id TEXT PRIMARY KEY,
            trigger_txn_id TEXT NOT NULL,
            subject_customer_id TEXT NOT NULL,
            status TEXT NOT NULL,
            risk_score REAL NOT NULL,
            confidence REAL NOT NULL,
            uncertainty_level TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        )
    """)

    # Purge synthetic and test records
    cursor.execute("DELETE FROM cases WHERE case_id LIKE 'TEST-%' OR case_id LIKE 'CASE-%'")
    conn.commit()

    # Load benchmark metadata for exact flagged_txn_id & customer_id
    subgraphs_file = BASE_DIR / "data" / "competition" / "benchmark_subgraphs.json"
    benchmark_meta = {}
    if subgraphs_file.exists():
        try:
            sub_d = json.loads(subgraphs_file.read_text(encoding="utf-8"))
            for c in sub_d.get("cases", []):
                benchmark_meta[c["case_id"]] = c
        except Exception:
            pass

    # Populate the 20 official competition HHG cases
    cases_dir = BASE_DIR / "cases"
    if not cases_dir.exists():
        cases_dir = BASE_DIR / "outputs" / "cases"

    for i in range(1, 21):
        cid = f"HHG-{i:03d}"
        f = cases_dir / f"{cid}.json"
        if not f.exists():
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        c_meta = d.get("case", {})
        actions = d.get("next_best_actions", {}).get("final", [])
        rec_actions = []
        for a in actions:
            act_str = a.get("action", "MONITOR_TRANSACTION")
            rec_actions.append(RecommendedAction(
                action=ActionType(act_str) if act_str in ActionType.__members__ else ActionType.MONITOR_TRANSACTION,
                priority="HIGH",
                confidence=float(c_meta.get("fraud_probability", 0.5)),
                reason=a.get("reason", ""),
                approval_required=(a.get("route") != "auto"),
                approval_route=ApprovalRole.NONE if a.get("route") == "auto" else ApprovalRole.SENIOR_ANALYST
            ))
        
        # Exposure and verdict mapping
        verdict = c_meta.get("verdict", "uncertain")
        fraud_prob = float(c_meta.get("fraud_probability", 0.5))
        exposure = float(c_meta.get("exposure_usd", 0.0))

        bm = benchmark_meta.get(cid, {})
        flagged_txn = bm.get("flagged_txn_id") or "3514030"
        cust_id = bm.get("customer_id") or f"CUST_{cid}"

        rec = CaseRecord(
            case_id=cid,
            trigger_txn_id=flagged_txn,
            subject_customer_id=cust_id,
            status=CaseStatus.RESOLVED if verdict in ("fraud", "legitimate") else CaseStatus.AWAITING_EVIDENCE,
            risk_score=fraud_prob,
            confidence=fraud_prob if verdict == "fraud" else (1.0 - fraud_prob if verdict == "legitimate" else 0.5),
            fraud_patterns=[c_meta.get("pattern")] if c_meta.get("pattern") and c_meta.get("pattern") != "none" else [],
            recommended_actions=rec_actions,
            findings=[c_meta.get("summary", "")]
        )

        cursor.execute("""
            INSERT OR REPLACE INTO cases (
                case_id, trigger_txn_id, subject_customer_id, status,
                risk_score, confidence, uncertainty_level, data_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rec.case_id, rec.trigger_txn_id, rec.subject_customer_id,
            rec.status.value, rec.risk_score, rec.confidence,
            rec.uncertainty_level, rec.model_dump_json(), rec.created_at, rec.updated_at
        ))

    conn.commit()
    remaining = [r[0] for r in cursor.execute("SELECT case_id FROM cases ORDER BY case_id").fetchall()]
    conn.close()
    print(f"Total cases in store: {len(remaining)}")
    print("Case IDs:", remaining)
    return remaining

if __name__ == "__main__":
    sync_competition_cases()
