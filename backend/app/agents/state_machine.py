"""Stateful Fraud Investigation Agent.

Implements an explicit, observable state machine orchestrating:
1. Trigger Intake & Case Initialization
2. Graph Exploration via TigerGraph GSQL/MCP
3. Evidence Gathering & GraphRAG Synthesis
4. Deterministic Fraud Pattern Matching
5. Multi-Factor Risk & Confidence Scoring
6. Uncertainty Analysis & Additional Evidence Loop (Step-up Auth)
7. Reassessment
8. PolicyEngine Compliance & Next-Best Action Generation
9. Role-based Approval Routing
10. Action Execution & Tamper-Evident Ledger Hashing
11. Persistent Case Memory Indexing
"""

from typing import Any, Dict, List, Optional
import time
import logging
from backend.app.schemas.case import (
    CaseRecord, CaseStatus, ActionType, ApprovalRole,
    RecommendedAction, EvidenceItem
)
from backend.app.graph.client import get_default_graph_client
from backend.app.cases.service import get_case_service
from backend.app.audit.ledger import get_decision_ledger
from backend.app.patterns.engine import FraudPatternEngine
from backend.app.policy.engine import PolicyEngine, PolicyVerdict
from backend.app.actions.approval import ApprovalEngine
from backend.app.actions.sar import SARGenerator
from backend.app.graphrag.synthesizer import GraphRAGSynthesizer
from backend.app.memory.service import get_memory_service

logger = logging.getLogger("InvestigationAgent")


class InvestigationTimelineStep:
    def __init__(self, step_name: str, status: str, details: str, timestamp: Optional[float] = None):
        self.step_name = step_name
        self.status = status
        self.details = details
        self.timestamp = timestamp or time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_name": self.step_name,
            "status": self.status,
            "details": self.details,
            "timestamp": self.timestamp,
            "time_str": time.strftime("%H:%M:%S", time.localtime(self.timestamp))
        }


