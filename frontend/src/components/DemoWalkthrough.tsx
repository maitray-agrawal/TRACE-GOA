import React, { useState } from "react";
import type { SubgraphData } from "../types";
import { Play, RotateCcw, CheckCircle2, Compass, ShieldCheck } from "lucide-react";
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
    { title: "01 SIGNAL INGESTED", desc: "Incoming transaction fraud alert detected. Case docket opened in state INVESTIGATING." },
    { title: "02 NETWORK EXPANSION", desc: "TigerGraph multi-hop neighborhood traversed via GSQL and Model Context Protocol." },
    { title: "03 PATTERN & GUARDRAILS", desc: "Matched against 5 canonical typologies; retrieved institutional policy mandates." },
    { title: "04 UNCERTAINTY LOOP", desc: "Risk is elevated but confidence below threshold. Triggered customer challenge." },
    { title: "05 NEXT MOVE & LEDGER", desc: "Confidence upgraded. Proposed NBA, requested clearance, and sealed SHA-256 block." }
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
    setInvestigationData(null);
    setGraphData(null);
  };

  return (
    <div className="card-goa card-goa-paper p-6 border-3 border-ink shadow-goa select-none space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider bg-hot-pink text-paper px-2 py-0.5 rounded border border-ink">
              HACKATHON DEMO MODE
            </span>
            <h2 className="font-serif text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <Compass size={24} className="text-terracotta" />
              Live Trials Walkthrough // 5-Step Guided Demonstration
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 mt-1">
            Step through an end-to-end autonomous fraud investigation with live graph traversal, policy gating, and ledger sealing.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={handleReset}
              className="btn-goa bg-paper hover:bg-sand text-ink text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              RESET
            </button>
          )}

          <button
            onClick={handleStart}
            disabled={isRunning}
            className="btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-xs py-2 px-4 flex items-center gap-2 font-black uppercase tracking-wider"
          >
            <Play size={14} className={isRunning ? "animate-spin" : ""} />
            {isRunning ? "EXECUTING PIPELINE..." : "RUN GUIDED BENCHMARK"}
          </button>
        </div>
      </div>

      {/* Case Selector Dropdown/Chips */}
      <div className="flex flex-wrap items-center gap-2 bg-sand/40 p-3 rounded-lg border-2 border-ink">
        <span className="font-mono text-xs font-bold text-ink uppercase">Select Demo Benchmark:</span>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCaseId(c.id);
                handleReset();
              }}
              className={`font-mono text-[11px] px-2.5 py-1 rounded font-bold border-2 border-ink transition-all ${
                selectedCaseId === c.id
                  ? "bg-sun-yellow text-ink shadow-2xs -translate-y-0.5"
                  : "bg-paper text-ink/70 hover:bg-sand/60"
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Step Progress Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep >= stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border-2 border-ink transition-all relative ${
                isDone
                  ? "bg-goa-green-200 border-goa-green-700 text-goa-green-900"
                  : isCurrent
                  ? "bg-sun-yellow border-ink text-ink shadow-goa-sm"
                  : "bg-paper border-ink/40 text-ink/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider">
                  {s.title}
                </span>
                {isDone && <CheckCircle2 size={13} className="text-goa-green-700" />}
              </div>
              <p className="font-sans text-[11px] leading-tight opacity-90">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Live Visual Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Graph View */}
        <div className="card-goa card-goa-sand p-4 border-2 border-ink flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-ink/20 pb-2 mb-2 font-mono text-xs font-black text-ink uppercase">
            <span>TIGERGRAPH 2-HOP TRAVERSAL ({graphData?.node_count || 0} NODES)</span>
            <span className="text-[10px] text-ink/60">LIVE TOPOLOGY</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <GraphViewer data={graphData} />
          </div>
        </div>

        {/* Right: Timeline & Outcome */}
        <div className="card-goa card-goa-sand p-4 border-2 border-ink flex flex-col h-[380px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/20 pb-2 mb-2 font-mono text-xs font-black text-ink uppercase">
            <span>AGENT REASONING TIMELINE</span>
            <span className="text-[10px] text-ink/60">STREAMED ACTIONS</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TimelineViewer timeline={investigationData?.timeline || []} />
          </div>
        </div>
      </div>

      {/* Final Outcome Summary Banner if Completed */}
      {currentStep === 5 && investigationData && (
        <div className="p-4 bg-goa-green-200 border-3 border-ink rounded-xl shadow-goa space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-goa-green-700" />
              <span className="font-serif text-lg font-black text-ink">
                Autonomous Investigation Successfully Concluded // Verdict: {investigationData.case?.final_outcome || "VERIFIED"}
              </span>
            </div>
            <span className="font-mono text-xs bg-paper px-2.5 py-1 rounded border border-ink font-bold text-ink">
              CONFIDENCE: {Math.round((investigationData.case?.confidence || 0.85) * 100)}%
            </span>
          </div>
          <p className="font-sans text-xs text-ink/90">
            {investigationData.case?.findings?.[0] || "All graph signals analyzed. Next-best action formulated under policy guardrails."}
          </p>
        </div>
      )}
    </div>
  );
};
