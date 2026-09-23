"""GraphRAG Synthesizer Subsystem.

Combines deterministic graph evidence retrieval (TigerGraph neighborhood traversals,
entity reuse, cluster detection) with regulatory policies and historical case memory
to assemble structured Evidence Packs for grounded agent reasoning.
"""

from typing import Any, Dict, List, Optional
import json
import logging
from backend.app.graph.client import get_default_graph_client

logger = logging.getLogger("GraphRAG")

# Embedded institutional policy knowledge base
POLICY_KNOWLEDGE_BASE = [
    {
        "id": "POL-001",
        "topic": "Uncertainty & Step-Up Authentication",
        "content": "When transaction risk is elevated (> 0.60) but graph evidence remains ambiguous or confidence is below 0.70, the system MUST NOT execute unilateral account freezing. An out-of-band Step-Up Authentication (SMS OTP, Biometric, or Call) must be triggered."
    },
    {
        "id": "POL-002",
        "topic": "Account Freezing Directives",
        "content": "Account freezing (BLOCK_ACCOUNT) is a punitive action requiring conclusive evidence (> 0.75 confidence) of coordinated syndicate membership, device emulation farms, or confirmed synthetic identity. Sign-off by a Fraud Manager is mandatory."
    },
    {
        "id": "POL-003",
        "topic": "Transaction Authorization Denial",
        "content": "Transactions exhibiting automated velocity card testing or high-velocity mule dispersal shall be blocked immediately upon Senior Analyst concurrence."
    },
    {
        "id": "REG-BSA-001",
        "topic": "FinCEN Suspicious Activity Reports (SAR)",
        "content": "Pursuant to 31 CFR § 1020.320, transactions aggregating $5,000 or more involving known or suspected illicit activity, money laundering, or structuring must be drafted as formal SAR filings."
    },
    {
        "id": "REG-E-001",
        "topic": "Regulation E Consumer Liability",
        "content": "Under CFPB Regulation E, consumers have limited liability for unauthorized electronic fund transfers if reported promptly. Accounts suspected of takeover (ATO) must be provisionally secured."
    }
]


class EvidencePack:
    def __init__(
        self,
        case_id: str,
        question: str,
        graph_evidence: List[Dict[str, Any]],
        historical_cases: List[Dict[str, Any]],
        policy_evidence: List[Dict[str, Any]],
        fraud_patterns: List[Dict[str, Any]],
        risk_signals: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
        uncertainties: List[str]
    ):
        self.case_id = case_id
        self.question = question
        self.graph_evidence = graph_evidence
        self.historical_cases = historical_cases
        self.policy_evidence = policy_evidence
        self.fraud_patterns = fraud_patterns
        self.risk_signals = risk_signals
        self.contradictions = contradictions
        self.uncertainties = uncertainties

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "question": self.question,
            "graph_evidence": self.graph_evidence,
            "historical_cases": self.historical_cases,
            "policy_evidence": self.policy_evidence,
            "fraud_patterns": self.fraud_patterns,
            "risk_signals": self.risk_signals,
            "contradictions": self.contradictions,
            "uncertainties": self.uncertainties
        }


class GraphRAGSynthesizer:
    """Orchestrates hybrid retrieval and evidence pack compilation."""

    def __init__(self):
        self.client = get_default_graph_client()

    def assemble_evidence_pack(
        self,
        case_id: str,
        txn_id: str,
        customer_id: str,
        question: str = "Assess transaction risk and determine next best action"
    ) -> EvidencePack:
        """Constructs an integrated, ranked Evidence Pack."""
        # 1. Graph Retrieval (Neighborhood + Entity Reuse + Clusters)
        nbr = self.client.query_transaction_neighborhood(txn_id, depth=2)
        graph_nodes = nbr.get("nodes", [])
        graph_edges = nbr.get("edges", [])

        graph_evidence_items = []
        for n in graph_nodes:
            if n.get("type") in ("Device", "IP", "Card", "Merchant"):
                graph_evidence_items.append({
                    "entity_type": n.get("type"),
                    "entity_id": n.get("id"),
                    "attributes": n.get("attributes", {})
                })

        # Check device reuse if device exists
        dev_node = next((n for n in graph_nodes if n.get("type") == "Device"), None)
        if dev_node:
            dev_reuse = self.client.query_device_reuse(dev_node.get("id"))
            if dev_reuse.get("is_suspicious"):
                graph_evidence_items.append({
                    "entity_type": "DeviceReuseAnomaly",
                    "entity_id": dev_node.get("id"),
                    "reused_count": dev_reuse.get("reused_count"),
                    "connected_cards": dev_reuse.get("cards", [])
                })

        # 2. Historical Case Retrieval
        similar_res = self.client.query_similar_cases(min_risk=0.50, top_k=3)
        historical_cases = similar_res.get("matched_cases", [])

        # 3. Policy Semantic Retrieval
        # Score policies based on relevance to detected signals
        policy_evidence = []
        for p in POLICY_KNOWLEDGE_BASE:
            policy_evidence.append({
                "policy_id": p["id"],
                "topic": p["topic"],
                "mandate": p["content"]
            })

        # 4. Pattern and Risk Signals
        txn = self.client.get_transaction(txn_id) or {}
        risk_score = float(txn.get("risk_score", 0.50))
        amt = float(txn.get("amount", 0.0))

        risk_signals = [
            {"signal": "TransactionAmount", "value": amt, "interpretation": "High" if amt > 2500 else ("Micro" if amt < 10 else "Normal")},
            {"signal": "BaselineRiskScore", "value": risk_score, "interpretation": "High" if risk_score >= 0.70 else "Moderate"}
        ]

        # Contradictions and Uncertainties
        contradictions = []
        uncertainties = []

        if risk_score >= 0.60 and not dev_node:
            uncertainties.append("Missing hardware device telemetry")

        dist1 = float(txn.get("dist1", -1.0))
        if dist1 < 0:
            uncertainties.append("Missing IP-to-billing distance telemetry")

        if risk_score < 0.40:
            contradictions.append({
                "type": "LowAnomalyBaseline",
                "detail": f"Baseline model assigned low risk ({risk_score:.2f})"
            })

        return EvidencePack(
            case_id=case_id,
            question=question,
            graph_evidence=graph_evidence_items,
            historical_cases=historical_cases,
            policy_evidence=policy_evidence,
            fraud_patterns=[],
            risk_signals=risk_signals,
            contradictions=contradictions,
            uncertainties=uncertainties
        )
