import React, { useState } from "react";
import type { SubgraphData } from "../types";
import { Play, RotateCcw, CheckCircle2 } from "lucide-react";
import { runInvestigation, fetchCaseGraph } from "../services/api";
import { GraphViewer } from "./GraphViewer";
import { TimelineViewer } from "./TimelineViewer";

interface DemoWalkthroughProps {
  onSelectCase?: (caseId: string) => void;
}

const DEMO_CASES = [
  { id: "CASE-001", name: "CASE-001: Device Emulation Farm (8 Cards Cycled)", defaultAction: "BLOCK_TRANSACTION" },
  { id: "CASE-002", name: "CASE-002: Synthetic Identity Syndicate (Shared Address)", defaultAction: "BLOCK_ACCOUNT" },
  { id: "CASE-003", name: "CASE-003: ATO with Uncertainty -> Step-Up Auth Loop", defaultAction: "BLOCK_TRANSACTION" },
  { id: "CASE-004", name: "CASE-004: Rapid Mule Dispersal ($12,500 Outflows -> SAR)", defaultAction: "FILE_REPORT" },
  { id: "CASE-005", name: "CASE-005: Velocity Card Testing (14 Micro-Charges)", defaultAction: "BLOCK_TRANSACTION" },
  { id: "CASE-006", name: "CASE-006: High-Value Traveler (False Positive Cleared)", defaultAction: "ALLOW_TRANSACTION" },
  { id: "CASE-020", name: "CASE-020: Multi-Pattern Syndicate (Enterprise Attack)", defaultAction: "BLOCK_ACCOUNT" }
];

export const DemoWalkthrough: React.FC<DemoWalkthroughProps> = () => {
  const [selectedCaseId, setSelectedCaseId] = useState("CASE-003");
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [investigationData, setInvestigationData] = useState<any>(null);
  const [graphData, setGraphData] = useState<SubgraphData | null>(null);

  const STEPS = [
    { title: "[01] SIGNAL INGESTED", desc: "Incoming transaction fraud alert detected. Case docket opened in state INVESTIGATING." },
    { title: "[02] NETWORK EXPANSION", desc: "TigerGraph multi-hop neighborhood traversed via GSQL and Model Context Protocol." },
    { title: "[03] PATTERN & GUARDRAILS", desc: "Matched against 5 canonical typologies; retrieved institutional policy mandates." },
    { title: "[04] UNCERTAINTY LOOP", desc: "Risk is elevated but confidence below threshold. Triggered customer challenge." },
    { title: "[05] NEXT MOVE & LEDGER", desc: "Confidence upgraded. Proposed NBA, requested clearance, and sealed SHA-256 block." }
  ];

  const handleStart = async () => {
    setIsRunning(true);
    setCurrentStep(1);

    try {
      // Step 1: Initial Graph Load
      const g = await fetchCaseGraph(selectedCaseId, 2);
      setGraphData(g);
      setCurrentStep(2);

      // Step 2-4: Execute Investigation
      const inv = await runInvestigation(selectedCaseId, true, true);
      setInvestigationData(inv);
      setCurrentStep(3);

      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(4);

      // Conclude demo run
      setCurrentStep(5);
    } catch (e) {
      console.error("Demo run error:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setInvestigationData(null);
    setGraphData(null);
  };

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      {/* Demo Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="font-mono" style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.04em" }}>
            TRIALS // LIVE DEMO RUNNER
          </h2>
          <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Autonomous Closed-Loop Graph Investigation Demonstrable in 15 Deterministic Steps (&lt; 3 Min)
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={selectedCaseId}
            onChange={(e) => { setSelectedCaseId(e.target.value); handleReset(); }}
            className="font-mono"
            style={{
              background: "var(--bg-tertiary)",
              color: "#fff",
              border: "1px solid var(--border-color)",
              padding: "8px 12px",
              borderRadius: 0,
              fontSize: "0.8rem",
              fontWeight: 700
            }}
          >
            {DEMO_CASES.map((dc) => (
              <option key={dc.id} value={dc.id}>{dc.name}</option>
            ))}
          </select>

          <button className="btn-primary" style={{ borderRadius: 0 }} onClick={handleStart} disabled={isRunning || currentStep === 5}>
            <Play size={14} /> RUN TRIAL
          </button>
          <button className="btn-secondary" style={{ borderRadius: 0 }} onClick={handleReset}>
            <RotateCcw size={14} /> RESET
          </button>
        </div>
      </div>

      {/* 5-Step Agent Progress Flow */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div
              key={idx}
              style={{
                background: isCurrent ? "rgba(0, 242, 254, 0.15)" : (isDone ? "rgba(16, 185, 129, 0.1)" : "var(--bg-tertiary)"),
                border: `1px solid ${isCurrent ? "var(--accent-cyan)" : (isDone ? "var(--accent-emerald)" : "var(--border-color)")}`,
                borderRadius: 0,
                padding: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {isDone ? (
                  <CheckCircle2 size={13} color="var(--accent-emerald)" />
                ) : (
                  <span
                    className="font-mono"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 0,
                      background: isCurrent ? "var(--accent-cyan)" : "var(--border-color)",
                      color: isCurrent ? "#000" : "#fff",
                      fontSize: "0.68rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700
                    }}
                  >
                    {stepNum}
                  </span>
                )}
                <span className="font-mono" style={{ fontSize: "0.72rem", fontWeight: 700, color: isCurrent ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
                  STEP 0{stepNum}
                </span>
              </div>
              <div className="font-mono" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {s.title}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Demo Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, minHeight: 420 }}>
        {/* Left: TigerGraph Neighborhood Visualization */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
            TigerGraph Traversed Neighborhood:
          </div>
          <GraphViewer data={graphData} height={380} />
        </div>

        {/* Right: Real-Time Results & Agent Rationale */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Agent Timeline */}
          <div className="glass-panel" style={{ padding: 14 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8 }}>
              Live Agent Execution Log:
            </div>
            <TimelineViewer timeline={investigationData?.timeline || []} />
          </div>

          {/* Outcome & Decision Summary */}
          {investigationData && (
            <div className="glass-panel" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                  Autonomous Next-Best Action Recommendation:
                </span>
                <span className="status-badge critical">
                  Risk: {investigationData.case.risk_score} | Conf: {investigationData.case.confidence}
                </span>
              </div>

              {investigationData.recommended_actions.map((act: any, i: number) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid var(--accent-indigo)",
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 8
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: "0.85rem" }}>
                    {act.action} — Priority: {act.priority}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 4 }}>
                    {act.reason}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                    Requires Approval: {act.approval_required ? act.approval_route : "None"} | Policy Basis: {act.policy_basis.join(", ")}
                  </div>
                </div>
              ))}

              {investigationData.sar_docket && (
                <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.4)", borderRadius: 6, padding: 8, fontSize: "0.75rem", color: "var(--accent-rose)" }}>
                  FinCEN SAR Generated: Aggregate activity exceeds $5,000 BSA threshold. Docket ready for Fraud Manager sign-off.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
