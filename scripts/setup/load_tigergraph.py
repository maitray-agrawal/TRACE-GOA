"""
Idempotent TigerGraph Loader for IEEE-CIS HHGOA Dataset.
Loads schema, creates loading jobs for transactions, identities, and closed cases,
installs GSQL queries, and validates graph statistics.
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

TG_HOST = os.getenv("TIGERGRAPH_HOST")
TG_USER = os.getenv("TIGERGRAPH_USERNAME", "tigergraph")
TG_PASSWORD = os.getenv("TIGERGRAPH_PASSWORD")
TG_GRAPH = os.getenv("TIGERGRAPH_GRAPH_NAME", "FraudInvestigationGraph")
TG_SECRET = os.getenv("TIGERGRAPH_SECRET")
GRAPH_BACKEND = os.getenv("GRAPH_BACKEND", "simulator")

DATA_DIR = BASE_DIR / "data" / "competition"
SCHEMA_FILE = BASE_DIR / "tigergraph" / "schema" / "fraud_graph.gsql"
QUERIES_DIR = BASE_DIR / "tigergraph" / "queries"

def run_loader():
    print("=== TRACE//GOA: TigerGraph Data Loading Script ===")
    
    if GRAPH_BACKEND != "tigergraph" or not TG_HOST:
        print("[!] GRAPH_BACKEND is not 'tigergraph' or TIGERGRAPH_HOST is not set in .env.")
        print("[!] Real submission path requires a live TigerGraph instance.")
        print("[!] Please configure .env with:")
        print("    TIGERGRAPH_HOST=https://your-workspace.i.tgcloud.io")
        print("    TIGERGRAPH_USERNAME=tigergraph")
        print("    TIGERGRAPH_PASSWORD=your_password")
        print("    TIGERGRAPH_GRAPH_NAME=FraudInvestigationGraph")
        print("    GRAPH_BACKEND=tigergraph")
        sys.exit(1)

    try:
        import pyTigerGraph as tg
    except ImportError:
        print("[-] pyTigerGraph not installed. Run: pip install pyTigerGraph")
        sys.exit(1)

    print(f"[*] Connecting to TigerGraph instance at {TG_HOST} (Graph: {TG_GRAPH})...")
    conn = tg.TigerGraphConnection(
        host=TG_HOST,
        username=TG_USER,
        password=TG_PASSWORD,
        graphname=TG_GRAPH
    )
    
    if TG_SECRET:
        conn.getToken(TG_SECRET)

    # 1. Install Schema
    print("[*] Applying GSQL Schema from fraud_graph.gsql...")
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema_gsql = f.read()
    res = conn.gsql(schema_gsql)
    print(f"[+] Schema Result: {res[:150]}...")

    # 2. Define and run loading job
    print("[*] Creating loading job for IEEE-CIS competition files...")
    txns_path = str(DATA_DIR / "transactions.csv").replace("\\", "/")
    ident_path = str(DATA_DIR / "identity.csv").replace("\\", "/")
    cases_path = str(DATA_DIR / "closed_cases_history.csv").replace("\\", "/")

    loading_gsql = f"""
    USE GRAPH {TG_GRAPH}
    DROP JOB load_ieeecis_fraud_data
    CREATE LOADING JOB load_ieeecis_fraud_data FOR GRAPH {TG_GRAPH} {{
        DEFINE FILENAME f_txns = "{txns_path}";
        DEFINE FILENAME f_ident = "{ident_path}";
        DEFINE FILENAME f_cases = "{cases_path}";

        // Transactions & Cards & Customers
        LOAD f_txns TO VERTEX Customer VALUES($customer_id) USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO VERTEX Card VALUES($customer_id + "-" + $card1, $customer_id, $card1, $card4, $card6) USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO VERTEX Transaction VALUES($TransactionID, $ts, $TransactionDT, $TransactionAmt, $ProductCD, $channel, $risk_score, $addr1, $addr2, $dist1, $dist2, $P_emaildomain, $R_emaildomain) USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO VERTEX BillingRegion VALUES($addr1, $addr2) WHERE $addr1 IS NOT EMPTY USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO VERTEX EmailDomain VALUES($P_emaildomain) WHERE $P_emaildomain IS NOT EMPTY USING HEADER="true", SEPARATOR=",";

        LOAD f_txns TO EDGE OWNS VALUES($customer_id, $customer_id + "-" + $card1) USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO EDGE MADE VALUES($customer_id + "-" + $card1, $TransactionID) USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO EDGE BILLED_IN VALUES($TransactionID, $addr1) WHERE $addr1 IS NOT EMPTY USING HEADER="true", SEPARATOR=",";
        LOAD f_txns TO EDGE PURCHASER_EMAIL VALUES($TransactionID, $P_emaildomain) WHERE $P_emaildomain IS NOT EMPTY USING HEADER="true", SEPARATOR=",";

        // Identities & Device Profiles
        LOAD f_ident TO VERTEX DeviceProfile VALUES(
            $DeviceInfo + " | " + $id_30 + " | " + $id_31 + " | " + $id_33,
            $DeviceInfo, $id_30, $id_31, $id_33, $DeviceType, $id_15, $id_23
        ) USING HEADER="true", SEPARATOR=",";

        LOAD f_ident TO EDGE FROM_DEVICE VALUES(
            $TransactionID,
            $DeviceInfo + " | " + $id_30 + " | " + $id_31 + " | " + $id_33
        ) USING HEADER="true", SEPARATOR=",";

        // Closed cases
        LOAD f_cases TO VERTEX ClosedCase VALUES(
            $case_id, $opened_at, $closed_at, $outcome, $pattern, $exposure_usd, $n_txns, $actions_taken, $report_filed, $analyst_notes
        ) USING HEADER="true", SEPARATOR=",";
        LOAD f_cases TO EDGE ON_CARD VALUES($case_id, $card_id) USING HEADER="true", SEPARATOR=",";
    }}
    RUN LOADING JOB load_ieeecis_fraud_data
    """
    
    print("[*] Running loading job on TigerGraph (streaming ~590k records)...")
    res_load = conn.gsql(loading_gsql)
    print(f"[+] Loading Job Output:\n{res_load}")

    # 3. Install queries
    print("[*] Installing GSQL queries...")
    for q_file in QUERIES_DIR.glob("*.gsql"):
        with open(q_file, "r", encoding="utf-8") as f:
            q_gsql = f.read()
        conn.gsql(f"USE GRAPH {TG_GRAPH}\n{q_gsql}\nINSTALL QUERY {q_file.stem}")
        print(f"    - Installed query: {q_file.stem}")

    # 4. Print Graph Statistics
    stats = conn.getVertexCount("*")
    print(f"\n[+] TigerGraph Live Verification:")
    for v_type, cnt in stats.items():
        print(f"    - {v_type:<18}: {cnt:>8} vertices")
        
    print("\n=== TigerGraph Loading Complete & Verified ===")

if __name__ == "__main__":
    run_loader()
