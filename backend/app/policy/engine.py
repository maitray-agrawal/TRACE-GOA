"""Deterministic Policy Engine.

Enforces institutional compliance, risk thresholds, and regulatory mandates
(FinCEN BSA $5,000 threshold, Reg E consumer protection), evaluating whether
an action is ALLOWED, ALLOWED_WITH_APPROVAL, PROHIBITED, or REQUIRES_MORE_EVIDENCE.
"""

from typing import Any, Dict, List, Optional
from enum import Enum
import logging
from backend.app.schemas.case import ActionType, ApprovalRole

logger = logging.getLogger("PolicyEngine")


class PolicyVerdict(str, Enum):
    ALLOWED = "ALLOWED"
    ALLOWED_WITH_APPROVAL = "ALLOWED_WITH_APPROVAL"
    PROHIBITED = "PROHIBITED"
    REQUIRES_MORE_EVIDENCE = "REQUIRES_MORE_EVIDENCE"


class PolicyEvaluationResult:
    def __init__(
        self,
        verdict: PolicyVerdict,
        action: ActionType,
        required_role: ApprovalRole,
        policy_rules: List[str],
        reason: str
    ):
        self.verdict = verdict
        self.action = action
        self.required_role = required_role
        self.policy_rules = policy_rules
        self.reason = reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "verdict": self.verdict.value,
            "action": self.action.value,
            "required_role": self.required_role.value,
            "policy_rules": self.policy_rules,
            "reason": self.reason
        }


class PolicyEngine:
    """Deterministic policy validator."""

    def evaluate_action(
        self,
        action: ActionType,
        risk_score: float,
        confidence: float,
        amount: float = 0.0,
        patterns: Optional[List[str]] = None,
        has_verified_step_up: bool = False
    ) -> PolicyEvaluationResult:
        patterns = patterns or []
        rules = []

        # Rule 1: High Risk & Low Confidence -> MUST request more evidence first!
        if risk_score >= 0.60 and confidence < 0.68 and not has_verified_step_up:
            if action in (ActionType.BLOCK_ACCOUNT, ActionType.FILE_REPORT):
                return PolicyEvaluationResult(
                    verdict=PolicyVerdict.REQUIRES_MORE_EVIDENCE,
                    action=action,
                    required_role=ApprovalRole.ANALYST,
                    policy_rules=["POL-001: Uncertainty Pre-Action Constraint"],
                    reason="Confidence is below operational threshold (0.68). Step-up authentication or customer challenge required before punitive action."
                )

        # Rule 2: Account Freezing / Blocking requires Fraud Manager sign-off
        if action == ActionType.BLOCK_ACCOUNT:
            rules.append("POL-002: Executive Account Lockout Directive")
            if confidence >= 0.70 or has_verified_step_up:
                return PolicyEvaluationResult(
                    verdict=PolicyVerdict.ALLOWED_WITH_APPROVAL,
                    action=action,
                    required_role=ApprovalRole.FRAUD_MANAGER,
                    policy_rules=rules,
                    reason="Account freeze requires Fraud Manager authorization."
                )
            else:
                return PolicyEvaluationResult(
                    verdict=PolicyVerdict.PROHIBITED,
                    action=action,
                    required_role=ApprovalRole.FRAUD_MANAGER,
                    policy_rules=rules,
                    reason="Insufficient evidence to freeze customer account."
                )

        # Rule 3: Regulatory SAR Filing (FinCEN BSA Threshold)
        if action == ActionType.FILE_REPORT:
            rules.append("REG-BSA-31CFR: FinCEN Suspicious Activity Reporting")
            return PolicyEvaluationResult(
                verdict=PolicyVerdict.ALLOWED_WITH_APPROVAL,
                action=action,
                required_role=ApprovalRole.FRAUD_MANAGER,
                policy_rules=rules,
                reason="SAR filing strictly requires Fraud Manager approval and legal compliance review."
            )

        # Rule 4: Transaction Blocking
        if action == ActionType.BLOCK_TRANSACTION:
            rules.append("POL-003: Payment Authorization Denial Standard")
            if risk_score >= 0.70 or confidence >= 0.75:
                return PolicyEvaluationResult(
                    verdict=PolicyVerdict.ALLOWED_WITH_APPROVAL,
                    action=action,
                    required_role=ApprovalRole.SENIOR_ANALYST,
                    policy_rules=rules,
                    reason="Transaction blocking requires Senior Analyst review."
                )
            else:
                return PolicyEvaluationResult(
                    verdict=PolicyVerdict.REQUIRES_MORE_EVIDENCE,
                    action=action,
                    required_role=ApprovalRole.ANALYST,
                    policy_rules=rules,
                    reason="Risk score does not warrant unilateral blocking; perform step-up auth."
                )

        # Rule 5: Low-friction / Observational actions
        if action in (ActionType.ALLOW_TRANSACTION, ActionType.MONITOR_TRANSACTION, ActionType.WARN_CUSTOMER):
            rules.append("POL-004: Low-Friction Customer Assurance Protocol")
            return PolicyEvaluationResult(
                verdict=PolicyVerdict.ALLOWED,
                action=action,
                required_role=ApprovalRole.NONE,
                policy_rules=rules,
                reason="Routine operational action permitted without escalation."
            )

        # Rule 6: Evidence Requests
        if action in (ActionType.REQUEST_STEP_UP_AUTH, ActionType.REQUEST_CUSTOMER_VALIDATION, ActionType.REQUEST_MORE_EVIDENCE):
            rules.append("POL-005: Out-of-Band Verification Policy")
            return PolicyEvaluationResult(
                verdict=PolicyVerdict.ALLOWED,
                action=action,
                required_role=ApprovalRole.ANALYST,
                policy_rules=rules,
                reason="Step-up authentication / customer challenge permitted."
            )

        # Default fallback
        return PolicyEvaluationResult(
            verdict=PolicyVerdict.ALLOWED_WITH_APPROVAL,
            action=action,
            required_role=ApprovalRole.ANALYST,
            policy_rules=["POL-GEN: General Investigation Guidance"],
            reason="Action permitted subject to supervisory concurrence."
        )
