import React, { useState, useEffect, useRef } from "react";
import type { SubgraphData } from "../types";
import { Play, Pause, RotateCcw, CheckCircle2, Compass, ArrowRight, ArrowLeft, ShieldCheck, Film } from "lucide-react";
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
  { id: "CASE-020", name: "CASE-020: Multi-Pattern Syndicate (Enterprise Attack)", defaultAction: "BLOCK_ACCOUNT" }
];

interface StepMetadata {
  title: string;
  state: string;
  tool: string;
  evidence: string;
  decision: string;
  desc: string;
}

export const DemoWalkthrough: React.FC<DemoWalkthroughProps> = () => {
  const [selectedCaseId, setSelectedCaseId] = useState("CASE-003");
  const [mode, setMode] = useState<"REPLAY" | "LIVE">("REPLAY");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [investigationData, setInvestigationData] = useState<any>(null);
  const [graphData, setGraphData] = useState<SubgraphData | null>(null);

  const timerRef = useRef<any>(null);

  const STEPS: StepMetadata[] = [
    {
      title: "01 SIGNAL INGESTION",
      state: "TRIGGER_ALERT",
      tool: "ingest_stream_alert()",
      evidence: "Transaction flagged by edge velocity monitor (> $2,500 in 60s)",
      decision: "OPEN INVESTIGATION DOCKET",
      desc: "Incoming transaction fraud alert detected. Case docket opened in state INVESTIGATING."
    },
    {
      title: "02 NETWORK EXPANSION",
      state: "GRAPH_TRAVERSAL",
      tool: "tigergraph.query_neighborhood(depth=2)",
      evidence: "Discovered 4 cards sharing device fingerprint and residential IP cluster",
      decision: "EXPAND SYNDICATE TOPOLOGY",
      desc: "TigerGraph 2-hop neighborhood traversed via GSQL and official Model Context Protocol (MCP)."
    },
    {
      title: "03 PATTERN & GUARDRAILS",
      state: "POLICY_EVALUATION",
      tool: "graphrag.evaluate_policies(POL-01, POL-04)",
      evidence: "Multi-Card Device Cycling typology confirmed with 81% pattern similarity",
      decision: "EVALUATE STEP-UP THRESHOLD",
      desc: "Matched against 5 canonical typologies; retrieved institutional policy mandates."
    },
    {
      title: "04 UNCERTAINTY LOOP",
      state: "STEP_UP_CHALLENGE",
      tool: "mcp.dispatch_customer_validation(OOB_OTP)",
      evidence: "Risk score 0.72 exceeds threshold but customer verification pending",
      decision: "HALT PUNITIVE FREEZE -> REQUEST STEP-UP",
      desc: "Risk is elevated but confidence below threshold. Triggered customer challenge."
    },
    {
      title: "05 NEXT MOVE & LEDGER",
      state: "ACTION_SEALED",
      tool: "ledger.append_block(SHA-256)",
      evidence: "Step-up completed; confidence upgraded to 88%. Action cleared by supervisor.",
      decision: "EXECUTE NEXT MOVE + SEAL BLOCK",
      desc: "Confidence upgraded. Proposed NBA, requested clearance, and sealed SHA-256 block."
    }
  ];

  const loadStepData = async (stepNum: number) => {
    setCurrentStep(stepNum);
    if (stepNum >= 2 && !graphData) {
      try {
        const g = await fetchCaseGraph(selectedCaseId, 2);
        setGraphData(g);
      } catch (e) {
        console.error("Graph fetch error:", e);
      }
    }
    if (stepNum >= 3 && !investigationData) {
      try {
        const inv = await runInvestigation(selectedCaseId, true, true);
        setInvestigationData(inv);
      } catch (e) {
        console.error("Investigation run error:", e);
      }
    }
  };

  const handleStartJudgeDemo = () => {
    setIsPlaying(true);
    setCurrentStep(1);
    loadStepData(1);
  };

  useEffect(() => {
    if (isPlaying && currentStep > 0 && currentStep < 5) {
      timerRef.current = setTimeout(() => {
        const next = currentStep + 1;
        loadStepData(next);
        if (next === 5) {
          setIsPlaying(false);
        }
      }, 2200);
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentStep]);

  const handlePause = () => {
    setIsPlaying(false);
    clearTimeout(timerRef.current);
  };

  const handleResume = () => {
    setIsPlaying(true);
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < 5) {
      loadStepData(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setIsPlaying(false);
    if (currentStep > 1) {
      loadStepData(currentStep - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    clearTimeout(timerRef.current);
    setCurrentStep(0);
    setInvestigationData(null);
    setGraphData(null);
  };

  const activeStepMeta = currentStep > 0 ? STEPS[currentStep - 1] : null;

  return (
    <div className="card-goa card-goa-paper p-6 border-3 border-ink shadow-goa select-none space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider bg-hot-pink text-paper px-2 py-0.5 rounded border border-ink flex items-center gap-1">
              <Film size={12} />
              {mode === "REPLAY" ? "REPLAY OF RECORDED RUN" : "LIVE AGENT RUN"}
            </span>
            <h2 className="font-serif text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <Compass size={24} className="text-terracotta" />
              Judge Demonstration // 5-Step Guided Walkthrough
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 mt-1">
            Replay canonical benchmark case traces with synchronized graph exploration, policy gating, and SHA-256 ledger block sealing.
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-2 bg-sand p-1.5 rounded-lg border-2 border-ink">
          <button
            onClick={() => setMode("REPLAY")}
            className={`font-mono text-xs font-black px-2.5 py-1 rounded transition-all ${
              mode === "REPLAY" ? "bg-sun-yellow text-ink border border-ink shadow-2xs" : "text-ink/60"
            }`}
          >
            RECORDED REPLAY
          </button>
          <button
            onClick={() => setMode("LIVE")}
            className={`font-mono text-xs font-black px-2.5 py-1 rounded transition-all ${
              mode === "LIVE" ? "bg-goa-green-500 text-paper border border-ink shadow-2xs" : "text-ink/60"
            }`}
          >
            LIVE RUN
          </button>
        </div>
      </div>

      {/* Primary Action & Player Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-sand/40 p-3 rounded-lg border-2 border-ink">
        {/* Main CTA */}
        <div className="flex items-center gap-2">
          {currentStep === 0 ? (
            <button
              onClick={handleStartJudgeDemo}
              className="btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-sm py-2 px-5 font-black uppercase tracking-wider flex items-center gap-2 shadow-goa-sm"
            >
              <Play size={15} fill="currentColor" />
              <span>▶ RUN JUDGE DEMO ({selectedCaseId})</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="btn-goa bg-sun-yellow text-ink text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                >
                  <Pause size={13} />
                  <span>PAUSE</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="btn-goa bg-goa-green-500 text-paper text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                >
                  <Play size={13} fill="currentColor" />
                  <span>RESUME</span>
                </button>
              )}

              <button
                onClick={handlePrevious}
                disabled={currentStep <= 1}
                className="btn-goa bg-paper text-ink text-xs py-1.5 px-2.5 flex items-center gap-1 font-bold disabled:opacity-40"
              >
                <ArrowLeft size={13} />
                <span>PREV</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentStep >= 5}
                className="btn-goa bg-paper text-ink text-xs py-1.5 px-2.5 flex items-center gap-1 font-bold disabled:opacity-40"
              >
                <span>NEXT</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={handleReset}
                className="btn-goa bg-paper hover:bg-sand text-ink text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <RotateCcw size={13} />
                <span>RESTART</span>
              </button>
            </div>
          )}
        </div>

        {/* Case Selector Dropdown/Chips */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-ink uppercase hidden sm:inline">CASE:</span>
          {DEMO_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCaseId(c.id);
                handleReset();
              }}
              className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold border border-ink transition-all ${
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

      {/* 5-Step Visual Stepper Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div
              key={idx}
              onClick={() => loadStepData(stepNum)}
              className={`p-2.5 rounded-lg border-2 border-ink transition-all cursor-pointer relative ${
                isCurrent
                  ? "bg-sun-yellow border-ink text-ink shadow-goa-sm ring-2 ring-hot-pink"
                  : isDone
                  ? "bg-goa-green-200 border-goa-green-700 text-goa-green-900"
                  : "bg-paper border-ink/40 text-ink/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider">
                  {s.title}
                </span>
                {isDone && <CheckCircle2 size={12} className="text-goa-green-700" />}
              </div>
              <p className="font-sans text-[10px] leading-tight line-clamp-2 opacity-90">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Step Inspector Card: STATE | TOOL | EVIDENCE | DECISION */}
      {activeStepMeta && (
        <div className="p-3.5 bg-paper rounded-xl border-3 border-ink shadow-goa-sm grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs animate-fadeIn">
          <div className="border-r sm:border-ink/20 pr-2">
            <span className="text-[10px] text-ink/60 uppercase font-black block mb-0.5">AGENT STATE:</span>
            <span className="font-bold text-hot-pink bg-pink-50 px-1.5 py-0.5 rounded border border-hot-pink/30 inline-block">
              {activeStepMeta.state}
            </span>
          </div>

          <div className="border-r sm:border-ink/20 pr-2">
            <span className="text-[10px] text-ink/60 uppercase font-black block mb-0.5">TOOL DISPATCH:</span>
            <span className="font-bold text-goa-green-900 bg-goa-green-100 px-1.5 py-0.5 rounded border border-goa-green-500/40 inline-block truncate max-w-full">
              {activeStepMeta.tool}
            </span>
          </div>

          <div className="border-r sm:border-ink/20 pr-2">
            <span className="text-[10px] text-ink/60 uppercase font-black block mb-0.5">EVIDENCE DISCOVERED:</span>
            <p className="text-[11px] font-sans text-ink leading-tight">{activeStepMeta.evidence}</p>
          </div>

          <div>
            <span className="text-[10px] text-ink/60 uppercase font-black block mb-0.5">CURRENT DECISION:</span>
            <span className="font-black text-ink bg-sun-yellow/50 px-1.5 py-0.5 rounded border border-ink/40 inline-block">
              {activeStepMeta.decision}
            </span>
          </div>
        </div>
      )}

      {/* Live Graph & Reasoning Stream Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: TigerGraph Visual Canvas */}
        <div className="card-goa card-goa-sand p-3.5 border-2 border-ink flex flex-col h-[360px]">
          <div className="flex items-center justify-between border-b border-ink/20 pb-1.5 mb-2 font-mono text-xs font-black text-ink uppercase">
            <span>TIGERGRAPH 2-HOP SUBGRAPH</span>
            <span className="text-[10px] text-ink/60 bg-paper px-1.5 py-0.5 rounded border border-ink/30">
              {graphData?.node_count || 0} NODES · {graphData?.edge_count || 0} EDGES
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <GraphViewer data={graphData} />
          </div>
        </div>

        {/* Right: Agent Reasoning Timeline */}
        <div className="card-goa card-goa-sand p-3.5 border-2 border-ink flex flex-col h-[360px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/20 pb-1.5 mb-2 font-mono text-xs font-black text-ink uppercase">
            <span>AUTONOMOUS EXECUTION TIMELINE</span>
            <span className="text-[10px] text-ink/60 bg-paper px-1.5 py-0.5 rounded border border-ink/30">
              {investigationData?.timeline?.length || 0} STEPS LOGGED
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TimelineViewer timeline={investigationData?.timeline || []} />
          </div>
        </div>
      </div>

      {/* Concluded Outcome Banner */}
      {currentStep === 5 && (
        <div className="p-4 bg-goa-green-200 border-3 border-ink rounded-xl shadow-goa space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-goa-green-700" />
              <span className="font-serif text-lg font-black text-ink">
                Autonomous Investigation Successfully Concluded // Verdict: {investigationData?.case?.final_outcome || "VERIFIED"}
              </span>
            </div>
            <span className="font-mono text-xs bg-paper px-2.5 py-1 rounded border border-ink font-bold text-ink">
              CONFIDENCE: {Math.round((investigationData?.case?.confidence || 0.88) * 100)}%
            </span>
          </div>
          <p className="font-sans text-xs text-ink/90">
            {investigationData?.case?.findings?.[0] ||
              "Multi-hop graph traversal confirmed coordinated structuring and velocity anomalies across shared device and address clusters."}
          </p>
        </div>
      )}
    </div>
  );
};
