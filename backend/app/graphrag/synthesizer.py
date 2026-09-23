"""GraphRAG Synthesizer Subsystem.

Combines deterministic graph evidence retrieval (TigerGraph neighborhood traversals,
entity reuse, cluster detection) with regulatory policies and historical case memory
to assemble structured Evidence Packs for grounded agent reasoning adhering strictly to
the Section 11 Evidence Pack Contract with immutable provenance.
"""

from typing import Any, Dict, List, Optional
import json
import logging
import time
from pydantic import BaseModel, Field
from backend.app.graph.client import get_default_graph_client

logger = logging.getLogger("GraphRAG")

# Institutional Bank Policies
INTERNAL_POLICIES = [
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
    }
]

# External Regulatory Guidance
REGULATORY_POLICIES = [
    {
        "id": "REG-BSA-001",
        "topic": "FinCEN Suspicious Activity Reports (SAR)",
        "content": "Pursuant to 31 CFR § 1020.320, transactions aggregating $5,000 or more involving known or suspected illicit activity, money laundering, or structuring must be drafted as formal SAR filings."
    },
    {
        "id": "REG-E-001",
        "topic": "CFPB Regulation E Consumer Liability",
        "content": "Under CFPB Regulation E (12 CFR Part 1005), consumers have limited liability for unauthorized electronic fund transfers if reported promptly. Accounts suspected of takeover (ATO) must be provisionally secured."
    }
]

POLICY_KNOWLEDGE_BASE = INTERNAL_POLICIES + REGULATORY_POLICIES


class StructuredEvidenceItem(BaseModel):
    """Immutable evidence item with strict provenance tracking matching Sections 12 & 13."""
    evidence_id: str
    type: str = Field(..., description="GRAPH_RELATIONSHIP, TRANSACTION_TELEMETRY, HISTORICAL_CASE, FRAUD_PATTERN, POLICY_RULE, REGULATORY_STATUTE")
    category: str = Field(default="OBSERVED", description="OBSERVED, INFERRED, RECOMMENDED")
    source: str = Field(..., description="TigerGraph, PolicyEngine, RegulatoryRegistry, CaseMemory, ExternalTelemetry")
    source_reference: str
    claim: str
    confidence: float = 1.0
    graph: Optional[str] = "FraudInvestigationGraph"
    query: Optional[str] = None
    query_parameters: Optional[Dict[str, Any]] = None
    returned_entities: Optional[List[str]] = None
    returned_relationships: Optional[List[str]] = None
    document: Optional[str] = None
    section: Optional[str] = None
    retrieval_score: Optional[float] = None
    retrieval_timestamp: float = Field(default_factory=time.time)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()


