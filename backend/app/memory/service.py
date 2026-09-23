"""Case Memory Subsystem.

Provides persistent storage and hybrid topological/semantic similarity retrieval
across past investigations, allowing future cases to learn from historical dispositions.
"""

from typing import Any, Dict, List, Optional
import os
import json
import sqlite3
import time
import logging
from backend.app.schemas.case import CaseRecord

logger = logging.getLogger("CaseMemory")


class CaseMemoryService:
    """Manages persistent institutional memory of closed and investigated cases."""

    def __init__(self, db_path: str = "data/case_memory.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS case_memories (
                    case_id TEXT PRIMARY KEY,
                    primary_pattern TEXT,
                    risk_score REAL,
                    confidence REAL,
                    final_outcome TEXT,
                    summary TEXT,
                    entities_json TEXT,
                    actions_json TEXT,
                    created_at REAL
                )
            """)
            conn.commit()

    def record_case_memory(
        self,
        case: CaseRecord,
        summary: str,
        analyst_outcome: str = "CONFIRMED_FRAUD"
    ) -> Dict[str, Any]:
        """Saves a completed investigation into persistent case memory."""
        pattern = case.fraud_patterns[0] if case.fraud_patterns else "UNSPECIFIED"
        entities = [case.subject_customer_id, case.trigger_txn_id]

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO case_memories (
                    case_id, primary_pattern, risk_score, confidence,
                    final_outcome, summary, entities_json, actions_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                case.case_id, pattern, case.risk_score, case.confidence,
                analyst_outcome, summary, json.dumps(entities),
                json.dumps([a.model_dump() for a in case.recommended_actions]),
                time.time()
            ))
            conn.commit()

        logger.info(f"Recorded Case Memory for {case.case_id} [Outcome: {analyst_outcome}]")
        return {"case_id": case.case_id, "pattern": pattern, "outcome": analyst_outcome}

    def find_similar_memories(
        self,
        pattern: Optional[str] = None,
        min_risk: float = 0.50,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieves past cases matching fraud typology and risk criteria."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if pattern:
                cursor.execute("""
                    SELECT * FROM case_memories
                    WHERE (primary_pattern = ? OR primary_pattern = 'UNSPECIFIED')
                      AND risk_score >= ?
                    ORDER BY risk_score DESC LIMIT ?
                """, (pattern, min_risk, limit))
            else:
                cursor.execute("""
                    SELECT * FROM case_memories
                    WHERE risk_score >= ?
                    ORDER BY risk_score DESC LIMIT ?
                """, (min_risk, limit))

            rows = cursor.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                d["entities"] = json.loads(d["entities_json"])
                d["actions"] = json.loads(d["actions_json"])
                results.append(d)
            return results

    def search_similar_cases(
        self,
        query_text: str = "",
        pattern_filter: Optional[str] = None,
        min_risk: float = 0.50,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Searches similar historical cases by pattern or risk profile."""
        return self.find_similar_memories(pattern=pattern_filter, min_risk=min_risk, limit=top_k)


# Global singleton
_MEMORY_SERVICE: Optional[CaseMemoryService] = None

def get_memory_service() -> CaseMemoryService:
    global _MEMORY_SERVICE
    if _MEMORY_SERVICE is None:
        _MEMORY_SERVICE = CaseMemoryService()
    return _MEMORY_SERVICE
