"""FastAPI REST API Routes for Fraud Investigation Command Center."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
import time

from backend.app.schemas.case import CaseRecord, CaseStatus, ApprovalRole, ActionType
from backend.app.cases.service import get_case_service
from backend.app.audit.ledger import get_decision_ledger
from backend.app.graph.client import get_default_graph_client
from backend.app.agents.state_machine import FraudInvestigationAgent
from backend.app.actions.approval import ApprovalEngine
from backend.app.memory.service import get_memory_service
from backend.app.graphrag.synthesizer import POLICY_KNOWLEDGE_BASE

router = APIRouter(prefix="/api")


# Request/Response models
class RunInvestigationRequest(BaseModel):
    allow_step_up: bool = True
    simulate_step_up_success: bool = True


class ApprovalRequest(BaseModel):
    action: str
    approver_name: str
    approver_role: ApprovalRole
    approved: bool
    notes: Optional[str] = ""


class EvidenceSubmissionRequest(BaseModel):
    source: str
    direction: str
    title: str
    payload: Dict[str, Any]


@router.get("/metrics")
def get_metrics() -> Dict[str, Any]:
    """Returns high-level operational statistics for the analyst command center."""
    case_svc = get_case_service()
    all_cases = case_svc.list_cases(limit=100)

    high_risk_count = sum(1 for c in all_cases if c.risk_score >= 0.70)
    awaiting_approval = sum(1 for c in all_cases if c.status == CaseStatus.AWAITING_APPROVAL)
    awaiting_evidence = sum(1 for c in all_cases if c.status == CaseStatus.AWAITING_EVIDENCE)
    resolved = sum(1 for c in all_cases if c.status in (CaseStatus.RESOLVED, CaseStatus.ACTION_EXECUTED))

    return {
        "total_active_cases": len(all_cases),
        "high_risk_cases": high_risk_count,
        "awaiting_approval": awaiting_approval,
        "awaiting_evidence": awaiting_evidence,
        "resolved_cases": resolved,
        "average_confidence": round(sum(c.confidence for c in all_cases) / max(len(all_cases), 1), 2)
    }


@router.get("/investigations", response_model=List[CaseRecord])
def list_investigations(status: Optional[str] = None, limit: int = 50) -> List[CaseRecord]:
    """Retrieves list of investigation cases."""
    case_svc = get_case_service()
    return case_svc.list_cases(status=status, limit=limit)


@router.get("/investigations/{case_id}", response_model=CaseRecord)
def get_investigation(case_id: str) -> CaseRecord:
    """Retrieves an investigation case docket by ID."""
    case_svc = get_case_service()
    case = case_svc.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


@router.post("/investigations/{case_id}/run")
def run_investigation(case_id: str, req: RunInvestigationRequest = Body(default=RunInvestigationRequest())) -> Dict[str, Any]:
    """Executes the full autonomous investigation state machine for a case."""
    agent = FraudInvestigationAgent()
    return agent.run_investigation(
        case_id=case_id,
        allow_evidence_step_up=req.allow_step_up,
        simulate_step_up_success=req.simulate_step_up_success
    )


@router.get("/investigations/{case_id}/graph")
def get_investigation_graph(case_id: str, depth: int = Query(default=2, ge=1, le=3)) -> Dict[str, Any]:
    """Returns the TigerGraph 2-hop neighborhood around the case's trigger transaction."""
    case_svc = get_case_service()
    case = case_svc.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    client = get_default_graph_client()
    return client.query_transaction_neighborhood(case.trigger_txn_id, depth=depth)


@router.get("/investigations/{case_id}/evidence")
def get_investigation_evidence(case_id: str) -> Dict[str, Any]:
    """Returns supporting, contradicting, and missing evidence for a case."""
    case_svc = get_case_service()
    case = case_svc.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    return {
        "case_id": case.case_id,
        "supporting": [e.model_dump() for e in case.supporting_evidence],
        "contradicting": [e.model_dump() for e in case.contradicting_evidence],
        "missing": case.missing_evidence,
        "uncertainty_level": case.uncertainty_level
    }


