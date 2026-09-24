"""Case Management Service handling case lifecycles, states, and evidence."""

from typing import Any, Dict, List, Optional
import os
import json
import sqlite3
import time
import logging
from backend.app.schemas.case import CaseRecord, CaseStatus, RecommendedAction, EvidenceItem
from backend.app.audit.ledger import get_decision_ledger

logger = logging.getLogger("CaseService")


class CaseService:
    """Manages active investigations, case state transitions, and persistent storage."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.getenv("TRACE_CASES_DB", "data/cases.db")
        os.makedirs(os.path.dirname(self.db_path) if os.path.dirname(self.db_path) else ".", exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
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
            conn.commit()

    def create_case(
        self,
        case_id: str,
        trigger_txn_id: str,
        subject_customer_id: str,
        initial_risk: float = 0.0,
        initial_confidence: float = 0.0
    ) -> CaseRecord:
        """Initializes a new case in state NEW and logs to ledger."""
        now = time.time()
        record = CaseRecord(
            case_id=case_id,
            trigger_txn_id=trigger_txn_id,
            subject_customer_id=subject_customer_id,
            status=CaseStatus.NEW,
            risk_score=initial_risk,
            confidence=initial_confidence,
            created_at=now,
            updated_at=now
        )

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO cases (
                    case_id, trigger_txn_id, subject_customer_id, status,
                    risk_score, confidence, uncertainty_level, data_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.case_id, record.trigger_txn_id, record.subject_customer_id,
                record.status.value, record.risk_score, record.confidence,
                record.uncertainty_level, record.model_dump_json(), record.created_at, record.updated_at
            ))
            conn.commit()

        # Log to ledger
        ledger = get_decision_ledger()
        ledger.record_event(
            case_id=case_id,
            actor="CaseService",
            event_type="CASE_CREATED",
            input_data={"trigger": trigger_txn_id, "subject": subject_customer_id},
            decision="CASE_OPENED",
            reason=f"Fraud trigger {trigger_txn_id} ingested for subject {subject_customer_id}",
            confidence=initial_confidence
        )

        return record

    def get_case(self, case_id: str) -> Optional[CaseRecord]:
        """Loads case from database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT data_json FROM cases WHERE case_id = ?", (case_id,))
            row = cursor.fetchone()
            if row:
                return CaseRecord.model_validate_json(row[0])
        return None

    def list_cases(self, status: Optional[str] = None, limit: int = 50) -> List[CaseRecord]:
        """Lists cases filtered by status."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute("SELECT data_json FROM cases WHERE status = ? ORDER BY updated_at DESC LIMIT ?", (status, limit))
            else:
                cursor.execute("SELECT data_json FROM cases ORDER BY updated_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [CaseRecord.model_validate_json(r[0]) for r in rows]

    def update_case(self, record: CaseRecord, event_reason: Optional[str] = None) -> CaseRecord:
        """Progressively updates a case record and writes ledger entry."""
        record.updated_at = time.time()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE cases SET
                    status = ?, risk_score = ?, confidence = ?,
                    uncertainty_level = ?, data_json = ?, updated_at = ?
                WHERE case_id = ?
            """, (
                record.status.value, record.risk_score, record.confidence,
                record.uncertainty_level, record.model_dump_json(), record.updated_at,
                record.case_id
            ))
            conn.commit()

        if event_reason:
            ledger = get_decision_ledger()
            ledger.record_event(
                case_id=record.case_id,
                actor="InvestigationAgent",
                event_type="CASE_STATE_UPDATED",
                input_data={"status": record.status.value, "risk": record.risk_score},
                decision=record.status.value,
                reason=event_reason,
                confidence=record.confidence
            )

        return record


# Global singleton
_CASE_SERVICE: Optional[CaseService] = None

def get_case_service(db_path: Optional[str] = None) -> CaseService:
    global _CASE_SERVICE
    target_path = db_path or os.getenv("TRACE_CASES_DB", "data/cases.db")
    if _CASE_SERVICE is None or _CASE_SERVICE.db_path != target_path:
        _CASE_SERVICE = CaseService(db_path=target_path)
    return _CASE_SERVICE

def reset_case_service() -> None:
    global _CASE_SERVICE
    _CASE_SERVICE = None
