.PHONY: help install seed test benchmark backtest validate verify-data verify-graph run-backend run-frontend build-frontend demo

help:
	@echo "TRACE//GOA Commands:"
	@echo "  make verify-data   - Verify IEEE-CIS competition dataset row counts"
	@echo "  make verify-graph  - Check and load TigerGraph live instance"
	@echo "  make backtest      - Run pattern detection backtest on 1,113 held-out closed cases"
	@echo "  make benchmark     - Run the official 20 benchmark cases (HHG-001 to HHG-020)"
	@echo "  make validate      - Validate 20 answer files against competition JSON schema"
	@echo "  make test          - Run full pytest test suite"
	@echo "  make run-backend   - Start FastAPI application server on port 8000"
	@echo "  make run-frontend  - Start Vite development server on port 5173"
	@echo "  make build-frontend- Build production frontend bundle"

verify-data:
	python scripts/verify_data.py

verify-graph:
	python scripts/setup/load_tigergraph.py

backtest:
	python scripts/analysis/backtest.py

benchmark:
	python scripts/benchmark/run_competition_benchmark.py

validate:
	python scripts/validate_outputs.py

test:
	pytest -q

run-backend:
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	cd frontend && npm run dev

build-frontend:
	cd frontend && npm run build

demo:
	python -c "import subprocess, sys; p1 = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'backend.app.main:app', '--port', '8000']); print('Backend running on port 8000'); p1.wait()"
