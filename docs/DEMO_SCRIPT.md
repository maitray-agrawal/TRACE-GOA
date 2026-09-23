# HHGOA Hackathon 3–5 Minute Video Demo Script

**Title**: TigerGraph Agentic Fraud Investigation & Next-Best Action System  
**Target Duration**: 4 minutes 30 seconds  
**Demo Case**: `CASE-003` (Account Takeover with Uncertainty Loop) & `CASE-004` (Rapid Mule Dispersal -> SAR)  

---

## Timeline Breakdown

### [0:00 – 0:20] The Problem: Why Traditional Fraud Detection Fails
- **Visual**: Command Center Dashboard showing case docket queue with high-risk alerts.
- **Narrator**:
  > *"Every day, financial institutions lose billions to sophisticated fraud syndicates, while drowning in 85% false positive rates. Traditional rules are brittle, while generic AI chatbots hallucinate and lack relationship context. Today, we present the HHGOA Agentic Fraud Investigation System — an enterprise platform powered by TigerGraph, GraphRAG, and deterministic uncertainty loops that turns ambiguous fraud alerts into defensible, auditable action."*

---

### [0:20 – 0:45] Architecture & TigerGraph Integration
- **Visual**: Switch to Graph Explorer view showing multi-hop topology.
- **Narrator**:
  > *"At the core of our platform is TigerGraph. Rather than dumping raw database tables into an LLM, our agent uses TigerGraph MCP and GSQL queries to deterministically traverse 2-hop neighborhoods, uncover device reuse, identify shared identity rings, and run graph community clustering. This is combined with GraphRAG to ground decisions in federal compliance mandates like FinCEN BSA and Regulation E."*

---

### [0:45 – 1:30] Trigger Ingestion & Case Docket Creation
- **Visual**: Select `CASE-003` in the Case Queue, click "Investigate".
- **Narrator**:
  > *"Let's investigate Case 003. An incoming transaction alert arrives: a $2,400 electronics purchase from an unusual IP. The agent immediately initializes an auditable docket in our tamper-evident case service, setting its status to INVESTIGATING."*

---

### [1:30 – 2:20] Graph Investigation & Pattern Detection
- **Visual**: Zoom in on the interactive TigerGraph Canvas. Show nodes expanding (Customer, Card, Device, Shipping Address).
- **Narrator**:
  > *"The agent executes GSQL queries through TigerGraph MCP. Instantly, our graph expands: it reveals that while the card and customer account are legitimate, the shipping address is over 350 miles away from the cardholder's billing region, and the device fingerprint has no prior history. Our deterministic pattern engine flags potential Account Takeover & Address Laundering."*

---

### [2:20 – 2:50] The Uncertainty Engine & Additional Evidence Loop
- **Visual**: Evidence Board highlighting amber "Missing Evidence / Uncertainty" tag.
- **Narrator**:
  > *"Here is where our system differs fundamentally from a toy bot: it does NOT immediately freeze the customer's account. Because risk is high (0.73) but confidence is below our 0.70 threshold, the Uncertainty Engine initiates an Additional Evidence Loop. It puts a temporary hold on the transaction and issues an out-of-band step-up authentication challenge to the customer's verified mobile device."*

---

### [2:50 – 3:30] Simulated Evidence Response & Reassessment
- **Visual**: Agent timeline updates with `EVIDENCE_PROCESSOR` -> `REASSESSMENT`.
- **Narrator**:
  > *"The customer challenge expires without confirmation — a classic indicator of hostile device hijack. The agent processes this external signal and automatically triggers a reassessment. Notice the confidence score jumps from 50% to 88%!"*

---

### [3:30 – 4:10] Next-Best Action & Policy Enforcement
- **Visual**: Next-Best Action Cards appear on right panel (`BLOCK_TRANSACTION`, `ESCALATE_TO_ANALYST`).
- **Narrator**:
  > *"With conclusive evidence, the Next-Best Action Engine formulates a prioritized response: BLOCK_TRANSACTION. But the agent cannot unilaterally execute high-impact actions. Our deterministic PolicyEngine checks compliance rules: transaction blocking requires supervisory sign-off from a Senior Analyst."*

---

### [4:10 – 4:40] Role-Based Approval & Action Execution
- **Visual**: Click "Sign & Execute as SENIOR_ANALYST" in the Approval Center.
- **Narrator**:
  > *"Acting as Senior Analyst, we review the supporting evidence and electronically authorize the action. The transaction is declined at the payment gateway, customer access is secured, and the case docket transitions to ACTION_EXECUTED."*

---

### [4:40 – 5:00] Cryptographic Decision Ledger & Case Memory
- **Visual**: Switch to Decision Ledger tab. Click "Verify Cryptographic Integrity" — green checkmark appears.
- **Narrator**:
  > *"Every single reasoning step, graph query, and approval was cryptographically recorded using SHA-256 hash chaining. Clicking 'Verify Integrity' proves the entire chain of custody is untampered. Finally, the case is committed to persistent Case Memory, empowering our agent to recognize similar typologies in future investigations. This is the future of autonomous, explainable financial crime operations with TigerGraph."*
