"""Cryptographic SHA-256 Tamper-Evident Decision Ledger.

Implements immutable hash chaining for every agent investigation event,
providing auditability and verifiable detection of retrospective tampering.
"""

from typing import Any, Dict, List, Optional
import hashlib
import json
import time
import os
import sqlite3
import logging

logger = logging.getLogger("DecisionLedger")

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


class DecisionLedger:
    """Manages hash-chained event logs for investigation cases."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.getenv("TRACE_LEDGER_DB", "data/decision_ledger.db")
        os.makedirs(os.path.dirname(self.db_path) if os.path.dirname(self.db_path) else ".", exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ledger_entries (
                    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id TEXT NOT NULL,
                    timestamp REAL NOT NULL,
                    actor TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    input_data TEXT NOT NULL,
                    evidence_ref TEXT,
                    decision TEXT,
                    reason TEXT,
                    confidence REAL,
                    policy_ref TEXT,
                    approval_required INTEGER,
                    approval_status TEXT,
                    previous_hash TEXT NOT NULL,
                    current_hash TEXT NOT NULL
                )
            """)
            conn.commit()

    @staticmethod
    def compute_hash(
        previous_hash: str,
        case_id: str,
        timestamp: float,
        actor: str,
        event_type: str,
        input_data: str,
        decision: Optional[str],
        reason: Optional[str],
        confidence: Optional[float]
    ) -> str:
        """Computes deterministic SHA-256 block hash."""
        payload = f"{previous_hash}|{case_id}|{timestamp:.4f}|{actor}|{event_type}|{input_data}|{decision or ''}|{reason or ''}|{confidence or 0.0}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def record_event(
        self,
        case_id: str,
        actor: str,
        event_type: str,
        input_data: Any,
        decision: Optional[str] = None,
        reason: Optional[str] = None,
        confidence: Optional[float] = None,
        evidence_ref: Optional[str] = None,
        policy_ref: Optional[str] = None,
        approval_required: bool = False,
        approval_status: str = "NONE",
        timestamp: Optional[float] = None
    ) -> Dict[str, Any]:
        """Appends a new hash-chained event to the ledger."""
        ts = timestamp or time.time()
        input_str = json.dumps(input_data, sort_keys=True) if not isinstance(input_data, str) else input_data

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Fetch latest hash for this case
            cursor.execute("SELECT current_hash FROM ledger_entries WHERE case_id = ? ORDER BY entry_id DESC LIMIT 1", (case_id,))
            row = cursor.fetchone()
            prev_hash = row[0] if row else GENESIS_HASH

            curr_hash = self.compute_hash(
                previous_hash=prev_hash,
                case_id=case_id,
                timestamp=ts,
                actor=actor,
                event_type=event_type,
                input_data=input_str,
                decision=decision,
                reason=reason,
                confidence=confidence
            )

            cursor.execute("""
                INSERT INTO ledger_entries (
                    case_id, timestamp, actor, event_type, input_data,
                    evidence_ref, decision, reason, confidence, policy_ref,
                    approval_required, approval_status, previous_hash, current_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                case_id, ts, actor, event_type, input_str,
                evidence_ref, decision, reason, confidence, policy_ref,
                1 if approval_required else 0, approval_status, prev_hash, curr_hash
            ))
            entry_id = cursor.lastrowid
            conn.commit()

        return {
            "entry_id": entry_id,
            "case_id": case_id,
            "timestamp": ts,
            "actor": actor,
            "event_type": event_type,
            "decision": decision,
            "reason": reason,
            "confidence": confidence,
            "previous_hash": prev_hash,
            "current_hash": curr_hash
        }

    def get_case_ledger(self, case_id: str) -> List[Dict[str, Any]]:
        """Retrieves chronological entries for a case."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ledger_entries WHERE case_id = ? ORDER BY entry_id ASC", (case_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def verify_case_ledger(self, case_id: str) -> Dict[str, Any]:
        """Validates cryptographic integrity of a case ledger from genesis."""
        entries = self.get_case_ledger(case_id)
        if not entries:
            return {"case_id": case_id, "is_valid": True, "entries_checked": 0, "message": "Empty ledger"}

        expected_prev_hash = GENESIS_HASH
        for idx, entry in enumerate(entries):
            # Check previous hash pointer
            if entry["previous_hash"] != expected_prev_hash:
                return {
                    "case_id": case_id,
                    "is_valid": False,
                    "tamper_detected_at_entry": entry["entry_id"],
                    "index": idx,
                    "reason": f"Broken chain: expected prev_hash {expected_prev_hash} but found {entry['previous_hash']}"
                }

            # Recalculate block hash
            recomputed = self.compute_hash(
                previous_hash=entry["previous_hash"],
                case_id=entry["case_id"],
                timestamp=entry["timestamp"],
                actor=entry["actor"],
                event_type=entry["event_type"],
                input_data=entry["input_data"],
                decision=entry["decision"],
                reason=entry["reason"],
                confidence=entry["confidence"]
            )

            if recomputed != entry["current_hash"]:
                return {
                    "case_id": case_id,
                    "is_valid": False,
                    "tamper_detected_at_entry": entry["entry_id"],
                    "index": idx,
                    "reason": f"Content altered! Computed {recomputed} does not match stored hash {entry['current_hash']}"
                }

            expected_prev_hash = entry["current_hash"]

        return {
            "case_id": case_id,
            "is_valid": True,
            "entries_checked": len(entries),
            "latest_hash": expected_prev_hash,
            "message": "Cryptographic integrity fully verified"
        }


# Global singleton
_LEDGER_INSTANCE: Optional[DecisionLedger] = None

def get_decision_ledger(db_path: Optional[str] = None) -> DecisionLedger:
    global _LEDGER_INSTANCE
    target_path = db_path or os.getenv("TRACE_LEDGER_DB", "data/decision_ledger.db")
    if _LEDGER_INSTANCE is None or _LEDGER_INSTANCE.db_path != target_path:
        _LEDGER_INSTANCE = DecisionLedger(db_path=target_path)
    return _LEDGER_INSTANCE

def reset_decision_ledger() -> None:
    global _LEDGER_INSTANCE
    _LEDGER_INSTANCE = None
