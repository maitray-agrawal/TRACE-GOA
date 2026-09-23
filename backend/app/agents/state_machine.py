"""Stateful Fraud Investigation Agent.

Implements an explicit, observable 17-state finite state machine orchestrating:
1. TRIGGERED: Ingest trigger payload and initiate investigation
2. CASE_CREATED: Initialize and persist investigation case record
3. PLANNING: Formulate dynamic investigation tool plan based on trigger characteristics
4. INVESTIGATING: Execute planned graph operations via MCP Tool Dispatcher
5. EVIDENCE_COLLECTION: Synthesize GraphRAG evidence pack with immutable provenance
6. PATTERN_ANALYSIS: Evaluate canonical fraud typologies
7. RISK_ASSESSMENT: Compute deterministic multi-factor risk and confidence scores
8. UNCERTAINTY_ANALYSIS: Evaluate uncertainty gaps and assess need for step-up evidence
9. EVIDENCE_REQUIRED: Pause for out-of-band step-up authentication if uncertain
10. REASSESSMENT: Recalculate confidence and update uncertainty status on evidence receipt
11. ACTION_PLANNING: Prioritize Next-Best Action candidates
12. POLICY_CHECK: Evaluate candidate actions against institutional policy engine
13. APPROVAL_PENDING: Route restricted actions through RBAC approval engine
14. ACTION_EXECUTION: Execute authorized actions
15. CASE_UPDATE: Persist updated case state to database and write back to TigerGraph
16. MEMORY_UPDATE: Embed and index case summary into persistent vector memory
17. RESOLVED: Finalize case docket and verify decision ledger integrity
"""

from typing import Any, Dict, List, Optional
import time
import logging
from backend.app.schemas.case import (
    CaseRecord, CaseStatus, ActionType, ApprovalRole,
    RecommendedAction, EvidenceItem
)
from backend.app.graph.client import get_default_graph_client
from backend.app.graph.mcp_dispatcher import get_mcp_dispatcher
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
    """Timeline entry tracking state transitions, audit steps, and durations."""

    def __init__(
        self,
        step_name: str,
        status: str,
        details: str,
        timestamp: Optional[float] = None,
        state: Optional[str] = None,
        tool_call: Optional[Dict[str, Any]] = None
    ):
        self.step_name = step_name
        self.status = status
        self.details = details
        self.timestamp = timestamp or time.time()
        self.state = state or step_name
        self.tool_call = tool_call

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_name": self.step_name,
            "status": self.status,
            "details": self.details,
            "state": self.state,
            "timestamp": self.timestamp,
            "time_str": time.strftime("%H:%M:%S", time.localtime(self.timestamp)),
            "tool_call": self.tool_call
        }


