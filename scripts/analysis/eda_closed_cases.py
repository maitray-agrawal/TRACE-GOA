"""
Exploratory Data Analysis on 5,565 closed fraud cases (July - October 2016).
Identifies features separating confirmed fraud from cleared false alarms,
validates the 5 documented patterns, and isolates the 2 undocumented patterns.
"""

import csv
from pathlib import Path
from collections import Counter, defaultdict

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "competition"
CLOSED_CASES_CSV = DATA_DIR / "closed_cases_history.csv"

def run_eda():
    print(f"=== EDA on Closed Cases: {CLOSED_CASES_CSV} ===")
    
    with open(CLOSED_CASES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cases = list(reader)
        
    total = len(cases)
    print(f"Total closed cases: {total}")
    
    outcomes = Counter(c["outcome"] for c in cases)
    patterns = Counter(c["pattern"] for c in cases)
    
    print("\n[+] Outcomes:")
    for out, cnt in outcomes.most_common():
        print(f"    - {out:<20}: {cnt:>5} ({cnt/total*100:.1f}%)")
        
    print("\n[+] Patterns Breakdown:")
    for pat, cnt in patterns.most_common():
        print(f"    - {pat:<30}: {cnt:>5} ({cnt/total*100:.1f}%)")
        
    # Analyze exposure and n_txns by outcome
    exposure_by_outcome = defaultdict(list)
    ntxns_by_outcome = defaultdict(list)
    for c in cases:
        try:
            exp = float(c["exposure_usd"])
            n = int(c["n_txns"])
            exposure_by_outcome[c["outcome"]].append(exp)
            ntxns_by_outcome[c["outcome"]].append(n)
        except (ValueError, TypeError):
            pass
            
    print("\n[+] Exposure Analysis:")
    for out, vals in exposure_by_outcome.items():
        avg_exp = sum(vals) / len(vals) if vals else 0
        max_exp = max(vals) if vals else 0
        print(f"    - {out:<20}: Avg ${avg_exp:>8.2f}, Max ${max_exp:>8.2f}")

    # Undocumented patterns deep-dive
    undoc = [c for c in cases if c["pattern"] == "undocumented"]
    print(f"\n[+] Undocumented Patterns Deep Dive ({len(undoc)} cases):")
    
    proxy_cluster = []
    smurfing_cluster = []
    
    for c in undoc:
        notes = c["analyst_notes"]
        if "proxy" in notes.lower() or "device" in notes.lower():
            proxy_cluster.append(c)
        if "under $500" in notes.lower() or "forty minutes" in notes.lower():
            smurfing_cluster.append(c)
            
    print(f"    1. Cross-Card Anonymous Proxy Ring: {len(proxy_cluster)} cases")
    for c in proxy_cluster[:2]:
        print(f"       * Case {c['case_id']}: Card {c['card_id']} -> Connected: {c['connected_card_ids'][:40]}...")
        print(f"         Summary: {c['analyst_notes'][:120]}...")
        
    print(f"\n    2. Sub-Threshold Structuring / Smurfing Burst: {len(smurfing_cluster)} cases")
    for c in smurfing_cluster[:2]:
        print(f"       * Case {c['case_id']}: Card {c['card_id']}, Txns: {c['n_txns']}, Exposure: ${c['exposure_usd']}")
        print(f"         Summary: {c['analyst_notes'][:120]}...")

    print("\n=== EDA Completed Successfully ===")

if __name__ == "__main__":
    run_eda()
