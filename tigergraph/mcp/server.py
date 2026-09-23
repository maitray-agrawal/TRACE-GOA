"""TigerGraph Model Context Protocol (MCP) Server for Fraud Investigation.

Exposes an allowlisted, schema-enforced tool registry to autonomous investigation
agents using the Model Context Protocol (MCP).
"""

from typing import Any, Dict, List, Optional
import os
import json
import logging
from fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TigerGraphMCP")

# Initialize FastMCP Server
mcp = FastMCP("TigerGraph-Fraud-MCP")

# Lazy import or fallback client to avoid circular dependencies
def get_graph_client():
    from backend.app.graph.client import get_default_graph_client
    return get_default_graph_client()


@mcp.tool(
    name="get_transaction",
    description="Retrieve full transactional details and immediate payment card/network attributes by Transaction ID."
)
def get_transaction(txn_id: str) -> Dict[str, Any]:
    """Fetches transaction entity details."""
    client = get_graph_client()
    res = client.get_transaction(txn_id)
    if not res:
        return {"error": f"Transaction {txn_id} not found", "found": False}
    return {"found": True, "transaction": res}


@mcp.tool(
    name="get_customer",
    description="Retrieve customer profile, risk tier, verified contact handles, and owned account IDs."
)
def get_customer(customer_id: str) -> Dict[str, Any]:
    """Fetches customer identity and account metadata."""
    client = get_graph_client()
    res = client.get_customer(customer_id)
    if not res:
        return {"error": f"Customer {customer_id} not found", "found": False}
    return {"found": True, "customer": res}


@mcp.tool(
    name="get_transaction_neighborhood",
    description="Traverse TigerGraph 2-hop ego network around a transaction, returning connected customer, card, device, IP, merchant, address, and related historical cases."
)
def get_transaction_neighborhood(txn_id: str, depth: int = 2) -> Dict[str, Any]:
    """Executes transaction_neighborhood GSQL query."""
    client = get_graph_client()
    return client.query_transaction_neighborhood(txn_id, depth=depth)


@mcp.tool(
    name="detect_device_reuse",
    description="Detect cross-account and multi-card reuse on a specific hardware device fingerprint."
)
def detect_device_reuse(device_id: str, threshold: int = 2) -> Dict[str, Any]:
    """Executes device_reuse_detection GSQL query."""
    client = get_graph_client()
    return client.query_device_reuse(device_id, threshold=threshold)


@mcp.tool(
    name="detect_ip_reuse",
    description="Detect cross-account activity and card testing patterns originating from an IP address or proxy subnet."
)
def detect_ip_reuse(ip_address: str, threshold: int = 2) -> Dict[str, Any]:
    """Executes ip_reuse_detection GSQL query."""
    client = get_graph_client()
    return client.query_ip_reuse(ip_address, threshold=threshold)


@mcp.tool(
    name="check_shared_identity",
    description="Detect synthetic identity rings by finding disparate customers sharing phones, emails, devices, or delivery addresses."
)
def check_shared_identity(customer_id: str) -> Dict[str, Any]:
    """Executes shared_identity_attributes GSQL query."""
    client = get_graph_client()
    return client.query_shared_identity(customer_id)


@mcp.tool(
    name="get_temporal_velocity",
    description="Analyze sliding window transaction counts, velocity bursts, and rapid fund dispersals for an account."
)
def get_temporal_velocity(account_id: str, window_seconds: int = 300) -> Dict[str, Any]:
    """Executes temporal_velocity_burst GSQL query."""
    client = get_graph_client()
    return client.query_temporal_velocity(account_id, window_seconds=window_seconds)


@mcp.tool(
    name="find_similar_cases",
    description="Find historical investigation cases with similar topological graph structures or matching fraud patterns."
)
def find_similar_cases(pattern_name: str = "", min_risk: float = 0.50, top_k: int = 5) -> Dict[str, Any]:
    """Executes similar_cases GSQL query."""
    client = get_graph_client()
    return client.query_similar_cases(pattern_name=pattern_name, min_risk=min_risk, top_k=top_k)


@mcp.tool(
    name="run_community_detection",
    description="Execute graph clustering (Weakly Connected Components / Louvain) to identify tightly coupled fraud syndicates."
)
def run_community_detection(max_iterations: int = 10) -> Dict[str, Any]:
    """Executes community_detection GSQL algorithm."""
    client = get_graph_client()
    return client.run_community_detection(max_iterations=max_iterations)


@mcp.tool(
    name="query_centrality",
    description="Calculate PageRank and Degree Centrality to identify high-volume money mule laundering hubs and account hubs."
)
def query_centrality(top_k: int = 10) -> Dict[str, Any]:
    """Executes centrality GSQL algorithm."""
    client = get_graph_client()
    return client.query_centrality(top_k=top_k)


@mcp.tool(
    name="write_back_case",
    description="Persist completed investigation findings, risk assessments, and identified typologies back to TigerGraph Case vertices and edges."
)
def write_back_case(
    case_id: str,
    trigger_txn_id: str,
    subject_customer_id: str,
    risk_score: float,
    confidence: float,
    status: str,
    final_outcome: Optional[str] = None,
    fraud_patterns: Optional[List[str]] = None,
    findings: Optional[List[str]] = None,
    actions: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Writes back case record to TigerGraph."""
    client = get_graph_client()
    return client.write_back_case(
        case_id=case_id,
        trigger_txn_id=trigger_txn_id,
        subject_customer_id=subject_customer_id,
        risk_score=risk_score,
        confidence=confidence,
        status=status,
        final_outcome=final_outcome,
        fraud_patterns=fraud_patterns,
        findings=findings,
        actions=actions
    )


if __name__ == "__main__":
    logger.info("Starting TigerGraph MCP Server over stdio...")
    mcp.run()

