"""Unit tests for the 5 Canonical Fraud Pattern Detectors."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from scripts.ingest.generate_seed_dataset import build_and_seed_dataset
from backend.app.patterns.engine import FraudPatternEngine


@pytest.fixture(scope="module", autouse=True)
def seed_test_data():
    build_and_seed_dataset()


def test_device_farm_detection():
    engine = FraudPatternEngine()
    # CASE-001 is seeded with Device Farm emulator
    p = engine.detect_device_farm("TXN_BENCH_001")
    assert p is not None
    assert p.pattern_id == "DEVICE_FARM"
    assert p.confidence >= 0.70
    assert len(p.supporting_evidence) > 0


def test_velocity_card_testing_detection():
    engine = FraudPatternEngine()
    # CASE-005 is seeded with micro-transactions (< $10)
    p = engine.detect_velocity_card_testing("TXN_BENCH_005")
    assert p is not None
    assert p.pattern_id == "CARD_TESTING"
    assert p.confidence >= 0.50


def test_mule_dispersal_detection():
    engine = FraudPatternEngine()
    # CASE-004 is seeded with high-turnover inflow/outflow ($12,500)
    p = engine.detect_mule_dispersal("CUST_0004")
    assert p is not None
    assert p.pattern_id == "MULE_DISPERSAL"
    assert p.confidence >= 0.70
