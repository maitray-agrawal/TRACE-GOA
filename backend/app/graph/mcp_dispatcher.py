"""Auditable Model Context Protocol (MCP) Tool Dispatcher.

Enforces an allowlisted tool registry, scrubs sensitive credentials,
measures invocation latencies, and commits an auditable SHA-256 ledger record
for every graph operation invoked by autonomous agents.
"""

from typing import Any, Dict, List, Optional
import time
import logging
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
    "write_back_case"
}


class MCPToolDispatcher:
    """Audited dispatch layer for TigerGraph MCP tool invocations."""

    def __init__(self):
        self.client = get_default_graph_client()
        self.ledger = get_decision_ledger()

    def scrub_arguments(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures API keys, tokens, or PII passwords never leak to ledger logs."""
        scrubbed = {}
        for k, v in args.items():
            if any(s in k.lower() for s in ("token", "password", "secret", "auth", "key")):
                scrubbed[k] = "[REDACTED]"
            else:
                scrubbed[k] = v
        return scrubbed

    def dispatch(
        self,
        tool_name: Optional[str] = None,
        arguments: Optional[Dict[str, Any]] = None,
        case_id: Optional[str] = None,
        run_id: str = "run_default",
        **kwargs
    ) -> Dict[str, Any]:
        """Dispatches an allowlisted MCP tool call with full audit provenance."""
        start_time = time.perf_counter()
        timestamp = time.time()

        tool_name = tool_name or kwargs.get("tool_name", "")
        arguments = arguments if arguments is not None else kwargs.get("arguments", {})
        case_id = case_id or kwargs.get("case_id", "CASE_UNSPECIFIED")
        run_id = run_id or kwargs.get("run_id", "run_default")

        if tool_name not in ALLOWLISTED_TOOLS:
            err_msg = f"Security Violation: Tool '{tool_name}' is not in the allowlisted MCP registry."
            logger.error(err_msg)
            self.ledger.record_event(
                case_id=case_id,
                actor="MCPDispatcher",
                event_type="UNAUTHORIZED_TOOL_BLOCKED",
                input_data={"tool": tool_name, "arguments": self.scrub_arguments(arguments)},
                decision="BLOCKED",
                reason=err_msg,
                confidence=1.0
            )
            return {"success": False, "error": err_msg, "status": "UNAUTHORIZED"}

        # Route to underlying client method
        status = "SUCCESS"
        result_data: Any = None
        error_msg: Optional[str] = None

        try:
            if tool_name in ("get_transaction_neighborhood", "query_neighborhood"):
                result_data = self.client.query_transaction_neighborhood(
                    arguments.get("txn_id", ""),
                    depth=arguments.get("depth", 2)
                )
            elif tool_name == "get_transaction":
                result_data = self.client.get_transaction(arguments.get("txn_id", ""))
            elif tool_name == "get_customer":
                result_data = self.client.get_customer(arguments.get("customer_id", ""))
            elif tool_name == "detect_device_reuse":
                result_data = self.client.query_device_reuse(
                    arguments.get("device_id", ""),
                    threshold=arguments.get("threshold", 2)
                )
            elif tool_name == "detect_ip_reuse":
                result_data = self.client.query_ip_reuse(
                    arguments.get("ip_address", ""),
                    threshold=arguments.get("threshold", 2)
                )
            elif tool_name in ("check_shared_identity", "find_shared_entities"):
                result_data = self.client.query_shared_identity(
                    arguments.get("customer_id", arguments.get("entity_id", ""))
                )
            elif tool_name == "detect_patterns":
                from backend.app.patterns.engine import FraudPatternEngine
                pe = FraudPatternEngine()
                res_patterns = pe.evaluate_all(arguments.get("txn_id", ""), arguments.get("customer_id", ""))
                result_data = [p.to_dict() for p in res_patterns]
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
                    actions=arguments.get("actions")
                )
        except Exception as e:
            status = "FAILURE"
            error_msg = str(e)
            result_data = {"error": error_msg}
            logger.error(f"Error executing MCP tool {tool_name}: {e}")

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        summary = f"{tool_name} returned with status {status} in {latency_ms}ms"

        # Record cryptographically chained audit log
        self.ledger.record_event(
            case_id=case_id,
            actor="TigerGraphMCP",
            event_type="MCP_TOOL_INVOKED",
            input_data={
                "tool": tool_name,
                "run_id": run_id,
                "arguments": self.scrub_arguments(arguments),
                "latency_ms": latency_ms,
                "status": status
            },
            decision=status,
            reason=summary,
            confidence=0.99
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
            "error": error_msg
        }


# Global Singleton Dispatcher
_GLOBAL_MCP_DISPATCHER: Optional[MCPToolDispatcher] = None

def get_mcp_dispatcher() -> MCPToolDispatcher:
    global _GLOBAL_MCP_DISPATCHER
    if _GLOBAL_MCP_DISPATCHER is None:
        _GLOBAL_MCP_DISPATCHER = MCPToolDispatcher()
    return _GLOBAL_MCP_DISPATCHER
