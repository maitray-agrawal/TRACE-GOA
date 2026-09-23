.PHONY: help install seed test benchmark run-backend run-frontend build-frontend verify-ledger

help:
	@echo "Available commands:"
	@echo "  make seed          - Seed the TigerGraph graph and benchmark cases"
	@echo "  make test          - Run pytest automated test suite"
	@echo "  make benchmark     - Run all 20 benchmark cases and generate outputs"
	@echo "  make run-backend   - Start FastAPI application server on port 8000"
	@echo "  make run-frontend  - Start Vite development server on port 5173"
	@echo "  make build-frontend- Build production frontend bundle"

seed:
	python scripts/ingest/generate_seed_dataset.py

test:
	pytest tests/

benchmark:
	python scripts/benchmark/run_benchmarks.py

run-backend:
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	cd frontend && npm run dev

build-frontend:
	cd frontend && npm run build