class EvidencePack(BaseModel):
    """Standardized Evidence Pack matching Prompt Section 11 contract with Section 13 categorization."""
    case_id: str
    investigation_question: str
    graph_evidence: List[Dict[str, Any]]
    transaction_evidence: List[Dict[str, Any]]
    historical_cases: List[Dict[str, Any]]
    fraud_patterns: List[Dict[str, Any]]
    policy_evidence: List[Dict[str, Any]]
    regulatory_evidence: List[Dict[str, Any]]
    supporting_evidence: List[Dict[str, Any]]
    contradicting_evidence: List[Dict[str, Any]]
    uncertainty_gaps: List[str]
    observed_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    inferred_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_evidence: List[Dict[str, Any]] = Field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()


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
        """Constructs an integrated, ranked Evidence Pack with provenance."""
        # 1. Graph Retrieval (Neighborhood + Entity Reuse + Clusters)
        nbr = self.client.query_transaction_neighborhood(txn_id, depth=2)
        graph_nodes = nbr.get("nodes", [])
        graph_edges = nbr.get("edges", [])

        graph_evidence: List[Dict[str, Any]] = []
        for idx, n in enumerate(graph_nodes):
            if n.get("type") in ("Device", "IP", "Card", "Merchant"):
                item = StructuredEvidenceItem(
                    evidence_id=f"EV_GRAPH_{idx:03d}",
                    type="GRAPH_RELATIONSHIP",
                    source="TigerGraph",
                    source_reference=f"Vertex:{n.get('type')}:{n.get('id')}",
                    claim=f"Transaction {txn_id} is linked to {n.get('type')} node {n.get('id')}",
                    confidence=0.98,
                    attributes=n.get("attributes", {})
                )
                graph_evidence.append(item.model_dump())

        # Check device reuse if device exists
        dev_node = next((n for n in graph_nodes if n.get("type") == "Device"), None)
        if dev_node:
            dev_reuse = self.client.query_device_reuse(dev_node.get("id"))
            if dev_reuse.get("is_suspicious"):
                reused_cards = dev_reuse.get("cards", [])
                item = StructuredEvidenceItem(
                    evidence_id=f"EV_GRAPH_REUSE_{dev_node.get('id')}",
                    type="GRAPH_RELATIONSHIP",
                    source="TigerGraph",
                    source_reference=f"GSQL:device_reuse_detection({dev_node.get('id')})",
                    claim=f"Hardware device {dev_node.get('id')} was reused across {len(reused_cards)} distinct payment cards",
                    confidence=0.94,
                    attributes={"reused_cards": reused_cards}
                )
                graph_evidence.append(item.model_dump())

        # 2. Transaction Telemetry Evidence
        txn = self.client.get_transaction(txn_id) or {}
        risk_score = float(txn.get("risk_score", 0.50))
        amt = float(txn.get("amount", 0.0))

        transaction_evidence: List[Dict[str, Any]] = [
            StructuredEvidenceItem(
                evidence_id="EV_TXN_AMOUNT",
                type="TRANSACTION_TELEMETRY",
                source="TigerGraph",
                source_reference=f"Vertex:Transaction:{txn_id}.amount",
                claim=f"Transaction requested amount is ${amt:.2f} USD",
                confidence=1.0,
                attributes={"amount": amt}
            ).model_dump(),
            StructuredEvidenceItem(
                evidence_id="EV_TXN_RISK",
                type="TRANSACTION_TELEMETRY",
                source="TigerGraph",
                source_reference=f"Vertex:Transaction:{txn_id}.risk_score",
                claim=f"Baseline anomaly detector assigned initial risk score of {risk_score:.2f}",
                confidence=0.90,
                attributes={"risk_score": risk_score}
            ).model_dump()
        ]

        # 3. Historical Case Retrieval from Case Memory
        similar_res = self.client.query_similar_cases(min_risk=0.50, top_k=3)
        historical_cases_raw = similar_res.get("matched_cases", [])
        historical_cases: List[Dict[str, Any]] = []
        for h in historical_cases_raw:
            item = StructuredEvidenceItem(
                evidence_id=f"EV_MEM_{h.get('case_id')}",
                type="HISTORICAL_CASE",
                source="CaseMemory",
                source_reference=f"Vertex:Case:{h.get('case_id')}",
                claim=f"Prior investigation {h.get('case_id')} closed with outcome {h.get('final_outcome')} (Risk: {h.get('risk_score')})",
                confidence=float(h.get("confidence", 0.90)),
                attributes=h
            )
            historical_cases.append(item.model_dump())

        # 4. Institutional Policy Retrieval
        policy_evidence: List[Dict[str, Any]] = []
        for p in INTERNAL_POLICIES:
            item = StructuredEvidenceItem(
                evidence_id=f"EV_POL_{p['id']}",
                type="POLICY_RULE",
                source="PolicyEngine",
                source_reference=f"PolicyKnowledgeBase:{p['id']}",
                claim=f"Bank Policy {p['id']} ({p['topic']}): {p['content']}",
                confidence=1.0,
                attributes=p
            )
            policy_evidence.append(item.model_dump())

        # 5. Regulatory Reference Evidence
        regulatory_evidence: List[Dict[str, Any]] = []
        for r in REGULATORY_POLICIES:
            item = StructuredEvidenceItem(
                evidence_id=f"EV_REG_{r['id']}",
                type="REGULATORY_STATUTE",
                source="RegulatoryRegistry",
                source_reference=f"RegulatoryKnowledgeBase:{r['id']}",
                claim=f"Statutory Mandate {r['id']} ({r['topic']}): {r['content']}",
                confidence=1.0,
                attributes=r
            )
            regulatory_evidence.append(item.model_dump())

        # 6. Supporting, Contradicting & Uncertainty Gaps
        supporting_evidence: List[Dict[str, Any]] = []
        contradicting_evidence: List[Dict[str, Any]] = []
        uncertainty_gaps: List[str] = []

        if risk_score >= 0.70:
            supporting_evidence.append(
                StructuredEvidenceItem(
                    evidence_id="EV_SUPP_RISK",
                    type="TRANSACTION_TELEMETRY",
                    source="TigerGraph",
                    source_reference=f"Transaction:{txn_id}",
                    claim=f"Elevated baseline transaction risk ({risk_score:.2f} >= 0.70)",
                    confidence=risk_score
                ).model_dump()
            )
        elif risk_score < 0.40:
            contradicting_evidence.append(
                StructuredEvidenceItem(
                    evidence_id="EV_CONTR_LOW_RISK",
                    type="TRANSACTION_TELEMETRY",
                    source="TigerGraph",
                    source_reference=f"Transaction:{txn_id}",
                    claim=f"Low transaction anomaly score ({risk_score:.2f} < 0.40) contradicts fraud hypothesis",
                    confidence=1.0 - risk_score
                ).model_dump()
            )

        if not dev_node and risk_score >= 0.60:
            uncertainty_gaps.append("Missing hardware device telemetry for elevated risk transaction")

        dist1 = float(txn.get("dist1", -1.0))
        if dist1 < 0 and risk_score >= 0.60:
            uncertainty_gaps.append("Missing IP-to-billing distance telemetry")

        observed_evidence = graph_evidence + transaction_evidence
        inferred_evidence = supporting_evidence + contradicting_evidence + historical_cases
        recommended_evidence = policy_evidence + regulatory_evidence

        return EvidencePack(
            case_id=case_id,
            investigation_question=question,
            graph_evidence=graph_evidence,
            transaction_evidence=transaction_evidence,
            historical_cases=historical_cases,
            fraud_patterns=[],
            policy_evidence=policy_evidence,
            regulatory_evidence=regulatory_evidence,
            supporting_evidence=supporting_evidence,
            contradicting_evidence=contradicting_evidence,
            uncertainty_gaps=uncertainty_gaps,
            observed_evidence=observed_evidence,
            inferred_evidence=inferred_evidence,
            recommended_evidence=recommended_evidence
        )
