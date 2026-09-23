"""Unit tests for Deterministic Policy Engine."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.policy.engine import PolicyEngine, PolicyVerdict
from backend.app.schemas.case import ActionType, ApprovalRole


def test_policy_uncertainty_constraint():
    engine = PolicyEngine()
    # High risk but low confidence without step-up -> MUST require more evidence
    res = engine.evaluate_action(
        action=ActionType.BLOCK_ACCOUNT,
        risk_score=0.85,
        confidence=0.55,
        has_verified_step_up=False
    )
    assert res.verdict == PolicyVerdict.REQUIRES_MORE_EVIDENCE


def test_policy_account_block_requires_fraud_manager():
    engine = PolicyEngine()
    res = engine.evaluate_action(
        action=ActionType.BLOCK_ACCOUNT,
        risk_score=0.92,
        confidence=0.88,
        has_verified_step_up=True
    )
    assert res.verdict == PolicyVerdict.ALLOWED_WITH_APPROVAL
    assert res.required_role == ApprovalRole.FRAUD_MANAGER


def test_policy_allow_transaction_zero_friction():
    engine = PolicyEngine()
    res = engine.evaluate_action(
        action=ActionType.ALLOW_TRANSACTION,
        risk_score=0.15,
        confidence=0.80
    )
    assert res.verdict == PolicyVerdict.ALLOWED
    assert res.required_role == ApprovalRole.NONE
