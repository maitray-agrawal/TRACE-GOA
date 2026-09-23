"""20-Case Benchmark Pipeline for Hackathon Submission.

Executes all 20 benchmark investigation cases through the agent state machine,
evaluating investigation accuracy, pattern detection, uncertainty handling, policy compliance,
and generates standardized output bundles:
outputs/case_XX/
  ├── case.json
  ├── investigation.json
  ├── evidence.json
  ├── decision.json
  ├── actions.json
  ├── ledger.json
  └── sar.json (when required)
"""

from typing import Any, Dict, List
import os
import sys
import json
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from scripts.ingest.generate_seed_dataset import build_and_seed_dataset
from backend.app.agents.state_machine import FraudInvestigationAgent
from backend.app.cases.service import get_case_service
from backend.app.audit.ledger import get_decision_ledger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BenchmarkRunner")


def run_all_benchmarks(output_base: str = "outputs") -> Dict[str, Any]:
    """Processes all 20 benchmark test cases and saves complete submission dockets."""
    logger.info("Initializing 20-Case Benchmark Execution...")
    build_and_seed_dataset()

    agent = FraudInvestigationAgent()
    case_svc = get_case_service()
    ledger_svc = get_decision_ledger()

    results_summary = []

    for idx in range(1, 21):
        case_id = f"CASE-{idx:03d}"
        folder_name = f"case_{idx:02d}"
        case_dir = os.path.join(output_base, folder_name)
        os.makedirs(case_dir, exist_ok=True)

        logger.info(f"Executing Benchmark Case: {case_id} -> {case_dir}")

        # Run investigation
        investigation_result = agent.run_investigation(case_id, allow_evidence_step_up=True)
        case_record = case_svc.get_case(case_id)
        ledger_entries = ledger_svc.get_case_ledger(case_id)

        # 1. case.json: Case docket state
        case_json_data = case_record.model_dump() if case_record else investigation_result.get("case", {})
        with open(os.path.join(case_dir, "case.json"), "w") as f:
            json.dump(case_json_data, f, indent=2)

        # 2. investigation.json: Full agent timeline and findings
        investigation_json_data = {
            "case_id": case_id,
            "status": case_record.status.value if case_record else "RESOLVED",
            "risk_score": case_record.risk_score if case_record else 0.0,
            "confidence": case_record.confidence if case_record else 0.0,
            "findings": case_record.findings if case_record else [],
            "timeline": investigation_result.get("timeline", []),
            "detected_patterns": investigation_result.get("detected_patterns", [])
        }
        with open(os.path.join(case_dir, "investigation.json"), "w") as f:
            json.dump(investigation_json_data, f, indent=2)

        # 3. evidence.json: Supporting, contradicting, missing evidence and GraphRAG pack
        evidence_json_data = {
            "case_id": case_id,
            "supporting_evidence": [e.model_dump() for e in case_record.supporting_evidence] if case_record else [],
            "contradicting_evidence": [e.model_dump() for e in case_record.contradicting_evidence] if case_record else [],
            "missing_evidence": case_record.missing_evidence if case_record else [],
            "uncertainty_level": case_record.uncertainty_level if case_record else "LOW",
            "graphrag_evidence_pack": investigation_result.get("evidence_pack", {})
        }
        with open(os.path.join(case_dir, "evidence.json"), "w") as f:
            json.dump(evidence_json_data, f, indent=2)

        # 4. decision.json: Deterministic evaluation and rationale
        decision_json_data = {
            "case_id": case_id,
            "risk_score": case_record.risk_score if case_record else 0.0,
            "confidence": case_record.confidence if case_record else 0.0,
            "primary_fraud_pattern": case_record.fraud_patterns[0] if case_record and case_record.fraud_patterns else "NONE",
            "decision_summary": case_record.findings[0] if case_record and case_record.findings else "",
            "requires_approval": any(a.approval_required for a in case_record.recommended_actions) if case_record else False,
            "approval_route": case_record.recommended_actions[0].approval_route.value if case_record and case_record.recommended_actions else "NONE"
        }
        with open(os.path.join(case_dir, "decision.json"), "w") as f:
            json.dump(decision_json_data, f, indent=2)

        # 5. actions.json: Prioritized NBA list
        actions_json_data = {
            "case_id": case_id,
            "recommended_actions": [a.model_dump() for a in case_record.recommended_actions] if case_record else [],
            "executed_actions": case_record.executed_actions if case_record else []
        }
        with open(os.path.join(case_dir, "actions.json"), "w") as f:
            json.dump(actions_json_data, f, indent=2)

        # 6. ledger.json: Cryptographic SHA-256 chain
        verification_status = ledger_svc.verify_case_ledger(case_id)
        ledger_json_data = {
            "case_id": case_id,
            "cryptographic_verification": verification_status,
            "chain_length": len(ledger_entries),
            "entries": ledger_entries
        }
        with open(os.path.join(case_dir, "ledger.json"), "w") as f:
            json.dump(ledger_json_data, f, indent=2)

        # 7. sar.json: Suspicious Activity Report (when generated)
        sar_docket = investigation_result.get("sar_docket")
        if sar_docket:
            with open(os.path.join(case_dir, "sar.json"), "w") as f:
                json.dump(sar_docket, f, indent=2)

        results_summary.append({
            "case_id": case_id,
            "folder": folder_name,
            "risk": case_record.risk_score if case_record else 0.0,
            "confidence": case_record.confidence if case_record else 0.0,
            "status": case_record.status.value if case_record else "UNKNOWN",
            "primary_action": case_record.recommended_actions[0].action.value if case_record and case_record.recommended_actions else "NONE",
            "sar_filed": sar_docket is not None,
            "ledger_verified": verification_status["is_valid"]
        })

    logger.info(f"All 20 Benchmark Cases Processed Successfully! Outputs saved to {output_base}/")
    return {"total_cases": len(results_summary), "results": results_summary}


if __name__ == "__main__":
    summary = run_all_benchmarks()
    print("\n=== Benchmark Execution Summary ===")
    for s in summary["results"]:
        print(f"[{s['case_id']}] Action: {s['primary_action']:<22} Risk: {s['risk']:.2f}  Conf: {s['confidence']:.2f}  SAR: {str(s['sar_filed']):<5}  Ledger: {'VALID' if s['ledger_verified'] else 'FAIL'}")
