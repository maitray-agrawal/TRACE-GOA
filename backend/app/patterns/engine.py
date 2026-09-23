"""Deterministic Fraud Pattern Engine.

Implements rule-based, graph-grounded pattern detectors for the 5 canonical fraud
typologies, extracting structured supporting and contradicting evidence.
"""

from typing import Any, Dict, List, Optional
import logging
from backend.app.graph.client import get_default_graph_client

logger = logging.getLogger("PatternEngine")


class PatternDetectionResult:
    def __init__(
        self,
        pattern_id: str,
        name: str,
        confidence: float,
        supporting_evidence: List[str],
        contradicting_evidence: List[str],
        entities: List[str],
        transactions: List[str],
        graph_paths: List[str]
    ):
        self.pattern_id = pattern_id
        self.name = name
        self.confidence = confidence
        self.supporting_evidence = supporting_evidence
        self.contradicting_evidence = contradicting_evidence
        self.entities = entities
        self.transactions = transactions
        self.graph_paths = graph_paths

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pattern_id": self.pattern_id,
            "name": self.name,
            "confidence": round(self.confidence, 3),
            "supporting_evidence": self.supporting_evidence,
            "contradicting_evidence": self.contradicting_evidence,
            "entities": self.entities,
            "transactions": self.transactions,
            "graph_paths": self.graph_paths
        }


