"""
Extracts transaction neighborhoods and identity records for the 20 benchmark cases
into a fast indexed JSON cache: data/competition/benchmark_subgraphs.json.
Runs once in ~8 seconds, enabling instantaneous graph traversals.
"""

import csv
import json
import time
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "competition"

def extract_neighborhoods():
    print("=== Extracting Benchmark Neighborhoods ===")
    start_time = time.time()
    
    # 1. Read case pack
    with open(DATA_DIR / "case_pack.csv", "r", encoding="utf-8") as f:
        cases = list(csv.DictReader(f))
        
    target_txns = {c["flagged_txn_id"]: c["case_id"] for c in cases}
    target_cards = {c["card_id"]: c["case_id"] for c in cases}
    target_custs = {c["customer_id"]: c["case_id"] for c in cases}
    
    print(f"Targeting 20 cases, {len(target_txns)} flagged txns, {len(target_cards)} cards, {len(target_custs)} customers.")
    
    # 2. Extract transactions for target cards/customers
    subgraph_txns = []
    found_flagged = set()
    
    with open(DATA_DIR / "transactions.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = row["TransactionID"]
            cid = row["customer_id"]
            # Check card match or customer match or flagged txn match
            if tid in target_txns or cid in target_custs:
                if tid in target_txns:
                    found_flagged.add(tid)
                subgraph_txns.append({
                    "TransactionID": tid,
                    "customer_id": cid,
                    "card1": row["card1"],
                    "card4": row["card4"],
                    "card6": row["card6"],
                    "ts": row["ts"],
                    "TransactionDT": row["TransactionDT"],
                    "TransactionAmt": float(row["TransactionAmt"]),
                    "ProductCD": row["ProductCD"],
                    "channel": row["channel"],
                    "risk_score": float(row["risk_score"]) if row["risk_score"] else 0.0,
                    "addr1": row["addr1"],
                    "addr2": row["addr2"],
                    "P_emaildomain": row["P_emaildomain"],
                    "R_emaildomain": row["R_emaildomain"]
                })
                
    print(f"[+] Extracted {len(subgraph_txns)} transactions in neighborhood. Found {len(found_flagged)}/{len(target_txns)} flagged txns.")
    
    # 3. Extract identity records for extracted txns
    extracted_tids = {t["TransactionID"] for t in subgraph_txns}
    subgraph_identities = {}
    
    with open(DATA_DIR / "identity.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = row["TransactionID"]
            if tid in extracted_tids:
                subgraph_identities[tid] = {
                    "DeviceType": row["DeviceType"],
                    "DeviceInfo": row["DeviceInfo"],
                    "id_15": row["id_15"],
                    "id_23": row["id_23"],
                    "id_30": row["id_30"],
                    "id_31": row["id_31"],
                    "id_33": row["id_33"],
                    "id_34": row["id_34"]
                }
                
    print(f"[+] Extracted {len(subgraph_identities)} identity records.")
    
    # 4. Save to benchmark_subgraphs.json
    cache_payload = {
        "generated_at": time.time(),
        "cases": cases,
        "transactions": subgraph_txns,
        "identities": subgraph_identities
    }
    
    out_file = DATA_DIR / "benchmark_subgraphs.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(cache_payload, f, indent=2)
        
    print(f"[+] Subgraph cache written to {out_file} ({out_file.stat().st_size / (1024*1024):.2f} MB)")
    print(f"[+] Completed in {time.time() - start_time:.2f}s")

if __name__ == "__main__":
    extract_neighborhoods()