class FraudInvestigationAgent:
    """Explicit 17-state finite state machine controller for end-to-end fraud investigation."""

    def __init__(self):
        self.graph_client = get_default_graph_client()
        self.mcp_dispatcher = get_mcp_dispatcher()
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
        """Executes full 17-state investigation state machine for a case."""
        timeline: List[InvestigationTimelineStep] = []

        def log_step(name: str, details: str, status: str = "COMPLETED", state: Optional[str] = None, tool_call: Optional[Dict[str, Any]] = None):
            step = InvestigationTimelineStep(name, status, details, state=state, tool_call=tool_call)
            timeline.append(step)
            logger.info(f"[{case_id}] {name} ({state or name}): {details}")

        # State 1: TRIGGERED
        current_state = CaseStatus.TRIGGERED
        log_step(
            "TRIGGER_INGEST",
            "Ingesting fraud signal trigger and initiating investigation pipeline",
            state=current_state.value
        )
        self.ledger.record_event(
            case_id=case_id,
            actor="Agent:TriggerIntake",
            event_type="INVESTIGATION_TRIGGERED",
            input_data={"case_id": case_id},
            decision="ACCEPT_TRIGGER",
            reason="Fraud signal received and validated for investigation",
            confidence=0.50
        )

        # State 2: CASE_CREATED
        current_state = CaseStatus.CASE_CREATED
        log_step(
            "CASE_CREATION",
            "Initializing and persisting case docket",
            state=current_state.value
        )
        case = self.case_service.get_case(case_id)
        if not case:
            case = self.case_service.create_case(case_id, f"TXN_{case_id}", f"CUST_{case_id}")

        case.status = CaseStatus.CASE_CREATED
        self.case_service.update_case(case, "Case created and initialized")

        # State 3: PLANNING
        current_state = CaseStatus.PLANNING
        txn_record = self.graph_client.get_transaction(case.trigger_txn_id) or {}
        txn_amount = float(txn_record.get("amount", 0.0))
        initial_risk = float(txn_record.get("risk_score", case.risk_score or 0.50))

        # Dynamic tool selection planner based on case characteristics
        planned_tools = ["query_neighborhood"]
        if txn_amount >= 5000.0 or initial_risk >= 0.70:
            planned_tools.append("query_centrality")
        if case.subject_customer_id:
            planned_tools.append("find_shared_entities")
        planned_tools.append("detect_patterns")

        log_step(
            "INVESTIGATION_PLANNING",
            f"Formulated dynamic tool execution plan: {', '.join(planned_tools)} (Amount=${txn_amount:.2f}, Risk={initial_risk:.2f})",
            state=current_state.value
        )
        case.status = CaseStatus.PLANNING

        # State 4: INVESTIGATING
        current_state = CaseStatus.INVESTIGATING
        case.status = CaseStatus.INVESTIGATING
        self.case_service.update_case(case, "Agent executing planned graph investigation")

        nbr_res = self.mcp_dispatcher.dispatch(
            case_id=case_id,
            tool_name="query_neighborhood",
            arguments={"txn_id": case.trigger_txn_id, "depth": 2}
        )
        nbr = nbr_res.get("data", {}) if nbr_res.get("success") else {}
        node_count = nbr.get("node_count", 0)
        edge_count = nbr.get("edge_count", 0)

        log_step(
            "GRAPH_INVESTIGATION",
            f"Executed TigerGraph 2-hop neighborhood expansion ({node_count} nodes, {edge_count} edges)",
            state=current_state.value,
            tool_call={"tool": "query_neighborhood", "node_count": node_count, "edge_count": edge_count}
        )

        # Execute auxiliary planned tools
        if "query_centrality" in planned_tools:
            cent_res = self.mcp_dispatcher.dispatch(
                case_id=case_id,
                tool_name="query_centrality",
                arguments={"graph_name": "FraudGraph"}
            )
            log_step(
                "CENTRALITY_ANALYSIS",
                "Calculated graph centrality metrics for systemic fraud hub identification",
                state=current_state.value,
                tool_call={"tool": "query_centrality", "status": cent_res.get("status")}
            )

        if "find_shared_entities" in planned_tools:
            shared_res = self.mcp_dispatcher.dispatch(
                case_id=case_id,
                tool_name="find_shared_entities",
                arguments={"entity_id": case.subject_customer_id, "entity_type": "Customer"}
            )
            log_step(
                "SHARED_ENTITY_ANALYSIS",
                "Queried multi-hop shared device/IP linkage",
                state=current_state.value,
                tool_call={"tool": "find_shared_entities", "status": shared_res.get("status")}
            )

        # State 5: EVIDENCE_COLLECTION
        current_state = CaseStatus.EVIDENCE_COLLECTION
        case.status = CaseStatus.EVIDENCE_COLLECTION
        log_step(
            "EVIDENCE_COLLECTION",
            "Synthesizing GraphRAG evidence pack from graph topologies and institutional policy",
            state=current_state.value
        )
        evidence_pack = self.graphrag.assemble_evidence_pack(
            case_id=case_id,
            txn_id=case.trigger_txn_id,
            customer_id=case.subject_customer_id
        )

        # State 6: PATTERN_ANALYSIS
        current_state = CaseStatus.PATTERN_ANALYSIS
        case.status = CaseStatus.PATTERN_ANALYSIS
        log_step(
            "FRAUD_PATTERN_DETECTION",
            "Evaluating 5 canonical fraud typologies against deterministic pattern engine",
            state=current_state.value
        )
        detected_patterns = self.pattern_engine.evaluate_all(case.trigger_txn_id, case.subject_customer_id)
        pattern_names = [p.name for p in detected_patterns]
        max_pattern_conf = max((p.confidence for p in detected_patterns), default=0.0)

        case.fraud_patterns = [p.pattern_id for p in detected_patterns]

        # Populate structured evidence items with provenance
        case.supporting_evidence = []
        case.contradicting_evidence = []
        for p in detected_patterns:
            for s in p.supporting_evidence:
                case.supporting_evidence.append(
                    EvidenceItem(
                        id=f"EV_SUP_{len(case.supporting_evidence)+1}",
                        source="GRAPH",
                        direction="SUPPORTING",
                        title=s,
                        details=p.to_dict()
                    )
                )
            for c in p.contradicting_evidence:
                case.contradicting_evidence.append(
                    EvidenceItem(
                        id=f"EV_CON_{len(case.contradicting_evidence)+1}",
                        source="GRAPH",
                        direction="CONTRADICTING",
                        title=c,
                        details=p.to_dict()
                    )
                )

        # State 7: RISK_ASSESSMENT
        current_state = CaseStatus.RISK_ASSESSMENT
        case.status = CaseStatus.RISK_ASSESSMENT
        log_step(
            "RISK_ASSESSMENT",
            "Calculating deterministic multi-factor risk and confidence scores",
            state=current_state.value
        )
        txn = self.graph_client.get_transaction(case.trigger_txn_id) or {}
        raw_risk = float(txn.get("risk_score", case.risk_score or 0.50))
        amt = float(txn.get("amount", 0.0))

        # Multi-factor confidence calculation
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

        # State 8: UNCERTAINTY_ANALYSIS
        current_state = CaseStatus.UNCERTAINTY_ANALYSIS
        case.status = CaseStatus.UNCERTAINTY_ANALYSIS
        requires_evidence = (raw_risk >= 0.60 and computed_confidence < 0.70) or (len(detected_patterns) == 0 and raw_risk >= 0.60)
        has_step_up_occurred = False

        log_step(
            "UNCERTAINTY_CHECK",
            f"Evaluated uncertainty gaps: Risk={raw_risk:.2f}, Confidence={computed_confidence:.2f}, Gap={requires_evidence}",
            state=current_state.value
        )

        # State 9: EVIDENCE_REQUIRED (Conditional)
        if requires_evidence and allow_evidence_step_up:
            current_state = CaseStatus.EVIDENCE_REQUIRED
            case.status = CaseStatus.EVIDENCE_REQUIRED
            case.uncertainty_level = "HIGH"
            case.missing_evidence = [
                "Customer out-of-band biometric/OTP confirmation",
                "Secondary device location match"
            ]

            log_step(
                "EVIDENCE_REQUIRED",
                "Uncertainty detected: Insufficient evidence to justify unilateral freeze. Dispatching step-up challenge.",
                state=current_state.value
            )
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

            # State 10: REASSESSMENT (Conditional)
            if simulate_step_up_success:
                current_state = CaseStatus.REASSESSMENT
                case.status = CaseStatus.REASSESSMENT
                log_step(
                    "REASSESSMENT",
                    "Customer response received: Step-up authentication failed / OTP expired (Hostile / ATO Signal)",
                    state=current_state.value
                )
                case.supporting_evidence.append(
                    EvidenceItem(
                        id=f"EV_STEPUP_{len(case.supporting_evidence)+1}",
                        source="EXTERNAL_STEP_UP",
                        direction="SUPPORTING",
                        title="Step-up OTP failed/unresponsive (Hostile Takeover Indicator)",
                        details={"status": "FAILED_TIMEOUT", "device_id": "UNKNOWN"}
                    )
                )
                has_step_up_occurred = True
                computed_confidence = min(0.96, computed_confidence + 0.28)
                case.confidence = computed_confidence
                case.uncertainty_level = "RESOLVED"
                log_step(
                    "REASSESSMENT_UPGRADE",
                    f"Confidence upgraded after step-up failure to {computed_confidence:.2f}",
                    state=current_state.value
                )

        # State 11: ACTION_PLANNING
        current_state = CaseStatus.ACTION_PLANNING
        case.status = CaseStatus.ACTION_PLANNING
        log_step(
            "ACTION_PLANNER",
            "Formulating prioritized Next-Best Action candidates against PolicyEngine",
            state=current_state.value
        )
        candidate_actions: List[ActionType] = []
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

        # State 12: POLICY_CHECK
        current_state = CaseStatus.POLICY_CHECK
        case.status = CaseStatus.POLICY_CHECK
        log_step(
            "POLICY_CHECK",
            f"Evaluating {len(candidate_actions)} candidate actions against PolicyEngine rules",
            state=current_state.value
        )
        recommended_actions: List[RecommendedAction] = []
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
        primary_action = recommended_actions[0] if recommended_actions else None

        # State 13: APPROVAL_PENDING or State 14: ACTION_EXECUTION
        if primary_action and primary_action.approval_required:
            current_state = CaseStatus.APPROVAL_PENDING
            case.status = CaseStatus.APPROVAL_PENDING
            log_step(
                "APPROVAL_CHECK",
                f"Primary action {primary_action.action.value} requires clearance from {primary_action.approval_route.value}",
                state=current_state.value
            )
            self.approval_engine.submit_for_approval(
                case_id=case_id,
                action=primary_action.action,
                required_role=primary_action.approval_route,
                reason=primary_action.reason
            )
        elif primary_action:
            current_state = CaseStatus.ACTION_EXECUTION
            case.status = CaseStatus.ACTION_EXECUTION
            log_step(
                "ACTION_EXECUTION",
                f"Executing authorized action {primary_action.action.value} (No supervisor approval required)",
                state=current_state.value
            )
            primary_action.execution_status = "EXECUTED"
            case.executed_actions.append({
                "action": primary_action.action.value,
                "executed_at": time.time(),
                "status": "SUCCESS"
            })

        # SAR generation if regulatory reporting is triggered
        sar_docket = None
        if any(a.action == ActionType.FILE_REPORT for a in recommended_actions):
            log_step(
                "SAR_GENERATION",
                "FinCEN BSA threshold ($5,000) triggered. Assembling Suspicious Activity Report (SAR) draft.",
                state="SAR_GENERATION"
            )
            sar_docket = SARGenerator.generate_sar(
                case=case,
                transactions=[txn]
            )

        # State 15: CASE_UPDATE (Database update and TigerGraph case write-back)
        current_state = CaseStatus.CASE_UPDATE
        case.status = CaseStatus.CASE_UPDATE
        summary_text = (
            f"Investigation {case_id} concluded with risk {case.risk_score:.2f} and confidence {case.confidence:.2f}. "
            f"Patterns identified: {', '.join(pattern_names) or 'None'}. Primary recommendation: {primary_action.action.value if primary_action else 'None'}."
        )
        case.findings = [summary_text]
        for p in detected_patterns:
            case.findings.extend(p.supporting_evidence)

        # Persist to local database
        self.case_service.update_case(case, "Persisting case updates and findings")

        # Write-back to TigerGraph
        write_back_payload = {
            "case_id": case_id,
            "status": case.status.value,
            "risk_score": case.risk_score,
            "confidence": case.confidence,
            "subject_customer_id": case.subject_customer_id,
            "trigger_txn_id": case.trigger_txn_id,
            "fraud_patterns": case.fraud_patterns,
            "findings": case.findings,
            "executed_actions": case.executed_actions,
            "recommended_actions": [a.model_dump() for a in case.recommended_actions]
        }
        wb_res = self.graph_client.write_back_case(write_back_payload)
        log_step(
            "TIGERGRAPH_WRITE_BACK",
            f"Wrote case docket and entity relationships back to TigerGraph: status={wb_res.get('status', 'OK')}",
            state=current_state.value
        )

        # State 16: MEMORY_UPDATE
        current_state = CaseStatus.MEMORY_UPDATE
        case.status = CaseStatus.MEMORY_UPDATE
        log_step(
            "MEMORY_UPDATE",
            "Indexing case findings and embedding into persistent case memory",
            state=current_state.value
        )
        self.memory.record_case_memory(
            case=case,
            summary=summary_text,
            analyst_outcome="CONFIRMED_FRAUD" if case.risk_score >= 0.70 else "CLEARED_FALSE_POSITIVE"
        )

        # State 17: RESOLVED (or APPROVAL_PENDING if clearance needed)
        if primary_action and primary_action.approval_required:
            case.status = CaseStatus.APPROVAL_PENDING
        else:
            case.status = CaseStatus.RESOLVED

        current_state = case.status
        self.case_service.update_case(case, f"Investigation complete. Case final status: {case.status.value}")
        log_step(
            "INVESTIGATION_COMPLETE",
            f"Investigation pipeline finished. Final status: {case.status.value}",
            state=current_state.value
        )

        return {
            "case": case.model_dump(),
            "timeline": [t.to_dict() for t in timeline],
            "evidence_pack": evidence_pack.to_dict(),
            "detected_patterns": [p.to_dict() for p in detected_patterns],
            "recommended_actions": [a.model_dump() for a in recommended_actions],
            "sar_docket": sar_docket,
            "ledger_verified": self.ledger.verify_case_ledger(case_id)["is_valid"]
        }
