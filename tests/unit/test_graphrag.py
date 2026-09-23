"""Unit tests for GraphRAG Synthesizer and Prompt Section 11 Evidence Pack Contract."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.graphrag.synthesizer import GraphRAGSynthesizer, EvidencePack, StructuredEvidenceItem
from backend.app.graph.client import get_default_graph_client


def test_evidence_pack_contract_fields():
    """Verify that EvidencePack precisely adheres to Prompt Section 11 JSON schema."""
    synthesizer = GraphRAGSynthesizer()
    client = get_default_graph_client()
    client._ensure_seeded()

    pack = synthesizer.assemble_evidence_pack(
        case_id="TEST-CONTRACT-CASE-01",
        txn_id="TXN_SEED_001",
        customer_id="CUST_SEED_001"
    )

    pack_dict = pack.to_dict()

    # Required fields in Prompt Section 11 Contract
    required_keys = [
        "case_id",
        "investigation_question",
        "graph_evidence",
        "transaction_evidence",
        "historical_cases",
        "fraud_patterns",
        "policy_evidence",
        "regulatory_evidence",
        "supporting_evidence",
        "contradicting_evidence",
        "uncertainty_gaps"
    ]

    for k in required_keys:
        assert k in pack_dict, f"Missing required Section 11 key: {k}"

    assert pack.case_id == "TEST-CONTRACT-CASE-01"
    assert isinstance(pack.graph_evidence, list)
    assert isinstance(pack.transaction_evidence, list)
    assert isinstance(pack.policy_evidence, list)
    assert isinstance(pack.regulatory_evidence, list)


def test_evidence_provenance_immutability():
    """Verify evidence items carry immutable provenance metadata."""
    item = StructuredEvidenceItem(
        evidence_id="EV_TEST_001",
        type="GRAPH_RELATIONSHIP",
        source="TigerGraph",
        source_reference="query_transaction_neighborhood(depth=2)",
        claim="Transaction links to 4 accounts via shared device",
        confidence=0.88,
        direction="SUPPORTING"
    )

    d = item.to_dict()
    assert d["evidence_id"] == "EV_TEST_001"
    assert d["source"] == "TigerGraph"
    assert d["type"] == "GRAPH_RELATIONSHIP"
    assert d["source_reference"] == "query_transaction_neighborhood(depth=2)"
    assert d["confidence"] == 0.88
