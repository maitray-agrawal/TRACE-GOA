"""Unit tests for Auditable MCP Tool Dispatcher and Security Registry."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.graph.mcp_dispatcher import get_mcp_dispatcher, ALLOWLISTED_TOOLS
from backend.app.audit.ledger import get_decision_ledger


def test_mcp_allowlist_registry():
    dispatcher = get_mcp_dispatcher()
    assert "get_transaction" in ALLOWLISTED_TOOLS
    assert "get_transaction_neighborhood" in ALLOWLISTED_TOOLS
    assert "query_centrality" in ALLOWLISTED_TOOLS
    assert "write_back_case" in ALLOWLISTED_TOOLS


def test_mcp_authorized_dispatch():
    dispatcher = get_mcp_dispatcher()
    res = dispatcher.dispatch(
        tool_name="query_centrality",
        arguments={"top_k": 3},
        case_id="TEST-MCP-001"
    )
    assert res.get("status") == "SUCCESS"
    assert "result" in res or "data" in res
    assert "latency_ms" in res
    assert res["latency_ms"] >= 0.0


def test_mcp_unauthorized_tool_blocked():
    dispatcher = get_mcp_dispatcher()
    ledger = get_decision_ledger()

    res = dispatcher.dispatch(
        tool_name="unauthorized_arbitrary_shell_exec",
        arguments={"cmd": "whoami"},
        case_id="TEST-MCP-SECURITY-001"
    )

    assert res.get("success") is False
    assert res.get("status") == "UNAUTHORIZED"
    assert "Security Violation" in res.get("error", "")

    # Verify security audit event was logged in tamper-evident ledger
    entries = ledger.get_case_ledger("TEST-MCP-SECURITY-001")
    assert any(e["event_type"] == "UNAUTHORIZED_TOOL_BLOCKED" for e in entries)


def test_mcp_secret_scrubbing():
    dispatcher = get_mcp_dispatcher()
    scrubbed = dispatcher.scrub_arguments({
        "username": "investigator_alice",
        "api_key": "sk-secret-tg-123456789",
        "auth_token": "bearer-xyz-secret",
        "depth": 2
    })

    assert scrubbed["username"] == "investigator_alice"
    assert scrubbed["api_key"] == "[REDACTED]"
    assert scrubbed["auth_token"] == "[REDACTED]"
    assert scrubbed["depth"] == 2
