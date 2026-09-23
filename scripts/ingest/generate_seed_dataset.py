"""Dataset Ingestion & Synthetic Benchmark Seed Generator.

Populates TigerGraph graph vertices and edges with high-fidelity IEEE-CIS structured
transactions, entity relationships, the 5 canonical fraud typologies, closed historical
investigations, and all 20 challenge benchmark cases.
"""

from typing import Any, Dict, List
import os
import sys
import json
import random
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.graph.client import get_default_graph_client, InMemoryTigerGraphSimulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SeedDataset")


def build_and_seed_dataset(export_dir: str = "data/processed") -> Dict[str, Any]:
    """Generates synthetic IEEE-CIS dataset and populates the graph engine."""
    client = get_default_graph_client()
    os.makedirs(export_dir, exist_ok=True)
    random.seed(42)

    logger.info("Initializing Seed Dataset Generation...")

    customers = []
    accounts = []
    cards = []
    devices = []
    ips = []
    merchants = []
    transactions = []
    historical_cases = []
    benchmark_cases = []

    # 1. Base Pools
    card_brands = ["visa", "mastercard", "discover", "amex"]
    device_types = ["desktop", "mobile", "tablet"]
    browsers = ["Chrome 122.0", "Safari 17.2", "Firefox 124.0", "Edge 122.0"]
    os_list = ["Windows 11", "iOS 17.4", "Android 14", "macOS Sonoma"]

    # Generate 50 Merchants
    for m_i in range(1, 51):
        m_id = f"MERCH_{m_i:03d}"
        category = random.choice(["electronics", "retail", "digital_gaming", "travel", "grocery", "crypto_gateway"])
        risk = "HIGH" if category in ("crypto_gateway", "digital_gaming") else "LOW"
        m_data = {"id": m_id, "category": category, "risk_level": risk, "terminal_count": random.randint(1, 10)}
        merchants.append(m_data)
        if isinstance(client, InMemoryTigerGraphSimulator):
            client.add_vertex("Merchant", m_id, m_data)

    # Generate 150 Devices
    for d_i in range(1, 151):
        d_id = f"DEV_{d_i:04d}"
        is_emu = (d_i <= 10)  # first 10 are emulator bots
        d_data = {
            "id": d_id,
            "device_type": "emulator" if is_emu else random.choice(device_types),
            "os_name": "Linux/Android Emulator" if is_emu else random.choice(os_list),
            "browser_name": "HeadlessChrome" if is_emu else random.choice(browsers),
            "screen_resolution": "800x600" if is_emu else "1920x1080",
            "is_emulator": is_emu
        }
        devices.append(d_data)
        if isinstance(client, InMemoryTigerGraphSimulator):
            client.add_vertex("Device", d_id, d_data)

    # Generate 100 IPs
    for ip_i in range(1, 101):
        ip_addr = f"198.51.{ip_i // 256}.{ip_i % 256 + 10}"
        ip_type = "DATACENTER_PROXY" if ip_i <= 15 else "RESIDENTIAL"
        reputation = 0.20 if ip_type == "DATACENTER_PROXY" else 0.90
        ip_data = {"id": ip_addr, "ip_type": ip_type, "country_code": "US", "isp": "CloudProxy LLC" if ip_i <= 15 else "Comcast", "reputation": reputation}
        ips.append(ip_data)
        if isinstance(client, InMemoryTigerGraphSimulator):
            client.add_vertex("IP", ip_addr, ip_data)

    # Generate 100 Customers & Accounts
    for c_i in range(1, 101):
        c_id = f"CUST_{c_i:04d}"
        a_id = f"ACCT_{c_i:04d}"
        card_id = f"CARD_{c_i:04d}"

        c_data = {
            "id": c_id,
            "first_name": f"User{c_i}",
            "last_name": f"Client{c_i}",
            "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "risk_tier": "HIGH" if c_i <= 15 else "LOW",
            "created_at": 1700000000 + c_i * 86400
        }
        customers.append(c_data)

        a_data = {
            "id": a_id,
            "account_type": "checking",
            "status": "ACTIVE",
            "balance": round(random.uniform(500.0, 25000.0), 2)
        }
        accounts.append(a_data)

        card_data = {
            "id": card_id,
            "bin": f"4{random.randint(10000, 99999)}",
            "issuer": random.choice(["Chase", "BankOfAmerica", "WellsFargo", "Citibank"]),
            "brand": random.choice(card_brands),
            "category": "credit"
        }
        cards.append(card_data)

        if isinstance(client, InMemoryTigerGraphSimulator):
            client.add_vertex("Customer", c_id, c_data)
            client.add_vertex("Account", a_id, a_data)
            client.add_vertex("Card", card_id, card_data)
            client.add_edge("Customer", c_id, "Account", a_id, "OWNS")

    # 2. Seed Baseline Normal Transactions
    logger.info("Generating baseline background transactions...")
    txn_counter = 100001
    for a_entry in accounts[:60]:
        c_id = a_entry["id"].replace("ACCT_", "CUST_")
        card_id = a_entry["id"].replace("ACCT_", "CARD_")
        for _ in range(random.randint(2, 5)):
            t_id = f"TXN_{txn_counter}"
            amt = round(random.uniform(15.0, 350.0), 2)
            ts = 1710000000 + random.randint(1000, 500000)
            dev = random.choice(devices[15:])
            ip = random.choice(ips[15:])
            merch = random.choice(merchants)

            t_data = {
                "id": t_id, "amount": amt, "timestamp": ts, "product_code": "W",
                "risk_score": round(random.uniform(0.05, 0.28), 3), "billing_region": "CA",
                "dist1": 5.2, "dist2": 0.0
            }
            transactions.append(t_data)

            if isinstance(client, InMemoryTigerGraphSimulator):
                client.add_vertex("Transaction", t_id, t_data)
                client.add_edge("Account", a_entry["id"], "Transaction", t_id, "PERFORMS_TRANSACTION", {"timestamp": ts})
                client.add_edge("Transaction", t_id, "Card", card_id, "USES_CARD")
                client.add_edge("Transaction", t_id, "Device", dev["id"], "USES_DEVICE")
                client.add_edge("Transaction", t_id, "IP", ip["id"], "ORIGINATES_FROM_IP")
                client.add_edge("Transaction", t_id, "Merchant", merch["id"], "INVOLVES_MERCHANT")
            txn_counter += 1

    # 3. Seed Canonical Fraud Patterns for the 20 Benchmark Cases
    logger.info("Seeding 5 Canonical Fraud Patterns & 20 Benchmark Cases...")

    pattern_specs = [
        ("SYNTH_ID_SYNDICATE", "Synthetic Identity Syndicate", "CRITICAL", "Disparate nominal customers sharing forged identity tokens and hardware"),
        ("DEVICE_FARM", "Device Emulation Farm", "CRITICAL", "Automated device cycling cards and proxies in rapid bursts"),
        ("CARD_TESTING", "Velocity Card Testing", "HIGH", "High-frequency micro-charges testing validity of stolen card batches"),
        ("MULE_DISPERSAL", "Rapid Mule Dispersal", "CRITICAL", "Immediate fund fragmentation and wire dispersion to foreign off-ramps"),
        ("ATO_ADDRESS_LAUNDER", "Account Takeover & Address Launder", "HIGH", "Credential hijack followed by sudden address redirection and luxury purchases")
    ]

    for p_id, p_name, p_sev, p_desc in pattern_specs:
        p_data = {"id": p_id, "name": p_name, "severity": p_sev, "description": p_desc}
        if isinstance(client, InMemoryTigerGraphSimulator):
            client.add_vertex("FraudPattern", p_id, p_data)
            client.patterns[p_id] = p_data

    # Generate 20 Benchmark Cases (Months 5-6)
    benchmark_scenarios = [
        # (Case_ID, Subject_Cust, Pattern_Type, Risk_Score, Injected Description, Expected Action)
        ("CASE-001", "CUST_0001", "DEVICE_FARM", 0.94, "Device Farm Bot: 8 stolen credit cards tested on emulated device within 45 minutes", "BLOCK_TRANSACTION"),
        ("CASE-002", "CUST_0002", "SYNTH_ID_SYNDICATE", 0.88, "Synthetic Ring: 4 nominal accounts created with recycled phone & delivery address", "BLOCK_ACCOUNT"),
        ("CASE-003", "CUST_0003", "ATO_ADDRESS_LAUNDER", 0.73, "Uncertain ATO: Unusual international IP login, changed shipping address; requires OTP challenge", "REQUEST_STEP_UP_AUTH"),
        ("CASE-004", "CUST_0004", "MULE_DISPERSAL", 0.92, "Rapid Mule Outflow: $12,500 inbound wire split into 4 outbound transfers within 20 mins", "FILE_REPORT"),
        ("CASE-005", "CUST_0005", "CARD_TESTING", 0.85, "Velocity Card Testing: 14 charges of $1.50 across digital gaming terminal in 3 mins", "BLOCK_TRANSACTION"),
        ("CASE-006", "CUST_0006", "BENIGN_TRAVELER", 0.22, "False Positive Check: High-value transaction at luxury hotel from legitimate verified cardholder", "ALLOW_TRANSACTION"),
        ("CASE-007", "CUST_0007", "SHARED_HOUSEHOLD", 0.35, "Ambiguous: Family member device reuse across two legitimate household accounts", "MONITOR_TRANSACTION"),
        ("CASE-008", "CUST_0008", "DEVICE_FARM", 0.91, "Automated Credential Stuffer cycling 12 cards on headless Linux browser", "BLOCK_TRANSACTION"),
        ("CASE-009", "CUST_0009", "SYNTH_ID_SYNDICATE", 0.86, "Synthetic Identity Syndicate targeting consumer electronic lines of credit", "BLOCK_ACCOUNT"),
        ("CASE-010", "CUST_0010", "CARD_TESTING", 0.82, "Automated card validation probe on streaming subscription platform", "BLOCK_TRANSACTION"),
        ("CASE-011", "CUST_0011", "MULE_DISPERSAL", 0.89, "Cryptocurrency Layering: Layered wire transfers to unregulated crypto exchange", "FILE_REPORT"),
        ("CASE-012", "CUST_0012", "ATO_ADDRESS_LAUNDER", 0.78, "Compromised credential login ordering $3,200 hardware to newly added courier hub", "REQUEST_STEP_UP_AUTH"),
        ("CASE-013", "CUST_0013", "BENIGN_SPIKE", 0.18, "Holiday Shopping Surge: Rapid back-to-back purchases at major department store", "ALLOW_TRANSACTION"),
        ("CASE-014", "CUST_0014", "DEVICE_FARM", 0.95, "Prepaid Card Exhaustion: Single mobile emulator laundering stolen gift cards", "BLOCK_TRANSACTION"),
        ("CASE-015", "CUST_0015", "SYNTH_ID_SYNDICATE", 0.87, "Fabricated Bureau Profile using deceased individual SSN and commercial drop address", "BLOCK_ACCOUNT"),
        ("CASE-016", "CUST_0016", "ATO_ADDRESS_LAUNDER", 0.93, "Confirmed ATO: Password reset, email changed, $4,800 purchase attempted immediately", "BLOCK_ACCOUNT"),
        ("CASE-017", "CUST_0017", "MULE_DISPERSAL", 0.90, "Funnel Account: 6 regional P2P inflows immediately transferred to foreign beneficiary", "FILE_REPORT"),
        ("CASE-018", "CUST_0018", "CARD_TESTING", 0.84, "Charity Donation Attack: Automated bot testing 25 stolen cards with $2 donations", "BLOCK_TRANSACTION"),
        ("CASE-019", "CUST_0019", "AMBIGUOUS_MERCHANT", 0.64, "Borderline Risk: New digital goods merchant, unverified customer phone; requires validation", "REQUEST_CUSTOMER_VALIDATION"),
        ("CASE-020", "CUST_0020", "MULTI_PATTERN_SYNDICATE", 0.98, "Full-Scale Coordinated Attack: Device Farm + Synthetic IDs + Mule Funnel Network", "BLOCK_ACCOUNT")
    ]

    for idx, (c_id, cust_id, p_type, r_score, desc, exp_action) in enumerate(benchmark_scenarios, start=1):
        txn_id = f"TXN_BENCH_{idx:03d}"
        acct_id = cust_id.replace("CUST_", "ACCT_")
        card_id = cust_id.replace("CUST_", "CARD_")

        # Select devices & IPs based on pattern
        if "DEVICE_FARM" in p_type or "MULTI" in p_type:
            dev = devices[0]  # emulator
            ip = ips[0]      # proxy
        elif "SYNTH" in p_type:
            dev = devices[1]
            ip = ips[1]
        else:
            dev = devices[idx + 10]
            ip = ips[idx + 10]

        amt = 1.50 if "CARD_TESTING" in p_type else (12500.0 if "MULE" in p_type else round(random.uniform(150.0, 3200.0), 2))
        ts = 1715000000 + idx * 3600

        t_data = {
            "id": txn_id, "amount": amt, "timestamp": ts, "product_code": "W",
            "risk_score": r_score, "billing_region": "NY", "dist1": 25.0 if "ATO" in p_type else 2.0,
            "dist2": 350.0 if "ATO" in p_type else 0.0
        }
        transactions.append(t_data)

        case_obj = {
            "case_id": c_id,
            "trigger_txn_id": txn_id,
            "subject_customer_id": cust_id,
            "pattern": p_type,
            "risk_score": r_score,
            "confidence": 0.50 if r_score in (0.64, 0.73) else round(min(0.96, r_score + 0.05), 2),
            "status": "INVESTIGATING",
            "scenario_description": desc,
            "expected_action": exp_action,
            "created_at": ts
        }
        benchmark_cases.append(case_obj)

        if isinstance(client, InMemoryTigerGraphSimulator):
            client.add_vertex("Transaction", txn_id, t_data)
            client.add_edge("Account", acct_id, "Transaction", txn_id, "PERFORMS_TRANSACTION", {"timestamp": ts})
            client.add_edge("Transaction", txn_id, "Card", card_id, "USES_CARD")
            client.add_edge("Transaction", txn_id, "Device", dev["id"], "USES_DEVICE")
            client.add_edge("Transaction", txn_id, "IP", ip["id"], "ORIGINATES_FROM_IP")
            client.add_edge("Transaction", txn_id, "Merchant", merchants[0]["id"], "INVOLVES_MERCHANT")

            # Link pattern & case vertex
            client.add_vertex("Case", c_id, case_obj)
            client.cases[c_id] = case_obj
            client.add_edge("Transaction", txn_id, "Case", c_id, "FLAGGED_IN_CASE")
            client.add_edge("Case", c_id, "Customer", cust_id, "INVOLVES_ENTITY")
            if p_type in client.patterns:
                client.add_edge("Case", c_id, "FraudPattern", p_type, "IDENTIFIED_PATTERN", {"confidence": r_score})

        # If Mule Dispersal, seed rapid outflow transfers
        if "MULE" in p_type:
            for out_i in range(1, 4):
                out_id = f"{txn_id}_OUT_{out_i}"
                out_amt = 3500.0
                out_ts = ts + out_i * 300
                out_data = {
                    "id": out_id, "amount": out_amt, "timestamp": out_ts,
                    "product_code": "R", "risk_score": 0.88, "billing_region": "NY",
                    "dist1": 0.0, "dist2": 0.0
                }
                transactions.append(out_data)
                if isinstance(client, InMemoryTigerGraphSimulator):
                    client.add_vertex("Transaction", out_id, out_data)
                    client.add_edge("Account", acct_id, "Transaction", out_id, "PERFORMS_TRANSACTION", {"timestamp": out_ts})

        # Also register in CaseService DB
        from backend.app.cases.service import get_case_service
        from backend.app.schemas.case import CaseStatus
        case_svc = get_case_service()
        c_record = case_svc.create_case(
            case_id=c_id,
            trigger_txn_id=txn_id,
            subject_customer_id=cust_id,
            initial_risk=r_score,
            initial_confidence=0.50 if r_score in (0.64, 0.73) else round(min(0.96, r_score + 0.05), 2)
        )
        c_record.status = CaseStatus.INVESTIGATING
        case_svc.update_case(c_record)

    # 4. Seed Historical Closed Cases (Months 1-4) for Case Memory
    logger.info("Seeding 10 Historical Closed Cases for Case Memory...")
    for h_i in range(1, 11):
        h_id = f"CASE_HIST_{h_i:03d}"
        p_choice = pattern_specs[(h_i - 1) % len(pattern_specs)][0]
        outcome = "CONFIRMED_FRAUD" if h_i <= 8 else "CLEARED_FALSE_POSITIVE"
        h_case = {
            "case_id": h_id,
            "trigger_txn_id": f"TXN_HIST_{h_i:03d}",
            "subject_customer_id": f"CUST_{h_i + 30:04d}",
            "pattern": p_choice,
            "risk_score": 0.88 if outcome == "CONFIRMED_FRAUD" else 0.25,
            "confidence": 0.92,
            "status": "CLOSED",
            "final_outcome": outcome,
            "created_at": 1705000000 + h_i * 86400,
            "closed_at": 1705000000 + h_i * 86400 + 7200
        }
        historical_cases.append(h_case)
        if isinstance(client, InMemoryTigerGraphSimulator):
            client.cases[h_id] = h_case
            client.add_vertex("Case", h_id, h_case)
            if p_choice in client.patterns:
                client.add_edge("Case", h_id, "FraudPattern", p_choice, "IDENTIFIED_PATTERN", {"confidence": 0.90})

    # Export to data/processed for inspection
    with open(os.path.join(export_dir, "benchmark_cases.json"), "w") as f:
        json.dump(benchmark_cases, f, indent=2)

    with open(os.path.join(export_dir, "historical_cases.json"), "w") as f:
        json.dump(historical_cases, f, indent=2)

    logger.info(f"Dataset Seeding Complete! {len(benchmark_cases)} benchmark cases and {len(historical_cases)} historical memory cases seeded.")
    return {
        "benchmark_cases_count": len(benchmark_cases),
        "historical_cases_count": len(historical_cases),
        "customers_count": len(customers),
        "devices_count": len(devices),
        "merchants_count": len(merchants),
        "transactions_count": len(transactions)
    }


if __name__ == "__main__":
    res = build_and_seed_dataset()
    print("Seed Output:", json.dumps(res, indent=2))
