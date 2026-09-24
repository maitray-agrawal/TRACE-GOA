"""Auditable MCP Tool Dispatcher with real call log.

Every invocation is recorded in self.call_log as an MCPToolCall dataclass.
The benchmark uses get_call_log() to report the true tool_calls count.
"""

from __future__ import annotations

import time
import logging
from dataclasses import dataclass, field, asdict
from typing import Any, Optional

from backend.app.graph.client import get_default_graph_client
from backend.app.audit.ledger import get_decision_ledger

logger = logging.getLogger("MCPDispatcher")

ALLOWLISTED_TOOLS = {
    "get_transaction",
    "get_customer",
    "get_transaction_neighborhood",
    "query_neighborhood",
    "detect_device_reuse",
    "detect_ip_reuse",
    "check_shared_identity",
    "find_shared_entities",
    "detect_patterns",
    "get_temporal_velocity",
    "find_similar_cases",
    "run_community_detection",
    "query_centrality",
    "write_back_case",
}


@dataclass
class MCPToolCall:
    """Immutable record of a single MCP tool invocation."""
    case_id: str
    tool: str
    args_scrubbed: dict
    status: str          # SUCCESS | FAILURE | UNAUTHORIZED
    latency_ms: float
    timestamp: float
    response_preview: str = ""  # first 200 chars of result JSON
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


