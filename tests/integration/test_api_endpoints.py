"""Integration tests for FastAPI endpoints."""

import os
import sys
import pytest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.main import app
from scripts.ingest.generate_seed_dataset import build_and_seed_dataset


@pytest.fixture(scope="module", autouse=True)
def setup_api():
    build_and_seed_dataset()


def test_health_endpoint():
    client = TestClient(app)
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"


def test_metrics_endpoint():
    client = TestClient(app)
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "total_active_cases" in data
    assert data["total_active_cases"] >= 20


def test_list_investigations():
    client = TestClient(app)
    res = client.get("/api/investigations")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 20


def test_get_case_graph():
    client = TestClient(app)
    res = client.get("/api/investigations/CASE-001/graph")
    assert res.status_code == 200
    g = res.json()
    assert "nodes" in g
    assert "edges" in g
    assert g["node_count"] > 0


def test_run_investigation_endpoint():
    client = TestClient(app)
    res = client.post("/api/investigations/CASE-001/run", json={"allow_step_up": True})
    assert res.status_code == 200
    data = res.json()
    assert "case" in data
    assert "timeline" in data
    assert data["ledger_verified"] is True


def test_ledger_verification_endpoint():
    client = TestClient(app)
    res = client.post("/api/ledger/verify?case_id=CASE-001")
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