class FraudPatternEngine:
    """Evaluates transactions and graph subgraphs for canonical fraud typologies."""

    def __init__(self):
        self.client = get_default_graph_client()

    def evaluate_all(self, txn_id: str, customer_id: str) -> List[PatternDetectionResult]:
        """Evaluates all 5 canonical fraud patterns for the given subject."""
        results = []

        # 1. Device Farm
        p1 = self.detect_device_farm(txn_id)
        if p1 and p1.confidence >= 0.50:
            results.append(p1)

        # 2. Synthetic Identity Syndicate
        p2 = self.detect_synthetic_identity(customer_id)
        if p2 and p2.confidence >= 0.50:
            results.append(p2)

        # 3. Velocity Card Testing
        p3 = self.detect_velocity_card_testing(txn_id)
        if p3 and p3.confidence >= 0.50:
            results.append(p3)

        # 4. Rapid Mule Dispersal
        p4 = self.detect_mule_dispersal(customer_id)
        if p4 and p4.confidence >= 0.50:
            results.append(p4)

        # 5. Account Takeover & Address Laundering
        p5 = self.detect_ato_address_launder(txn_id)
        if p5 and p5.confidence >= 0.50:
            results.append(p5)

        return results

    def detect_device_farm(self, txn_id: str) -> Optional[PatternDetectionResult]:
        """Detects Device Emulation Farm: cycling multiple cards/accounts on emulators."""
        nbr = self.client.query_transaction_neighborhood(txn_id, depth=2)
        device_node = next((n for n in nbr.get("nodes", []) if n.get("type") == "Device"), None)
        if not device_node:
            return None

        dev_id = device_node.get("id")
        dev_reuse = self.client.query_device_reuse(dev_id, threshold=2)
        is_emu = device_node.get("attributes", {}).get("is_emulator", False)
        reused_count = dev_reuse.get("reused_count", 0)

        supporting = []
        contradicting = []

        if is_emu:
            supporting.append(f"Device {dev_id} exhibits headless/emulator signature")
        if reused_count >= 2:
            supporting.append(f"Device {dev_id} linked to {reused_count} distinct payment cards/accounts")
        if dev_reuse.get("transaction_count", 0) > 5:
            supporting.append(f"High transaction concentration ({dev_reuse.get('transaction_count')} events) on single device")

        if not is_emu:
            contradicting.append("Device signature matches standard consumer hardware (non-emulator)")
        if reused_count <= 1:
            contradicting.append("No cross-account device sharing detected")

        # Compute confidence
        score = 0.0
        if is_emu:
            score += 0.45
        if reused_count >= 5:
            score += 0.50
        elif reused_count >= 2:
            score += 0.35

        score = min(0.98, max(0.10, score))
        if score < 0.50:
            return None

        return PatternDetectionResult(
            pattern_id="DEVICE_FARM",
            name="Device Emulation Farm",
            confidence=score,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            entities=[dev_id],
            transactions=[txn_id],
            graph_paths=[f"Transaction({txn_id}) -> Device({dev_id}) <- Multiple Cards/Accounts"]
        )

    def detect_synthetic_identity(self, customer_id: str) -> Optional[PatternDetectionResult]:
        """Detects Synthetic Identity Syndicate: disconnected accounts sharing attributes."""
        res = self.client.query_shared_identity(customer_id)
        connected_custs = res.get("connected_customers", [])
        shared_attrs = res.get("shared_attributes_count", 0)

        if not connected_custs or not res.get("shared_syndicate"):
            return None

        supporting = [
            f"Customer {customer_id} shares {shared_attrs} physical/network attributes with {len(connected_custs)} ostensibly separate customer IDs",
            f"Shared entity cluster: {', '.join(connected_custs[:3])}"
        ]
        contradicting = []

        confidence = min(0.96, 0.40 + 0.15 * len(connected_custs))
        return PatternDetectionResult(
            pattern_id="SYNTH_ID_SYNDICATE",
            name="Synthetic Identity Syndicate",
            confidence=confidence,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            entities=[customer_id] + connected_custs,
            transactions=[],
            graph_paths=[f"Customer({customer_id}) -> Shared Device/Address/Email <- Customers({', '.join(connected_custs[:2])})"]
        )

    def detect_velocity_card_testing(self, txn_id: str) -> Optional[PatternDetectionResult]:
        """Detects Velocity Card Testing: automated micro-charges in rapid succession."""
        nbr = self.client.query_transaction_neighborhood(txn_id, depth=2)
        txn_node = next((n for n in nbr.get("nodes", []) if n.get("id") == txn_id), None)
        acct_node = next((n for n in nbr.get("nodes", []) if n.get("type") == "Account"), None)

        if not txn_node or not acct_node:
            return None

        amt = float(txn_node.get("attributes", {}).get("amount", 0.0))
        acct_id = acct_node.get("id")
        velocity = self.client.query_temporal_velocity(acct_id, window_seconds=300)

        burst_count = velocity.get("burst_count", 0)
        is_micro = amt <= 10.0

        if burst_count < 2 and not is_micro:
            return None

        supporting = []
        contradicting = []

        if is_micro:
            supporting.append(f"Transaction amount ${amt:.2f} is in micro-charge probing range (< $10.00)")
        if burst_count >= 2:
            supporting.append(f"Account {acct_id} experienced {burst_count} rapid-fire transactions within 5-minute window")

        if amt > 100.0:
            contradicting.append(f"Transaction amount ${amt:.2f} is atypical for automated card testing")

        confidence = 0.50
        if is_micro and burst_count >= 3:
            confidence = 0.92
        elif burst_count >= 2:
            confidence = 0.76

        return PatternDetectionResult(
            pattern_id="CARD_TESTING",
            name="Velocity Card Testing",
            confidence=confidence,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            entities=[acct_id],
            transactions=[txn_id],
            graph_paths=[f"Account({acct_id}) -> High-Frequency Rapid Transactions ({burst_count} events in 300s)"]
        )

    def detect_mule_dispersal(self, customer_id: str) -> Optional[PatternDetectionResult]:
        """Detects Rapid Mule Dispersal: incoming funds rapidly dispersed outbound."""
        cust = self.client.get_customer(customer_id)
        if not cust:
            return None

        # Check account velocity and high balance turnover
        acct_id = customer_id.replace("CUST_", "ACCT_")
        vel = self.client.query_temporal_velocity(acct_id, window_seconds=3600)

        burst_vol = vel.get("burst_volume", 0.0)
        total_txns = vel.get("total_transactions", 0)

        if burst_vol < 2500.0:
            return None

        supporting = [
            f"High-velocity volume turnover: ${burst_vol:.2f} transacted across {total_txns} rapid events",
            "Dispersal pattern characteristic of intermediary mule funneling"
        ]
        contradicting = []

        confidence = 0.88 if burst_vol > 5000.0 else 0.74
        return PatternDetectionResult(
            pattern_id="MULE_DISPERSAL",
            name="Rapid Mule Dispersal",
            confidence=confidence,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            entities=[customer_id, acct_id],
            transactions=[],
            graph_paths=[f"Account({acct_id}) -> High Turnover Inflows -> Rapid Outflows (${burst_vol:.2f})"]
        )

    def detect_ato_address_launder(self, txn_id: str) -> Optional[PatternDetectionResult]:
        """Detects ATO & Address Laundering: abrupt device/IP switch with altered delivery location."""
        nbr = self.client.query_transaction_neighborhood(txn_id, depth=2)
        txn_node = next((n for n in nbr.get("nodes", []) if n.get("id") == txn_id), None)
        if not txn_node:
            return None

        attrs = txn_node.get("attributes", {})
        dist2 = float(attrs.get("dist2", 0.0))
        dist1 = float(attrs.get("dist1", 0.0))
        risk_score = float(attrs.get("risk_score", 0.0))

        if dist2 < 100.0 and risk_score < 0.70:
            return None

        supporting = []
        contradicting = []

        if dist2 >= 100.0:
            supporting.append(f"Shipping address distance divergence: dist2 = {dist2:.1f} miles from historical billing address")
        if dist1 >= 20.0:
            supporting.append(f"Originating IP distance divergence: dist1 = {dist1:.1f} miles")
        if risk_score >= 0.70:
            supporting.append(f"Elevated baseline transaction anomaly score ({risk_score:.3f})")

        if dist2 < 20.0:
            contradicting.append("Shipping address matches historical registered billing location")

        confidence = 0.85 if dist2 >= 100.0 and dist1 >= 20.0 else 0.72
        return PatternDetectionResult(
            pattern_id="ATO_ADDRESS_LAUNDER",
            name="Account Takeover & Address Laundering",
            confidence=confidence,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            entities=[],
            transactions=[txn_id],
            graph_paths=[f"Transaction({txn_id}) -> Divergent Delivery Address (dist2: {dist2} mi)"]
        )
