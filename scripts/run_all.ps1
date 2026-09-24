# TRACE//GOA - End-to-End Execution and Validation Pipeline (Windows PowerShell)
# Run from repository root: .\scripts\run_all.ps1

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "TRACE//GOA - Agentic Fraud Investigation Pipeline" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Ensure .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[*] Initializing .env from template .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Step 2: Run Pytest test suite
Write-Host ""
Write-Host "[*] Step 1/3: Running Pytest Test Suite..." -ForegroundColor Cyan
pytest -q
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Test suite failed. Stopping."
    exit 1
}

# Step 3: Run Official 20-Case Benchmark
Write-Host ""
Write-Host "[*] Step 2/3: Executing Autonomous Benchmark on 20 Cases..." -ForegroundColor Cyan
python -m scripts.benchmark.run_competition_benchmark
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Benchmark execution failed. Stopping."
    exit 1
}

# Step 4: Validate Competition Answer Files
Write-Host ""
Write-Host "[*] Step 3/3: Validating Output Answer Files against IEEE-CIS Schema..." -ForegroundColor Cyan
python scripts/validate_outputs.py
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Output validation failed. Stopping."
    exit 1
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] TRACE//GOA Pipeline Complete: 20/20 Cases Verified!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
