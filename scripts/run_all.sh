#!/usr/bin/env bash
# TRACE//GOA — End-to-End Execution & Validation Pipeline (Linux / macOS)
# Run from repository root: ./scripts/run_all.sh

set -e

echo "=========================================================="
echo "TRACE//GOA — Agentic Fraud Investigation & NBA Pipeline"
echo "=========================================================="

# Step 1: Ensure .env exists
if [ ! -f ".env" ]; then
    echo "[*] Initializing .env from template .env.example..."
    cp .env.example .env
fi

# Step 2: Run Pytest test suite
echo ""
echo "[*] Step 1/3: Running Pytest Test Suite..."
pytest -q

# Step 3: Run Official 20-Case Benchmark
echo ""
echo "[*] Step 2/3: Executing Autonomous Benchmark on 20 Cases..."
python -m scripts.benchmark.run_competition_benchmark

# Step 4: Validate Competition Answer Files
echo ""
echo "[*] Step 3/3: Validating Output Answer Files against IEEE-CIS Schema..."
python scripts/validate_outputs.py

echo ""
echo "=========================================================="
echo "[SUCCESS] TRACE//GOA Pipeline Complete: 20/20 Cases Verified!"
echo "=========================================================="
