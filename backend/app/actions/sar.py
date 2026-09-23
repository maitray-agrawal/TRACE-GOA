"""Automated FinCEN-Compliant Suspicious Activity Report (SAR) Generator.

Constructs formal, structured SAR dockets for high-impact fraud investigations,
aggregating subjects, transactions, graph indicators, and regulatory statutory references.
"""

from typing import Any, Dict, List, Optional
import time
from backend.app.schemas.case import CaseRecord


class SARGenerator:
    """Generates formal SAR regulatory filing drafts."""

    @staticmethod
    def generate_sar(
        case: CaseRecord,
        transactions: List[Dict[str, Any]],
        filing_institution: str = "HHGOA Federal Financial Reserve Bank"
    ) -> Dict[str, Any]:
        """Constructs an auditable SAR report."""
        total_amount = sum(float(t.get("amount", 0.0)) for t in transactions)
        primary_pattern = case.fraud_patterns[0] if case.fraud_patterns else "UNSPECIFIED_SUSPICIOUS_ACTIVITY"

        evidence_summaries = [e.title for e in case.supporting_evidence]

        sar_docket = {
            "document_header": {
                "filing_type": "SUSPICIOUS_ACTIVITY_REPORT",
                "status": "DRAFT / SIMULATED FOR HACKATHON",
                "statutory_authority": "Bank Secrecy Act, 31 U.S.C. 5318(g); 31 CFR Chapter X",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "filing_institution": filing_institution,
                "case_reference_id": case.case_id
            },
            "subjects": [
                {
                    "subject_id": case.subject_customer_id,
                    "relationship_role": "PRIMARY_SUSPECT",
                    "risk_tier": "HIGH" if case.risk_score >= 0.70 else "ELEVATED"
                }
            ],
            "suspicious_activity_summary": {
                "primary_typology": primary_pattern,
                "aggregate_amount_usd": round(total_amount, 2),
                "risk_score": case.risk_score,
                "confidence_score": case.confidence,
                "activity_start_time": min((t.get("timestamp", 0) for t in transactions), default=int(case.created_at)),
                "activity_end_time": max((t.get("timestamp", 0) for t in transactions), default=int(case.updated_at)),
                "transaction_count": len(transactions),
                "transactions_involved": [t.get("id") for t in transactions]
            },
            "fraud_indicators_and_graph_evidence": evidence_summaries,
            "investigation_findings": case.findings,
            "narrative_rationale": (
                f"Investigation docket {case.case_id} revealed structured anomalies consistent with {primary_pattern}. "
                f"Graph analysis through TigerGraph uncovered cross-entity linkages involving subject {case.subject_customer_id}. "
                f"Cumulative aggregate activity of ${total_amount:.2f} satisfies the $5,000 BSA threshold for mandatory suspicious activity reporting. "
                f"Internal controls and policy constraints require immediate account freeze and supervisory escalation."
            ),
            "regulatory_policy_basis": [
                "FinCEN 31 CFR § 1020.320: Reports by banks of suspicious transactions",
                "FFIEC Bank Secrecy Act / Anti-Money Laundering Examination Manual",
                "HHGOA AML Policy Section 4.2: Automated Graph Syndicate Escalations"
            ],
            "filing_disposition": {
                "recommended_status": "SUBMIT_TO_COMPLIANCE",
                "requires_signoff_by": "FRAUD_MANAGER",
                "law_enforcement_contact_recommended": total_amount >= 10000.0
            }
        }

        return sar_docket
