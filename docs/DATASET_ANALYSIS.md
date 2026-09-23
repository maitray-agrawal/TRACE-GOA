# HHGOA Dataset Analysis: IEEE-CIS Structure & Entity Dynamics

This document provides a deep structural analysis of the **HHGOA IEEE-CIS Fraud Detection dataset**, detailing entity resolution, temporal distributions, the 5 canonical fraud typologies, and the 20 benchmark investigation cases.

---

## 1. High-Level Dataset Profile

- **Total Volume**: ~590,000 transaction records
- **Temporal Horizon**: 180 continuous days (6 calendar months) represented by `TransactionDT` (seconds offset from reference start)
- **Customer Population**: ~13,500 reconstructed cardholders/identities
- **Feature Categories**:
  - Financial: `TransactionAmt`, `ProductCD` (Product types: W [Web], C [Card/Phone], R [Reload], H [Health/Travel], S [Subscription])
  - Identity / Network: `card1` - `card6`, `addr1` (billing region), `addr2` (billing country), `dist1` (billing-to-transaction distance), `dist2` (billing-to-shipping distance), `P_emaildomain`, `R_emaildomain`
  - Behavioral Counts: `C1` - `C14` (transaction velocity, card counts)
  - Timed Delays: `D1` - `D15` (time deltas from prior transactions/card issuance)
  - Match Flags: `M1` - `M9` (address match, cardholder name match)
  - Vesta Engineered Scores: `V1` - `V339` (rich transaction and device interaction signals)
  - Identity Table: `DeviceType`, `DeviceInfo`, `id_01` to `id_38` (browser version, OS, IP subnet, hardware fingerprint)

---

## 2. Entity Resolution & Graph Construction

Because the IEEE-CIS dataset does not provide an explicit `CustomerID` or `AccountID` column out-of-the-box, the ingestion layer performs deterministic entity resolution:

```text
               ┌───────────────────────┐
               │    card1 (BIN code)   │
               │   + card2 (Issuer)    │
               │   + card3 (Country)   │
               │   + card4 (Brand)     │
               │   + card6 (Category)  │
               └───────────┬───────────┘
                           │ Hash Fingerprint
                           ▼
                     [ Card Entity ]
                           ▲
                           │ Linked via billing address & email
               ┌───────────┴───────────┐
               │    addr1 (Region)     │
               │  + P_emaildomain      │
               │  + D1 delta curve     │
               └───────────┬───────────┘
                           │ Resolution
                           ▼
                  [ Customer Entity ]
                           │
                           ▼
                   [ Account Entity ]
```

### Deterministic Linkage Rules:
1. **Card Resolution**: Two transactions sharing identical `(card1, card2, card3, card4, card6)` map to the same `Card` vertex.
2. **Customer Linkage**: Transactions sharing the same `Card` AND the same `(addr1, P_emaildomain)` map to a single `Customer` vertex.
3. **Device Linkage**: Transactions sharing `(DeviceInfo, id_30, id_31, id_33)` map to the same `Device` vertex.
4. **Network Linkage**: Transactions sharing the same `/24` subnet or external IP map to the same `IP` vertex.

---

## 3. The 5 Canonical Fraud Typologies

The system implements specialized deterministic detection logic for each of the 5 canonical fraud patterns documented in the challenge:

### Pattern 1: Synthetic Identity Syndicate (`SYNTH_ID_SYNDICATE`)
- **Mechanism**: Bad actors combine real and fabricated credentials (e.g. valid SSN format with newly fabricated names and burner email accounts).
- **Graph Footprint**: Disconnected `Customer` vertices sharing a common `Device`, `IP`, or physical delivery `Address`.
- **Temporal Signal**: Accounts opened within a narrow timeframe exhibiting low initial activity, followed by sudden credit utilization.
- **Evidence Threshold**: $\ge 3$ distinct customers sharing 1 device/IP, combined with mismatched name/address verification scores.

### Pattern 2: Device Emulation Farm (`DEVICE_FARM`)
- **Mechanism**: Automated scripts running on Android emulators or headless browsers cycling device fingerprints and proxy IPs to evade velocity blocks.
- **Graph Footprint**: High degree centrality on a single `Device` or IP subnet connected to numerous distinct `Card` and `Account` vertices.
- **Technical Signals**: Emulated hardware parameters (e.g., standard generic screen resolutions, Linux kernel signatures with Android user agents, missing WebGL extensions).
- **Evidence Threshold**: $> 5$ distinct payment cards utilized on 1 device within a 24-hour rolling window.

### Pattern 3: Velocity Card Testing (`CARD_TESTING`)
- **Mechanism**: Fraudsters test stolen card dumps using automated bots against low-friction e-commerce merchants with small transactions to verify active status.
- **Graph Footprint**: Sequential micro-transactions across different cards originating from a single IP cluster directed at common merchants.
- **Temporal Signal**: High frequency (e.g., transactions every 15–45 seconds) with low dollar amounts ($0.50 – $5.00) and elevated decline rates.
- **Evidence Threshold**: $\ge 4$ transactions under $10 in $< 5$ minutes from same IP/Device.

