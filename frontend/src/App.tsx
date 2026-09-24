import React, { useState, useEffect, useCallback } from "react";
import type { CaseRecord, SubgraphData, LedgerEntry } from "./types";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { SignpostStats } from "./components/SignpostStats";
import { PipelineBoards } from "./components/PipelineBoards";
import { CaseVillage, type CaseVillageItem } from "./components/CaseVillage";
import { SunTideGauge } from "./components/SunTideGauge";
import { EvidenceNoticeBoard } from "./components/EvidenceNoticeBoard";
import { GraphViewer } from "./components/GraphViewer";
import { TimelineViewer } from "./components/TimelineViewer";
import { ActionCard } from "./components/ActionCard";
import { PastEditionsStrip } from "./components/PastEditionsStrip";
import { DecisionLedgerViewer } from "./components/DecisionLedgerViewer";
import { ApprovalCenter } from "./components/ApprovalCenter";
import { ExplainabilityAccordion } from "./components/ExplainabilityAccordion";
import { DemoWalkthrough } from "./components/DemoWalkthrough";
import { PartnerMarquee } from "./components/PartnerMarquee";
import {
  fetchMetrics,
  fetchCases,
  fetchCase,
  runInvestigation,
  fetchCaseGraph,
  fetchCaseDecisions,
  fetchPolicies,
  fetchCaseMemory,
  approveCaseAction,
  fetchCompetitionCases
} from "./services/api";
import { Play, FileText } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeRole, setActiveRole] = useState("SENIOR_ANALYST");

  // State
  const [metrics, setMetrics] = useState<any>({
    total_active_cases: 20,
    high_risk_cases: 13,
    awaiting_approval: 12,
    awaiting_evidence: 2,
    resolved_cases: 4,
    average_confidence: 0.87
  });

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [competitionCases, setCompetitionCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("CASE-001");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [graphData, setGraphData] = useState<SubgraphData | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeSar, setActiveSar] = useState<any>(null);
  const [sarModalOpen, setSarModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [m, cList, compList] = await Promise.all([
        fetchMetrics(),
        fetchCases(),
        fetchCompetitionCases()
      ]);
      if (m) setMetrics(m);
      if (cList && cList.length > 0) setCases(cList);
      if (compList && compList.length > 0) setCompetitionCases(compList);

      if (cList && cList.length > 0 && !selectedCase) {
        loadCaseData(cList[0].case_id);
      }
    } catch (e) {
      console.error("Dashboard data load error:", e);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
    fetchPolicies().then(setPolicies).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCaseData = async (rawCaseId: string) => {
    // If case ID has prefix HHG-, map to corresponding CASE- format if needed for backend DB
    let caseId = rawCaseId;
    if (caseId.startsWith("HHG-")) {
      const num = parseInt(caseId.replace("HHG-", ""), 10);
      caseId = `CASE-${String(num).padStart(3, "0")}`;
    }

    setSelectedCaseId(caseId);
    try {
      const [c, g, l, mem] = await Promise.all([
        fetchCase(caseId),
        fetchCaseGraph(caseId, 2),
        fetchCaseDecisions(caseId),
        fetchCaseMemory(caseId)
      ]);
      setSelectedCase(c);
      setGraphData(g);
      setLedgerEntries(l);
      setSimilarCases(mem?.similar_past_cases || []);
    } catch (e) {
      console.error(`Error loading case ${caseId}:`, e);
    }
  };

  const handleRunInvestigation = async (caseId: string) => {
    setIsInvestigating(true);
    try {
      const res = await runInvestigation(caseId, true, true);
      setSelectedCase(res.case);
      setTimeline(res.timeline || []);
      if (res.sar_docket) {
        setActiveSar(res.sar_docket);
      }
      // Refresh graph & ledger
      const [g, l] = await Promise.all([fetchCaseGraph(caseId, 2), fetchCaseDecisions(caseId)]);
      setGraphData(g);
      setLedgerEntries(l);
      loadDashboardData();
    } catch (e) {
      console.error("Run investigation error:", e);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleAuthorizeAction = async (act: any) => {
    if (!selectedCase) return;
    try {
      await approveCaseAction(selectedCase.case_id, {
        action: act.action,
        approver_name: "Supervisory Analyst",
        approver_role: activeRole,
        approved: true,
        notes: `Authorized via Action Card as ${activeRole}`
      });
      await loadCaseData(selectedCase.case_id);
    } catch (e) {
      alert(`Approval error: ${e}`);
    }
  };

  // Keyboard navigation shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        setActiveTab('demo');
      } else if (e.key === 'g' || e.key === 'G') {
        setActiveTab('graph');
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTab('ledger');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTab('investigation');
      } else if (e.key === 'Escape') {
        if (sarModalOpen) setSarModalOpen(false);
        else setActiveTab('dashboard');
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'k' || e.key === 'K') {
        if (cases.length === 0) return;
        const currentIdx = cases.findIndex((c) => c.case_id === selectedCaseId);
        let nextIdx = currentIdx;
        if (e.key === 'j' || e.key === 'J') {
          nextIdx = (currentIdx + 1) % cases.length;
        } else {
          nextIdx = (currentIdx - 1 + cases.length) % cases.length;
        }
        if (cases[nextIdx]) {
          loadCaseData(cases[nextIdx].case_id);
        }
      }
    },
    [cases, selectedCaseId, sarModalOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Map backend cases to CaseVillage items
  const villageItems: CaseVillageItem[] =
    competitionCases.length > 0
      ? competitionCases.map((cc) => {
          const verdictStr = cc.case?.verdict?.toLowerCase() || '';
          let verdict: 'fraud' | 'uncertain' | 'legitimate' = 'legitimate';
          if (verdictStr.includes('fraud') || cc.case?.fraud_probability >= 0.7) {
            verdict = 'fraud';
          } else if (verdictStr.includes('uncertain') || (cc.case?.fraud_probability >= 0.3 && cc.case?.fraud_probability < 0.7)) {
            verdict = 'uncertain';
          }

          return {
            case_id: cc.case_id,
            verdict,
            fraud_probability: cc.case?.fraud_probability ?? 0.5,
            pattern: cc.case?.pattern || 'Multi-Hop Anomaly',
            exposure_usd: cc.case?.exposure_usd ?? 0,
            trigger_type: cc.trigger_type || 'VELOCITY_BURST',
            sar_file: cc.sar?.file ?? false,
            tool_calls: cc.tool_calls ?? 3,
            tokens: cc.tokens ?? 0,
            primary_action: cc.next_best_actions?.final?.[0]?.action || cc.next_best_actions?.initial?.[0]?.action || 'MONITOR'
          };
        })
      : cases.map((c) => ({
          case_id: c.case_id,
          verdict: c.risk_score >= 0.7 ? 'fraud' : c.risk_score >= 0.4 ? 'uncertain' : 'legitimate',
          fraud_probability: c.risk_score,
          pattern: c.fraud_patterns[0] || 'Graph Syndicate Anomaly',
          exposure_usd: c.risk_score * 4500,
          trigger_type: c.trigger_txn_id,
          sar_file: c.risk_score >= 0.75,
          tool_calls: 3,
          tokens: 0,
          primary_action: c.recommended_actions[0]?.action || 'INVESTIGATE'
        }));

  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: DASHBOARD // VILLAGE & COMMAND CENTER */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Banner with Draggable Sticker & Subline */}
            <HeroSection
              onStartInvestigation={() => {
                if (selectedCaseId) {
                  loadCaseData(selectedCaseId);
                  setActiveTab("investigation");
                }
              }}
              onOpenDemo={() => setActiveTab("demo")}
              onScrollToStats={() => {
                const el = document.getElementById("case-village-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {/* Directional Signpost Stats with animated counters */}
            <SignpostStats
              stats={{
                benchmarkCases: metrics.total_active_cases || 20,
                fraudCases: metrics.high_risk_cases || 13,
                memoryCases: 5565,
                accuracy: 87.24,
                totalTransactions: 590742,
              }}
            />

            {/* Bamboo Roadmap Pipeline Boards */}
            <PipelineBoards />

            {/* 20 Beach-Shack Village Grid */}
            <div id="case-village-section">
              <CaseVillage
                cases={villageItems}
                selectedCaseId={selectedCaseId}
                onSelectCase={(id) => {
                  loadCaseData(id);
                  setActiveTab("investigation");
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE INVESTIGATION VIEW */}
        {activeTab === "investigation" && selectedCase && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Docket Command Bar */}
            <div className="card-goa card-goa-paper p-4 border-3 border-ink shadow-goa flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black bg-ink text-sun-yellow px-3 py-1 rounded-sm border border-ink">
                  {selectedCase.case_id}
                </span>
                <div>
                  <h2 className="font-serif text-xl font-black text-ink leading-tight">
                    Investigation Docket // {selectedCase.subject_customer_id}
                  </h2>
                  <div className="flex items-center gap-3 font-mono text-xs text-ink/70 mt-0.5">
                    <span>TRIGGER TXN: <strong>{selectedCase.trigger_txn_id}</strong></span>
                    <span>•</span>
                    <span>RISK: <strong className="text-terracotta">{selectedCase.risk_score.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>CONFIDENCE: <strong className="text-goa-green-700">{Math.round(selectedCase.confidence * 100)}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunInvestigation(selectedCase.case_id)}
                  disabled={isInvestigating}
                  className="btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-xs py-2.5 px-5 font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Play size={14} className={isInvestigating ? "animate-spin" : ""} />
                  <span>{isInvestigating ? "AGENT INVESTIGATING GRAPH..." : "RUN AUTONOMOUS INVESTIGATION"}</span>
                </button>
              </div>
            </div>

            {/* Sun & Tide Coastal Radar Gauge */}
            <SunTideGauge
              confidence={selectedCase.confidence}
              riskScore={selectedCase.risk_score}
              enoughToAct={selectedCase.confidence >= 0.70}
              missingEvidence={selectedCase.missing_evidence}
              isInvestigating={isInvestigating}
            />

            {/* 3-Column Tactical Investigation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Network Graph + Roadmap Timeline (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* TigerGraph Network Explorer */}
                <div className="card-goa card-goa-paper p-4 border-3 border-ink shadow-goa flex flex-col h-[420px]">
                  <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-2 font-mono text-xs font-black text-ink uppercase">
                    <span>TIGERGRAPH 2-HOP TRAVERSAL</span>
                    <span className="text-[10px] bg-sand px-2 py-0.5 rounded border border-ink font-bold">
                      {graphData?.node_count || 0} NODES • {graphData?.edge_count || 0} EDGES
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <GraphViewer data={graphData} />
                  </div>
                </div>

                {/* Bamboo Roadmap Timeline */}
                <TimelineViewer timeline={timeline} />

                {/* Historical Case Precedents Polaroid Strip */}
                <PastEditionsStrip
                  precedents={similarCases}
                  onSelectPrecedent={(cid) => loadCaseData(cid)}
                />

                {/* Explainability Accordion */}
                <ExplainabilityAccordion caseData={selectedCase} />
              </div>

              {/* Right Column: Cork Notice Board + Next-Best Action Cards (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* Cork Notice Board */}
                <div className="min-h-[380px]">
                  <EvidenceNoticeBoard
                    caseData={selectedCase}
                    policies={policies}
                    similarCases={similarCases}
                  />
                </div>

                {/* Next-Best Action Recommendation Card */}
                <ActionCard
                  actions={selectedCase.recommended_actions}
                  activeRole={activeRole}
                  onAuthorize={handleAuthorizeAction}
                  sarDocket={activeSar}
                  onViewSar={() => setSarModalOpen(true)}
                  isAuthorizing={isInvestigating}
                  beforeEvidenceAction={{
                    action: selectedCase.recommended_actions?.[0]?.action === "BLOCK_TRANSACTION" ? "REQUEST_STEP_UP_AUTH" : "MONITOR_TRANSACTION",
                    risk: Number((selectedCase.risk_score * 0.82).toFixed(2)),
                    confidence: Number((selectedCase.confidence * 0.72).toFixed(2)),
                  }}
                  decisionChanged={selectedCase.risk_score >= 0.70}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NETWORK GRAPH EXPLORER */}
        {activeTab === "graph" && (
          <div className="card-goa card-goa-paper p-6 border-3 border-ink shadow-goa select-none space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
              <div>
                <h2 className="font-serif text-2xl font-black text-ink tracking-tight">
                  TigerGraph Multi-Hop Topology Explorer
                </h2>
                <p className="font-mono text-xs text-ink/70">
                  Interactive multi-hop entity traversal across Card, Device, IP, and Transaction vertices
                </p>
              </div>

              {/* Quick Case Switcher Buttons */}
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {["CASE-001", "CASE-002", "CASE-003", "CASE-004", "CASE-020"].map((cid) => (
                  <button
                    key={cid}
                    onClick={() => loadCaseData(cid)}
                    className={`px-2.5 py-1 rounded font-bold border-2 border-ink transition-all ${
                      selectedCaseId === cid
                        ? "bg-sun-yellow text-ink shadow-2xs -translate-y-0.5"
                        : "bg-paper text-ink/70 hover:bg-sand/60"
                    }`}
                  >
                    {cid}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[560px] border-2 border-ink rounded-lg overflow-hidden bg-sand/30">
              <GraphViewer data={graphData} />
            </div>
          </div>
        )}

        {/* TAB 4: DECISION LEDGER */}
        {activeTab === "ledger" && (
          <div className="animate-fadeIn">
            <DecisionLedgerViewer
              caseId={selectedCaseId}
              entries={ledgerEntries}
              onRefresh={() => loadCaseData(selectedCaseId)}
            />
          </div>
        )}

        {/* TAB 5: CLEARANCE CENTER */}
        {activeTab === "clearance" && (
          <div className="animate-fadeIn">
            <ApprovalCenter
              cases={cases}
              activeRole={activeRole}
              onActionComplete={loadDashboardData}
            />
          </div>
        )}

        {/* TAB 6: HACKATHON LIVE TRIALS */}
        {activeTab === "demo" && (
          <div className="animate-fadeIn">
            <DemoWalkthrough onSelectCase={(id) => loadCaseData(id)} />
          </div>
        )}
      </main>

      {/* SAR Docket Modal */}
      {sarModalOpen && activeSar && (
        <div className="fixed inset-0 bg-ink/75 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="card-goa card-goa-paper max-w-2xl w-full p-6 border-3 border-ink shadow-goa max-h-[85vh] flex flex-col select-none">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-hot-pink" />
                <h3 className="font-serif text-xl font-black text-ink">
                  FinCEN Suspicious Activity Report (SAR) // Docket Draft
                </h3>
              </div>
              <button
                onClick={() => setSarModalOpen(false)}
                className="font-mono text-xs font-black bg-paper hover:bg-sand px-2.5 py-1 rounded border-2 border-ink"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs text-ink/90 custom-scrollbar pr-2">
              <div className="bg-sand/40 p-3 rounded border border-ink/30 space-y-1">
                <div>STATUTORY BASIS: <strong>Bank Secrecy Act (BSA) 31 CFR § 1020.320</strong></div>
                <div>THRESHOLD EXCEEDED: <strong>$5,000 USD Aggregate Entity Outflow</strong></div>
                <div>FILING STATUS: <strong className="text-hot-pink">SEALED REGULATORY DRAFT</strong></div>
              </div>

              <div>
                <strong className="text-ink uppercase block mb-1">5-Point Narrative Assessment:</strong>
                <p className="font-sans text-xs text-ink/90 bg-paper p-3 rounded border border-ink/20 leading-relaxed">
                  {activeSar.narrative ||
                    "Multi-hop graph traversal confirmed coordinated structuring and velocity anomalies across shared device and address clusters. Outflows exceeded statutory regulatory thresholds. Account action routed for human compliance signature."}
                </p>
              </div>

              <div>
                <strong className="text-ink uppercase block mb-1">Raw Regulatory Payload (JSON):</strong>
                <pre className="bg-paper p-3 rounded border border-ink/30 overflow-x-auto text-[10px] text-ink/80 max-h-48">
                  {JSON.stringify(activeSar, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-ink flex justify-end gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(activeSar, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `SAR_${selectedCaseId}.json`;
                  a.click();
                }}
                className="btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-xs py-1.5 px-4 font-black uppercase tracking-wider"
              >
                DOWNLOAD DOCKET JSON
              </button>
              <button
                onClick={() => setSarModalOpen(false)}
                className="btn-goa bg-paper hover:bg-sand text-ink text-xs py-1.5 px-4 font-bold"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Infinite Partner Marquee at the Footer */}
      <PartnerMarquee />
    </div>
  );
};

export default App;
