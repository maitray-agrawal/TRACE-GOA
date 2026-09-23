"""
Schema and integrity validator for competition answer files.
Validates all 20 case files (HHG-001 to HHG-020) in outputs/cases/ or cases/
against the official IEEE-CIS competition specification in README.md.
"""

import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CASES_DIR = BASE_DIR / "cases"
OUTPUTS_CASES_DIR = BASE_DIR / "outputs" / "cases"

VALID_STATUSES = {"open", "closed_fraud", "closed_legitimate", "escalated"}
VALID_VERDICTS = {"fraud", "legitimate", "uncertain"}
VALID_PATTERNS = {
    "card_testing",
    "card_not_present_fraud",
    "card_not_present_new_device",
    "out_of_region_use",
    "account_takeover",
    "undocumented",
    "none"
}
VALID_ACTIONS = {
    "ALLOW_TRANSACTION",
    "DECLINE_TRANSACTION",
    "MONITOR_CARD",
    "MONITOR_CONNECTED_CARDS",
    "WARN_CUSTOMER",
    "VERIFY_WITH_CUSTOMER",
    "STEP_UP_AUTH",
    "BLOCK_CARD",
    "BLOCK_ALL_CARDS",
    "GENERATE_REPORT",
    "CREATE_CASE",
    "FILE_REPORT",
    "ESCALATE_TO_ANALYST",
    "CLOSE_NO_FRAUD"
}
VALID_ROUTES = {"auto", "L1", "L2"}

def validate_case_file(filepath: Path) -> bool:
    print(f"[*] Validating {filepath.name}...")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"[-] Invalid JSON in {filepath}: {e}")
        return False

    # Top-level fields
    req_top = ["case_id", "case", "evidence_requests", "next_best_actions", "sar", "stop_reason", "tool_calls", "tokens", "latency_s"]
    for field in req_top:
        if field not in data:
            print(f"[-] Missing top-level field '{field}' in {filepath.name}")
            return False

    case_obj = data["case"]
    req_case = [
        "status", "verdict", "fraud_probability", "pattern", "pattern_description",
        "affected_txn_ids", "first_suspicious_txn_id", "connected_card_ids",
        "connected_device_profiles", "exposure_usd", "evidence", "similar_prior_cases",
        "summary", "written_to_graph", "graph_case_id"
    ]
    for field in req_case:
        if field not in case_obj:
            print(f"[-] Missing case field '{field}' in {filepath.name}")
            return False

    if case_obj["status"] not in VALID_STATUSES:
        print(f"[-] Invalid case.status '{case_obj['status']}' in {filepath.name}")
        return False

    if case_obj["verdict"] not in VALID_VERDICTS:
        print(f"[-] Invalid case.verdict '{case_obj['verdict']}' in {filepath.name}")
        return False

    if case_obj["pattern"] not in VALID_PATTERNS:
        print(f"[-] Invalid case.pattern '{case_obj['pattern']}' in {filepath.name}")
        return False

    if case_obj["pattern"] == "undocumented" and not case_obj["pattern_description"]:
        print(f"[-] pattern_description required when pattern is 'undocumented' in {filepath.name}")
        return False

    # SAR validation
    sar_obj = data["sar"]
    req_sar = ["file", "reason", "narrative", "subjects", "total_amount_usd", "activity_dates"]
    for field in req_sar:
        if field not in sar_obj:
            print(f"[-] Missing sar field '{field}' in {filepath.name}")
            return False

    if sar_obj["file"] and not sar_obj["narrative"]:
        print(f"[-] sar.file is true but narrative is empty in {filepath.name}")
        return False

    # Next best actions
    nba = data["next_best_actions"]
    if "initial" not in nba or "final" not in nba or "what_changed" not in nba:
        print(f"[-] Incomplete next_best_actions in {filepath.name}")
        return False

    for act in nba.get("initial", []) + nba.get("final", []):
        if act.get("action") not in VALID_ACTIONS:
            print(f"[-] Invalid action '{act.get('action')}' in {filepath.name}")
            return False
        if act.get("route") not in VALID_ROUTES:
            print(f"[-] Invalid route '{act.get('route')}' in {filepath.name}")
            return False

    return True

def validate_all_cases():
    target_dir = CASES_DIR if CASES_DIR.exists() and list(CASES_DIR.glob("*.json")) else OUTPUTS_CASES_DIR
    print(f"=== Validating 20 Competition Answer Files in {target_dir} ===")
    
    if not target_dir.exists():
        print(f"[-] Directory does not exist: {target_dir}")
        sys.exit(1)
        
    expected_ids = [f"HHG-{i:03d}" for i in range(1, 21)]
    valid_count = 0
    
    for case_id in expected_ids:
        fpath = target_dir / f"{case_id}.json"
        if not fpath.exists():
            print(f"[-] MISSING CASE ANSWER: {fpath.name}")
            continue
        if validate_case_file(fpath):
            valid_count += 1
            
    print(f"\n[+] Validation Summary: {valid_count}/20 cases passed schema validation")
    if valid_count == 20:
        print("=== ALL 20 COMPETITION ANSWER FILES VALID ===")
        sys.exit(0)
    else:
        print(f"[-] Validation failed: only {valid_count}/20 cases valid.")
        sys.exit(1)

if __name__ == "__main__":
    validate_all_cases()