@router.get("/investigations/{case_id}/decisions")
def get_investigation_decisions(case_id: str) -> List[Dict[str, Any]]:
    """Retrieves the chronological SHA-256 hash-chained decision ledger for a case."""
    ledger = get_decision_ledger()
    return ledger.get_case_ledger(case_id)


@router.post("/investigations/{case_id}/actions/approve")
def approve_action(case_id: str, req: ApprovalRequest) -> Dict[str, Any]:
    """Electronic analyst sign-off for pending high-impact actions."""
    approval_engine = ApprovalEngine()
    res = approval_engine.process_approval(
        case_id=case_id,
        action_name=req.action,
        approver_name=req.approver_name,
        approver_role=req.approver_role,
        approved=req.approved,
        notes=req.notes or ""
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res


@router.post("/investigations/{case_id}/evidence")
def add_evidence(case_id: str, req: EvidenceSubmissionRequest) -> Dict[str, Any]:
    """Attaches external evidence (e.g. customer submitted document or step-up response) and triggers reassessment."""
    case_svc = get_case_service()
    case = case_svc.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    from backend.app.schemas.case import EvidenceItem
    ev = EvidenceItem(
        id=f"EV_EXT_{len(case.supporting_evidence)+1}",
        source=req.source,
        direction=req.direction,
        title=req.title,
        details=req.payload
    )
    if req.direction == "SUPPORTING":
        case.supporting_evidence.append(ev)
    else:
        case.contradicting_evidence.append(ev)

    case.status = CaseStatus.REASSESSMENT
    case_svc.update_case(case, f"Attached external evidence: {req.title}")

    # Re-run investigation
    agent = FraudInvestigationAgent()
    return agent.run_investigation(case_id, allow_evidence_step_up=False)


@router.get("/investigations/{case_id}/memory")
def get_case_memory_insights(case_id: str) -> Dict[str, Any]:
    """Retrieves similar past closed cases and institutional outcomes."""
    case_svc = get_case_service()
    case = case_svc.get_case(case_id)
    pattern = case.fraud_patterns[0] if case and case.fraud_patterns else None

    mem_svc = get_memory_service()
    similar = mem_svc.find_similar_memories(pattern=pattern, min_risk=0.50, limit=5)
    return {"case_id": case_id, "pattern": pattern, "similar_past_cases": similar}


@router.post("/ledger/verify")
def verify_ledger(case_id: str = Query(...)) -> Dict[str, Any]:
    """Validates SHA-256 cryptographic chain of custody for a case docket."""
    ledger = get_decision_ledger()
    return ledger.verify_case_ledger(case_id)


@router.get("/policies")
def get_policies() -> List[Dict[str, Any]]:
    """Returns bank fraud policies and regulatory compliance references."""
    return POLICY_KNOWLEDGE_BASE


@router.get("/system/diagnostics")
def get_system_diagnostics() -> Dict[str, Any]:
    """Returns real operational diagnostics for active backend engines."""
    from backend.app.llm.provider import get_llm_provider
    import os

    graph_client = get_default_graph_client()
    llm_provider = get_llm_provider()

    # Determine dataset rows and type
    dataset_type = "SYNTHETIC_DEVELOPMENT_FIXTURE"
    dataset_rows = 243
    txn_csv_path = "data/raw/transactions.csv"
    if os.path.exists(txn_csv_path):
        try:
            with open(txn_csv_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                dataset_rows = max(0, len(lines) - 1)
        except Exception:
            pass

    return {
        "environment": os.getenv("APP_ENV", "development"),
        "graph_engine": graph_client.engine_name,
        "mcp": "CONNECTED" if graph_client.engine_name == "TIGERGRAPH" else "LOCAL_DISPATCHER",
        "llm": llm_provider.provider_name,
        "runtime_mode": llm_provider.runtime_mode,
        "graphrag": "ACTIVE",
        "case_memory": "ACTIVE",
        "ledger": "ACTIVE",
        "dataset": dataset_type,
        "dataset_rows": dataset_rows
    }
