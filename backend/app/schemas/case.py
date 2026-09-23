"""Case and Decision Domain Schemas with Pydantic v2 validation."""

from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import time


class CaseStatus(str, Enum):
    TRIGGERED = "TRIGGERED"
    CASE_CREATED = "CASE_CREATED"
    PLANNING = "PLANNING"
    INVESTIGATING = "INVESTIGATING"
    EVIDENCE_COLLECTION = "EVIDENCE_COLLECTION"
    PATTERN_ANALYSIS = "PATTERN_ANALYSIS"
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    UNCERTAINTY_ANALYSIS = "UNCERTAINTY_ANALYSIS"
    EVIDENCE_REQUIRED = "EVIDENCE_REQUIRED"
    REASSESSMENT = "REASSESSMENT"
    ACTION_PLANNING = "ACTION_PLANNING"
    POLICY_CHECK = "POLICY_CHECK"
    APPROVAL_PENDING = "APPROVAL_PENDING"
    ACTION_EXECUTION = "ACTION_EXECUTION"
    CASE_UPDATE = "CASE_UPDATE"
    MEMORY_UPDATE = "MEMORY_UPDATE"
    RESOLVED = "RESOLVED"

    # Compatibility values
    NEW = "NEW"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    AWAITING_EVIDENCE = "AWAITING_EVIDENCE"
    ACTION_EXECUTED = "ACTION_EXECUTED"
    ACTION_PENDING = "ACTION_PENDING"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"


class ActionType(str, Enum):
    ALLOW_TRANSACTION = "ALLOW_TRANSACTION"
    BLOCK_TRANSACTION = "BLOCK_TRANSACTION"
    MONITOR_TRANSACTION = "MONITOR_TRANSACTION"
    BLOCK_ACCOUNT = "BLOCK_ACCOUNT"
    MONITOR_ACCOUNT = "MONITOR_ACCOUNT"
    WARN_CUSTOMER = "WARN_CUSTOMER"
    CREATE_CASE = "CREATE_CASE"
    REQUEST_MORE_EVIDENCE = "REQUEST_MORE_EVIDENCE"
    REQUEST_CUSTOMER_VALIDATION = "REQUEST_CUSTOMER_VALIDATION"
    REQUEST_STEP_UP_AUTH = "REQUEST_STEP_UP_AUTH"
    ESCALATE_TO_ANALYST = "ESCALATE_TO_ANALYST"
    FILE_REPORT = "FILE_REPORT"


class ApprovalRole(str, Enum):
    NONE = "NONE"
    ANALYST = "ANALYST"
    SENIOR_ANALYST = "SENIOR_ANALYST"
    FRAUD_MANAGER = "FRAUD_MANAGER"


class EvidenceItem(BaseModel):
    id: str
    source: str = Field(..., description="GRAPH, POLICY, TELEMETRY, or EXTERNAL_STEP_UP")
    direction: str = Field(..., description="SUPPORTING, CONTRADICTING, or MISSING")
    title: str
    details: Dict[str, Any]
    weight: float = 1.0
    timestamp: float = Field(default_factory=time.time)


class RecommendedAction(BaseModel):
    action: ActionType
    priority: str = "HIGH"
    confidence: float
    reason: str
    supporting_evidence: List[str] = Field(default_factory=list)
    policy_basis: List[str] = Field(default_factory=list)
    approval_required: bool = False
    approval_route: ApprovalRole = ApprovalRole.NONE
    execution_status: str = "PENDING"


class CaseRecord(BaseModel):
    case_id: str
    trigger_txn_id: str
    subject_customer_id: str
    status: CaseStatus = CaseStatus.NEW
    risk_score: float = 0.0
    confidence: float = 0.0
    fraud_patterns: List[str] = Field(default_factory=list)
    supporting_evidence: List[EvidenceItem] = Field(default_factory=list)
    contradicting_evidence: List[EvidenceItem] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    uncertainty_level: str = "LOW"
    findings: List[str] = Field(default_factory=list)
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    executed_actions: List[Dict[str, Any]] = Field(default_factory=list)
    approvals: List[Dict[str, Any]] = Field(default_factory=list)
    investigator: str = "TigerGraph-Agent-v1"
    final_outcome: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