class MCPToolDispatcher:
    """Audited dispatch layer for TigerGraph MCP tool invocations."""

    def __init__(self, client: Optional[Any] = None):
        self.client = client or get_default_graph_client()
        self.ledger = get_decision_ledger()
        self.call_log: list[MCPToolCall] = []

    def get_call_log(self) -> list[MCPToolCall]:
        """Returns the real list of calls made so far."""
        return self.call_log

    def clear_call_log(self) -> None:
        self.call_log = []

    @staticmethod
    def _scrub(args: dict) -> dict:
        return {
            k: "[REDACTED]" if any(s in k.lower() for s in ("token", "password", "secret", "auth", "key")) else v
            for k, v in args.items()
        }

    def scrub_arguments(self, args: dict) -> dict:
        return self._scrub(args)

    def dispatch(
        self,
        tool_name: Optional[str] = None,
        arguments: Optional[dict] = None,
        case_id: Optional[str] = None,
        run_id: str = "run_default",
        **kwargs,
    ) -> dict:
        """Dispatches an allowlisted MCP tool call with full audit provenance.

        Returns:
          {success, tool, case_id, status, latency_ms, timestamp, result, error}
        """
        t0 = time.perf_counter()
        timestamp = time.time()

        tool_name = tool_name or kwargs.get("tool_name", "")
        arguments = arguments if arguments is not None else kwargs.get("arguments", {})
        case_id = case_id or kwargs.get("case_id", "CASE_UNSPECIFIED")

        scrubbed_args = self._scrub(arguments)

        if tool_name not in ALLOWLISTED_TOOLS:
            err = f"Security Violation: Tool '{tool_name}' not in allowlisted MCP registry."
            logger.error(err)
            call = MCPToolCall(
                case_id=case_id, tool=tool_name, args_scrubbed=scrubbed_args,
                status="UNAUTHORIZED", latency_ms=0.0, timestamp=timestamp, error=err
            )
            self.call_log.append(call)
            return {"success": False, "error": err, "status": "UNAUTHORIZED",
                    "tool": tool_name, "case_id": case_id, "latency_ms": 0.0}

        status = "SUCCESS"
        result_data: Any = None
        error_msg: Optional[str] = None

        try:
            if tool_name in ("get_transaction_neighborhood", "query_neighborhood"):
                result_data = self.client.query_transaction_neighborhood(
                    arguments.get("txn_id", ""), depth=arguments.get("depth", 2)
                )
            elif tool_name == "get_transaction":
                result_data = self.client.get_transaction(arguments.get("txn_id", ""))
            elif tool_name == "get_customer":
                result_data = self.client.get_customer(arguments.get("customer_id", ""))
            elif tool_name == "detect_device_reuse":
                result_data = self.client.query_device_reuse(
                    arguments.get("device_id", ""), threshold=arguments.get("threshold", 2)
                )
            elif tool_name == "detect_ip_reuse":
                result_data = self.client.query_ip_reuse(
                    arguments.get("ip_address", ""), threshold=arguments.get("threshold", 2)
                )
            elif tool_name in ("check_shared_identity", "find_shared_entities"):
                result_data = self.client.query_shared_identity(
                    arguments.get("customer_id", arguments.get("entity_id", ""))
                )
            elif tool_name == "detect_patterns":
                from backend.app.patterns.engine import FraudPatternEngine
                result_data = [p.to_dict() for p in
                                FraudPatternEngine().evaluate_all(
                                    arguments.get("txn_id", ""),
                                    arguments.get("customer_id", "")
                                )]
            elif tool_name == "get_temporal_velocity":
                result_data = self.client.query_temporal_velocity(
                    arguments.get("account_id", ""),
                    window_seconds=arguments.get("window_seconds", 300)
                )
            elif tool_name == "find_similar_cases":
                result_data = self.client.query_similar_cases(
                    pattern_name=arguments.get("pattern_name", ""),
                    min_risk=arguments.get("min_risk", 0.50),
                    top_k=arguments.get("top_k", 5)
                )
            elif tool_name == "run_community_detection":
                result_data = self.client.run_community_detection(
                    max_iterations=arguments.get("max_iterations", 10)
                )
            elif tool_name == "query_centrality":
                result_data = self.client.query_centrality(top_k=arguments.get("top_k", 10))
            elif tool_name == "write_back_case":
                result_data = self.client.write_back_case(
                    case_id=arguments.get("case_id", case_id),
                    trigger_txn_id=arguments.get("trigger_txn_id", ""),
                    subject_customer_id=arguments.get("subject_customer_id", ""),
                    risk_score=arguments.get("risk_score", 0.0),
                    confidence=arguments.get("confidence", 0.0),
                    status=arguments.get("status", "RESOLVED"),
                    final_outcome=arguments.get("final_outcome"),
                    fraud_patterns=arguments.get("fraud_patterns"),
                    findings=arguments.get("findings"),
                    actions=arguments.get("actions"),
                )
        except Exception as e:
            status = "FAILURE"
            error_msg = str(e)
            result_data = {"error": error_msg}
            logger.error(f"MCP tool {tool_name} failed: {e}")

        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        import json as _json
        try:
            preview = _json.dumps(result_data)[:200] if result_data is not None else ""
        except Exception:
            preview = str(result_data)[:200]

        call = MCPToolCall(
            case_id=case_id,
            tool=tool_name,
            args_scrubbed=scrubbed_args,
            status=status,
            latency_ms=latency_ms,
            timestamp=timestamp,
            response_preview=preview,
            error=error_msg,
        )
        self.call_log.append(call)

        # Cryptographic audit record
        self.ledger.record_event(
            case_id=case_id,
            actor="TigerGraphMCP",
            event_type="MCP_TOOL_INVOKED",
            input_data={"tool": tool_name, "run_id": run_id,
                        "arguments": scrubbed_args, "latency_ms": latency_ms,
                        "status": status},
            decision=status,
            reason=f"{tool_name}: {status} in {latency_ms}ms",
            confidence=0.99,
        )

        return {
            "success": (status == "SUCCESS"),
            "tool": tool_name,
            "case_id": case_id,
            "run_id": run_id,
            "status": status,
            "latency_ms": latency_ms,
            "timestamp": timestamp,
            "result": result_data,
            "data": result_data,   # alias used by state_machine.py
            "error": error_msg,
        }


_GLOBAL_MCP_DISPATCHER: Optional[MCPToolDispatcher] = None


def get_mcp_dispatcher() -> MCPToolDispatcher:
    global _GLOBAL_MCP_DISPATCHER
    if _GLOBAL_MCP_DISPATCHER is None:
        _GLOBAL_MCP_DISPATCHER = MCPToolDispatcher()
    return _GLOBAL_MCP_DISPATCHER


def reset_mcp_dispatcher() -> None:
    global _GLOBAL_MCP_DISPATCHER
    _GLOBAL_MCP_DISPATCHER = None