class FraudInvestigationAgent:
    """State machine controller for end-to-end fraud investigation."""

    def __init__(self):
        self.graph_client = get_default_graph_client()
        self.case_service = get_case_service()
        self.ledger = get_decision_ledger()
        self.pattern_engine = FraudPatternEngine()
        self.policy_engine = PolicyEngine()
        self.approval_engine = ApprovalEngine()
        self.graphrag = GraphRAGSynthesizer()
        self.memory = get_memory_service()

    def run_investigation(
        self,
        case_id: str,
        allow_evidence_step_up: bool = True,
        simulate_step_up_success: bool = True
    ) -> Dict[str, Any]:
        """Executes full investigation state machine for a case."""
        timeline: List[InvestigationTimelineStep] = []

        def log_step(name: str, details: str, status: str = "COMPLETED"):
            step = InvestigationTimelineStep(name, status, details)
            timeline.append(step)
            logger.info(f"[{case_id}] {name}: {details}")

        # 1. State: TRIGGER_INGEST & CASE_LOOKUP
        log_step("TRIGGER_INGEST", "Ingesting fraud signal trigger and initializing investigation docket")
        case = self.case_service.get_case(case_id)
        if not case:
            # Create if new
            case = self.case_service.create_case(case_id, f"TXN_{case_id}", f"CUST_{case_id}")

        case.status = CaseStatus.INVESTIGATING
        self.case_service.update_case(case, "Agent began active investigation")

        # 2. State: GRAPH_INVESTIGATION
        log_step("GRAPH_INVESTIGATION", f"Querying TigerGraph 2-hop neighborhood for transaction {case.trigger_txn_id}")
        nbr = self.graph_client.query_transaction_neighborhood(case.trigger_txn_id, depth=2)
        node_count = nbr.get("node_count", 0)
        edge_count = nbr.get("edge_count", 0)

        self.ledger.record_event(
            case_id=case_id,
            actor="Agent:GraphInvestigator",
            event_type="TIGERGRAPH_NEIGHBORHOOD_RETRIEVED",
            input_data={"txn_id": case.trigger_txn_id, "depth": 2},
            decision="EXPANDED_SUBGRAPH",
            reason=f"Retrieved {node_count} vertices and {edge_count} relationships from TigerGraph",
            confidence=0.50
        )

        # 3. State: EVIDENCE_COLLECTION & GRAPHRAG
        log_step("EVIDENCE_COLLECTION", "Synthesizing GraphRAG evidence pack from graph topologies and institutional policy")
        evidence_pack = self.graphrag.assemble_evidence_pack(
            case_id=case_id,
            txn_id=case.trigger_txn_id,
            customer_id=case.subject_customer_id
        )

        # 4. State: FRAUD_PATTERN_DETECTION
        log_step("FRAUD_PATTERN_DETECTION", "Evaluating 5 canonical fraud typologies against deterministic pattern engine")
        detected_patterns = self.pattern_engine.evaluate_all(case.trigger_txn_id, case.subject_customer_id)
        pattern_names = [p.name for p in detected_patterns]
        max_pattern_conf = max((p.confidence for p in detected_patterns), default=0.0)

        case.fraud_patterns = [p.pattern_id for p in detected_patterns]

        # Populate structured evidence items
        case.supporting_evidence = []
        case.contradicting_evidence = []
        for p in detected_patterns:
            for s in p.supporting_evidence:
                case.supporting_evidence.append(
                    EvidenceItem(id=f"EV_SUP_{len(case.supporting_evidence)+1}", source="GRAPH", direction="SUPPORTING", title=s, details=p.to_dict())
                )
            for c in p.contradicting_evidence:
                case.contradicting_evidence.append(
                    EvidenceItem(id=f"EV_CON_{len(case.contradicting_evidence)+1}", source="GRAPH", direction="CONTRADICTING", title=c, details=p.to_dict())
                )

        # 5. State: RISK_AND_CONFIDENCE_ASSESSMENT
        log_step("RISK_ASSESSMENT", "Calculating deterministic multi-factor risk and confidence scores")
        txn = self.graph_client.get_transaction(case.trigger_txn_id) or {}
        raw_risk = float(txn.get("risk_score", case.risk_score or 0.50))
        amt = float(txn.get("amount", 0.0))

        # Multi-factor confidence calculation
        # Factors: model risk, pattern confidence, graph edge density, completeness
        graph_density_score = min(1.0, edge_count / 8.0)
        completeness_score = 0.80 if node_count >= 4 else 0.40
        contradiction_penalty = 0.20 if len(case.contradicting_evidence) > 0 else 0.0

        computed_confidence = (
            0.25 * raw_risk +
            0.35 * max_pattern_conf +
            0.20 * graph_density_score +
            0.20 * completeness_score -
            contradiction_penalty
        )
        computed_confidence = round(max(0.10, min(0.98, computed_confidence)), 3)

        case.risk_score = raw_risk
        case.confidence = computed_confidence

        # 6. State: UNCERTAINTY_CHECK & ADDITIONAL_EVIDENCE_LOOP
        # If risk is elevated (> 0.60) but confidence is below threshold (< 0.70)
        requires_evidence = (raw_risk >= 0.60 and computed_confidence < 0.70) or (len(detected_patterns) == 0 and raw_risk >= 0.60)
        has_step_up_occurred = False

        if requires_evidence and allow_evidence_step_up:
            log_step("UNCERTAINTY_CHECK", f"Uncertainty detected: Risk={raw_risk:.2f}, Confidence={computed_confidence:.2f}. Insufficient evidence to justify unilateral freeze. Entering Additional Evidence Loop.")
            case.status = CaseStatus.AWAITING_EVIDENCE
            case.uncertainty_level = "HIGH"
            case.missing_evidence = [
                "Customer out-of-band biometric/OTP confirmation",
                "Secondary device location match"
            ]

            self.case_service.update_case(case, "Case paused awaiting out-of-band step-up authentication")
            self.ledger.record_event(
                case_id=case_id,
                actor="Agent:UncertaintyEngine",
                event_type="STEP_UP_AUTH_REQUESTED",
                input_data={"missing_signals": case.missing_evidence},
                decision="DISPATCH_STEP_UP_CHALLENGE",
                reason="High transaction risk but low graph confidence requires out-of-band verification",
                confidence=computed_confidence
            )

            # Simulated step-up response loop
            if simulate_step_up_success:
                log_step("EVIDENCE_PROCESSOR", "Simulated customer response received: Step-up authentication failed / OTP expired (Hostile / ATO Signal)")
                case.supporting_evidence.append(
                    EvidenceItem(
                        id=f"EV_STEPUP_{len(case.supporting_evidence)+1}",
                        source="EXTERNAL_STEP_UP",
                        direction="SUPPORTING",
                        title="Step-up OTP failed/unresponsive (Hostile Takeover Indicator)",
                        details={"status": "FAILED_TIMEOUT", "device_id": "UNKNOWN"}
                    )
                )
                # Reassessment: Confidence jumps significantly
                has_step_up_occurred = True
                computed_confidence = min(0.96, computed_confidence + 0.28)
                case.confidence = computed_confidence
                case.status = CaseStatus.REASSESSMENT
                case.uncertainty_level = "RESOLVED"
                log_step("REASSESSMENT", f"Confidence upgraded after step-up failure to {computed_confidence:.2f}")

        # 7. State: ACTION_PLANNER & POLICY_ENGINE
        log_step("ACTION_PLANNER", "Formulating prioritized Next-Best Action candidates against PolicyEngine")
        recommended_actions: List[RecommendedAction] = []

        # Determine target actions based on patterns and risk
        candidate_actions = []
        is_high_risk = case.risk_score >= 0.70 or max_pattern_conf >= 0.70
        is_high_confidence = case.confidence >= 0.65

        if case.risk_score < 0.40:
            candidate_actions.append(ActionType.ALLOW_TRANSACTION)
        elif is_high_risk and is_high_confidence:
            if "MULE_DISPERSAL" in case.fraud_patterns or amt >= 5000.0:
                candidate_actions.append(ActionType.FILE_REPORT)
                candidate_actions.append(ActionType.BLOCK_ACCOUNT)
            elif "DEVICE_FARM" in case.fraud_patterns or "CARD_TESTING" in case.fraud_patterns:
                candidate_actions.append(ActionType.BLOCK_TRANSACTION)
                candidate_actions.append(ActionType.BLOCK_ACCOUNT)
            elif "ATO_ADDRESS_LAUNDER" in case.fraud_patterns or "SYNTH_ID_SYNDICATE" in case.fraud_patterns:
                candidate_actions.append(ActionType.BLOCK_TRANSACTION)
                candidate_actions.append(ActionType.ESCALATE_TO_ANALYST)
            else:
                candidate_actions.append(ActionType.BLOCK_TRANSACTION)
        else:
            candidate_actions.append(ActionType.MONITOR_TRANSACTION)
            candidate_actions.append(ActionType.WARN_CUSTOMER)

        for act in candidate_actions:
            pol_eval = self.policy_engine.evaluate_action(
                action=act,
                risk_score=case.risk_score,
                confidence=case.confidence,
                amount=amt,
                patterns=case.fraud_patterns,
                has_verified_step_up=has_step_up_occurred
            )

            rec = RecommendedAction(
                action=act,
                priority="CRITICAL" if act in (ActionType.BLOCK_ACCOUNT, ActionType.FILE_REPORT) else "HIGH",
                confidence=case.confidence,
                reason=pol_eval.reason,
                supporting_evidence=[e.title for e in case.supporting_evidence[:3]],
                policy_basis=pol_eval.policy_rules,
                approval_required=(pol_eval.verdict == PolicyVerdict.ALLOWED_WITH_APPROVAL),
                approval_route=pol_eval.required_role,
                execution_status="PENDING"
            )
            recommended_actions.append(rec)

        case.recommended_actions = recommended_actions

        # 8. State: APPROVAL_CHECK & ACTION_EXECUTION
        # Determine case final routing
        primary_action = recommended_actions[0] if recommended_actions else None
        if primary_action and primary_action.approval_required:
            log_step("APPROVAL_CHECK", f"Primary action {primary_action.action.value} requires electronic approval from {primary_action.approval_route.value}")
            self.approval_engine.submit_for_approval(
                case_id=case_id,
                action=primary_action.action,
                required_role=primary_action.approval_route,
                reason=primary_action.reason
            )
            case.status = CaseStatus.AWAITING_APPROVAL
        elif primary_action:
            log_step("ACTION_EXECUTION", f"Executing mock action {primary_action.action.value} (No supervisor approval required)")
            primary_action.execution_status = "EXECUTED"
            case.executed_actions.append({
                "action": primary_action.action.value,
                "executed_at": time.time(),
                "status": "SUCCESS"
            })
            case.status = CaseStatus.RESOLVED

        # 9. State: SAR_GENERATION (If FILE_REPORT is recommended)
        sar_docket = None
        if any(a.action == ActionType.FILE_REPORT for a in recommended_actions):
            log_step("SAR_GENERATION", "FinCEN BSA threshold ($5,000) triggered. Assembling Suspicious Activity Report (SAR) draft.")
            sar_docket = SARGenerator.generate_sar(
                case=case,
                transactions=[txn]
            )

        # 10. State: MEMORY_WRITING & DECISION_LEDGER
        summary_text = (
            f"Investigation {case_id} concluded with risk {case.risk_score:.2f} and confidence {case.confidence:.2f}. "
            f"Patterns identified: {', '.join(pattern_names) or 'None'}. Primary recommendation: {primary_action.action.value if primary_action else 'None'}."
        )
        case.findings = [summary_text]
        for p in detected_patterns:
            case.findings.extend(p.supporting_evidence)

        self.memory.record_case_memory(
            case=case,
            summary=summary_text,
            analyst_outcome="CONFIRMED_FRAUD" if case.risk_score >= 0.70 else "CLEARED_FALSE_POSITIVE"
        )

        self.case_service.update_case(case, "Completed end-to-end agent investigation run")
        log_step("INVESTIGATION_COMPLETE", f"Investigation complete. Current status: {case.status.value}")

        return {
            "case": case.model_dump(),
            "timeline": [t.to_dict() for t in timeline],
            "evidence_pack": evidence_pack.to_dict(),
            "detected_patterns": [p.to_dict() for p in detected_patterns],
            "recommended_actions": [a.model_dump() for a in recommended_actions],
            "sar_docket": sar_docket,
            "ledger_verified": self.ledger.verify_case_ledger(case_id)["is_valid"]
        }
