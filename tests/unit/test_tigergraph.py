"""Unit tests for TigerGraph client, GSQL queries, algorithms, and case write-back."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.graph.client import get_default_graph_client, InMemoryTigerGraphSimulator


def test_tigergraph_connection_and_seeding():
    client = get_default_graph_client()
    assert client is not None
    # Verify graph contains vertices
    if isinstance(client, InMemoryTigerGraphSimulator):
        client._ensure_seeded()
        assert len(client.vertices) > 0
        assert len(client.graph.nodes) > 0


def test_tigergraph_neighborhood_expansion():
    client = get_default_graph_client()
    client._ensure_seeded()

    # Query transaction neighborhood
    # Use first available transaction
    txn_id = None
    for k in client.vertices:
        if k.startswith("Transaction_"):
            txn_id = client.vertices[k]["id"]
            break

    assert txn_id is not None
    nbr = client.query_transaction_neighborhood(txn_id, depth=2)
    assert "node_count" in nbr
    assert "edge_count" in nbr
    assert "nodes" in nbr
    assert "edges" in nbr
    assert nbr["node_count"] >= 1


def test_tigergraph_centrality():
    client = get_default_graph_client()
    client._ensure_seeded()

    res = client.query_centrality(top_k=5)
    assert "Centrality" in res["algorithm"] or res["algorithm"] in ("DegreeCentrality", "PageRank")
    assert "top_entities" in res or "top_central_nodes" in res
    nodes = res.get("top_entities", res.get("top_central_nodes", []))
    assert len(nodes) <= 5
    for item in nodes:
        assert "entity_id" in item or "node" in item


def test_tigergraph_case_write_back():
    client = get_default_graph_client()
    client._ensure_seeded()

    case_id = "TEST-WRITEBACK-001"
    txn_id = "TXN_WB_001"
    cust_id = "CUST_WB_001"

    wb_res = client.write_back_case(
        case_id=case_id,
        trigger_txn_id=txn_id,
        subject_customer_id=cust_id,
        risk_score=0.88,
        confidence=0.91,
        status="RESOLVED",
        final_outcome="CONFIRMED_FRAUD",
        fraud_patterns=["DEVICE_FARM"],
        findings=["High-velocity device reuse detected across 5 accounts"],
        actions=[{"action": "BLOCK_ACCOUNT", "status": "SUCCESS"}]
    )

    assert wb_res["success"] is True
    assert wb_res["case_id"] == case_id

    # Verify vertex and edges exist in graph
    if isinstance(client, InMemoryTigerGraphSimulator):
        case_node = f"Case_{case_id}"
        assert case_node in client.graph.nodes
        node_data = client.vertices.get(case_node, {})
        assert node_data.get("risk_score") == 0.88
        assert node_data.get("final_outcome") == "CONFIRMED_FRAUD"
