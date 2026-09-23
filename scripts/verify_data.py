"""
Verification script for the IEEE-CIS competition dataset in data/competition/
Checks file existence, row counts, unique customer/card counts, and case pack.
"""
import os
import sys
import csv
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "competition"

def verify_dataset():
    print(f"=== Verifying Dataset in {DATA_DIR} ===")
    
    files = {
        "README.md": DATA_DIR / "README.md",
        "case_pack.csv": DATA_DIR / "case_pack.csv",
        "closed_cases_history.csv": DATA_DIR / "closed_cases_history.csv",
        "identity.csv": DATA_DIR / "identity.csv",
        "transactions.csv": DATA_DIR / "transactions.csv",
    }
    
    for name, path in files.items():
        if not path.exists():
            print(f"[-] MISSING: {name} at {path}")
            sys.exit(1)
        size_mb = path.stat().st_size / (1024 * 1024)
        print(f"[+] FOUND: {name:<26} ({size_mb:>7.2f} MB)")
        
    print("\n--- Counting Records ---")
    
    # 1. Case pack
    with open(files["case_pack.csv"], "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        case_rows = list(reader)
        n_cases = len(case_rows)
        print(f"[+] case_pack.csv: {n_cases} cases (Expected: 20)")
        case_ids = [r["case_id"] for r in case_rows]
        print(f"    Case IDs: {', '.join(case_ids[:5])} ... {', '.join(case_ids[-5:])}")
        assert n_cases == 20, f"Expected 20 cases, got {n_cases}"

    # 2. Closed cases history
    with open(files["closed_cases_history.csv"], "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        closed_rows = list(reader)
        n_closed = len(closed_rows)
        outcomes = {}
        patterns = {}
        for r in closed_rows:
            outcomes[r["outcome"]] = outcomes.get(r["outcome"], 0) + 1
            patterns[r["pattern"]] = patterns.get(r["pattern"], 0) + 1
        print(f"[+] closed_cases_history.csv: {n_closed} closed cases (Expected: 5,565)")
        print(f"    Outcomes: {outcomes}")
        print(f"    Patterns: {patterns}")
        assert n_closed == 5565, f"Expected 5565 closed cases, got {n_closed}"

    # 3. Identity records
    with open(files["identity.csv"], "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        n_identities = sum(1 for _ in reader)
        print(f"[+] identity.csv: {n_identities} identity rows (Expected: 144,432), {len(header)} columns")
        assert n_identities == 144432, f"Expected 144432 identities, got {n_identities}"

    # 4. Transactions
    print("[*] Scanning transactions.csv (this may take a few seconds)...")
    customers = set()
    cards = set()
    n_txns = 0
    with open(files["transactions.csv"], "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames
        for r in reader:
            n_txns += 1
            cust = r.get("customer_id")
            if cust:
                customers.add(cust)
            card1 = r.get("card1")
            if card1:
                cards.add(f"{cust}-{card1}")
            if n_txns % 100000 == 0:
                print(f"    ... processed {n_txns} transactions")
                
    print(f"[+] transactions.csv: {n_txns} transactions (Expected: 590,742), {len(cols)} columns")
    print(f"[+] Unique customers: {len(customers)} (Expected: ~13,500)")
    print(f"[+] Unique card keys: {len(cards)}")
    assert n_txns == 590742, f"Expected 590742 transactions, got {n_txns}"

    print("\n=== DATASET VERIFICATION SUCCESSFUL: ALL CHECKS PASSED ===")

if __name__ == "__main__":
    verify_dataset()