### Pattern 4: Rapid Mule Dispersal (`MULE_DISPERSAL`)
- **Mechanism**: Layering technique where stolen or defrauded funds are deposited into an intermediary "mule" account and immediately dispersed to multiple foreign or crypto-off-ramp accounts.
- **Graph Footprint**: Bipartite star graph: large inbound transaction node immediately followed by multiple outbound outgoing transfers.
- **Temporal Signal**: Dwell time of funds in the account $< 30$ minutes.
- **Evidence Threshold**: Large inflow transaction ($> $2,500) followed by $\ge 3$ outbound transfers dispersing $> 85\%$ of funds within 1 hour.

### Pattern 5: Account Takeover & Address Laundering (`ATO_ADDRESS_LAUNDER`)
- **Mechanism**: Credential stuffing or SIM swap grants access to an established account; attacker alters delivery address to a drop site and orders high-value goods.
- **Graph Footprint**: Abrupt change in device graph edge (`Customer` -> `Device_A` switches to `Device_B` with 0 prior history) and shipping address vertex divergence from historical billing address (`dist2 > 200 miles`).
- **Temporal Signal**: Transaction executed within 2 hours of password or address modification.
- **Evidence Threshold**: Transaction from previously unseen device/IP + modified delivery address + high transaction amount ($> 3\times$ customer 90-day mean).

---

## 4. Benchmark Cases Structure (Cases 01–20)

The 20 benchmark test cases represent high-complexity investigation scenarios drawn from months 5 and 6 of the dataset:

| Case ID | Primary Subject | Injected / Observed Typology | Expected Ambiguity / Key Test |
| :--- | :--- | :--- | :--- |
| `CASE-001` | TXN_501001 / CUST_1082 | Device Farm | 8 cards tested across 2 hours; requires immediate blocking |
| `CASE-002` | TXN_501045 / CUST_2401 | Synthetic Identity | Shared burner phone & device across 4 accounts |
| `CASE-003` | TXN_502120 / CUST_3819 | ATO + Address Launder | Legitimate user traveled abroad? Needs step-up auth first! |
| `CASE-004` | TXN_503340 / CUST_4910 | Rapid Mule Dispersal | $8,500 wire in, 4 rapid outflows; requires SAR + account freeze |
| `CASE-005` | TXN_504105 / CUST_5122 | Velocity Card Testing | 12 $1.20 transactions in 3 minutes; automated bot attack |
| `CASE-006` | TXN_505290 / CUST_6391 | Benign High-Value Traveler | High amount + new IP, but matching device & biometrics; Cleared |
| `CASE-007` | TXN_506411 / CUST_7104 | Shared Household Device | Family members sharing iPad; initial ambiguity, cleared on verification |
| `CASE-008` | TXN_507820 / CUST_8290 | Device Farm + ATO | Hybrid attack: credential stuffing via automated farm |
| `CASE-009` | TXN_508910 / CUST_9011 | Synthetic Identity Syndicate | 5 shell accounts applying for credit lines |
| `CASE-010` | TXN_510200 / CUST_1042 | Velocity Card Testing | Micro-charges on subscription product CD 'S' |
| `CASE-011` | TXN_511450 / CUST_1150 | Rapid Mule Dispersal | Coordinated multi-hop transfer to crypto off-ramp |
| `CASE-012` | TXN_512800 / CUST_1289 | ATO + Address Launder | Password reset 10 mins prior to $2,400 laptop purchase |
| `CASE-013` | TXN_513920 / CUST_1340 | False Positive / Merchant Spike | Black Friday seasonal spike, legitimate cardholder history |
| `CASE-014` | TXN_515100 / CUST_1499 | Device Farm | 15 stolen debit cards cycled through prepaid merchant |
| `CASE-015` | TXN_516240 / CUST_1578 | Synthetic Identity | Mismatched credit bureau name with recycled utility bill address |
| `CASE-016` | TXN_517500 / CUST_1623 | ATO + High Velocity | Compromised executive account ordering gift cards |
| `CASE-017` | TXN_518900 / CUST_1701 | Rapid Mule Dispersal | Funneling student accounts to central cash-out point |
| `CASE-018` | TXN_520100 / CUST_1811 | Velocity Card Testing | Batch card testing targeting donation portal |
| `CASE-019` | TXN_521400 / CUST_1920 | Ambiguous Cross-Border Order | High risk score (0.72) but verified via step-up auth OTP |
| `CASE-020` | TXN_522800 / CUST_2005 | Coordinated Multi-Pattern Syndicate| Device Farm + Synthetic IDs + Mule Network (Complex multi-agent investigation) |

---

## 5. Dataset Validation Rules
1. Zero NaN values in critical identifiers (`TransactionID`, `TransactionDT`, `TransactionAmt`).
2. Timestamps must be monotonically increasing per customer timeline.
3. Every transaction must be linked to at least 1 Card, 1 Device, 1 IP, and 1 Merchant.
4. Investigation agents must never rely on ground-truth label flags during reasoning.
