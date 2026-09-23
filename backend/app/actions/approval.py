"""Role-Based Approval Engine.

Manages electronic approval sign-offs for high-impact actions (Analyst, Senior Analyst,
Fraud Manager), recording cryptographic audit evidence on sign-off or rejection.
"""

from typing import Any, Dict, List, Optional
import time
import logging
from backend.app.schemas.case import ApprovalRole, ActionType, CaseRecord, CaseStatus
from backend.app.cases.service import get_case_service
from backend.app.audit.ledger import get_decision_ledger

logger = logging.getLogger("ApprovalEngine")


class ApprovalEngine:
    """Handles role-based approval transitions."""

    ROLE_HIERARCHY = {
        ApprovalRole.NONE: 0,
        ApprovalRole.ANALYST: 1,
        ApprovalRole.SENIOR_ANALYST: 2,
        ApprovalRole.FRAUD_MANAGER: 3
    }

    @classmethod
    def can_approve(cls, user_role: ApprovalRole, required_role: ApprovalRole) -> bool:
        return cls.ROLE_HIERARCHY.get(user_role, 0) >= cls.ROLE_HIERARCHY.get(required_role, 0)

    def submit_for_approval(
        self,
        case_id: str,
        action: ActionType,
        required_role: ApprovalRole,
        reason: str
    ) -> Dict[str, Any]:
        case_svc = get_case_service()
        ledger = get_decision_ledger()

        record = case_svc.get_case(case_id)
        if not record:
            return {"error": f"Case {case_id} not found"}

        record.status = CaseStatus.AWAITING_APPROVAL
        approval_item = {
            "action": action.value,
            "required_role": required_role.value,
            "status": "PENDING",
            "requested_at": time.time(),
            "reason": reason
        }
        record.approvals.append(approval_item)
        case_svc.update_case(record)

        ledger.record_event(
            case_id=case_id,
            actor="Agent",
            event_type="APPROVAL_REQUESTED",
            input_data={"action": action.value, "required_role": required_role.value},
            decision="PENDING_APPROVAL",
            reason=reason,
            confidence=record.confidence,
            approval_required=True,
            approval_status="PENDING"
        )

        return {"case_id": case_id, "status": "AWAITING_APPROVAL", "approval": approval_item}

    def process_approval(
        self,
        case_id: str,
        action_name: str,
        approver_name: str,
        approver_role: ApprovalRole,
        approved: bool,
        notes: str = ""
    ) -> Dict[str, Any]:
        case_svc = get_case_service()
        ledger = get_decision_ledger()

        record = case_svc.get_case(case_id)
        if not record:
            return {"error": f"Case {case_id} not found", "success": False}

        pending = next((a for a in record.approvals if a["action"] == action_name and a["status"] == "PENDING"), None)
        if not pending:
            return {"error": f"No pending approval for action {action_name}", "success": False}

        req_role = ApprovalRole(pending["required_role"])
        if not self.can_approve(approver_role, req_role):
            return {
                "error": f"Insufficient authority: role {approver_role.value} cannot approve action requiring {req_role.value}",
                "success": False
            }

        # Update approval entry
        pending["status"] = "APPROVED" if approved else "REJECTED"
        pending["approver"] = approver_name
        pending["approver_role"] = approver_role.value
        pending["resolved_at"] = time.time()
        pending["notes"] = notes

        if approved:
            record.status = CaseStatus.ACTION_EXECUTED
            record.executed_actions.append({
                "action": action_name,
                "executed_at": time.time(),
                "authorized_by": f"{approver_name} ({approver_role.value})",
                "status": "SUCCESS"
            })
        else:
            record.status = CaseStatus.ESCALATED

        case_svc.update_case(record)

        ledger.record_event(
            case_id=case_id,
            actor=f"{approver_name} [{approver_role.value}]",
            event_type="APPROVAL_RESOLVED",
            input_data={"action": action_name, "approved": approved, "notes": notes},
            decision="APPROVED" if approved else "REJECTED",
            reason=notes or f"Action {action_name} {'approved' if approved else 'rejected'} by {approver_role.value}",
            confidence=record.confidence,
            approval_required=True,
            approval_status="APPROVED" if approved else "REJECTED"
        )

        return {
            "success": True,
            "case_id": case_id,
            "action": action_name,
            "approved": approved,
            "new_case_status": record.status.value
        }
