import React, { useState, useEffect } from "react";
import type { CaseRecord, SubgraphData, LedgerEntry } from "./types";
import { Header } from "./components/Header";
import { GraphViewer } from "./components/GraphViewer";
import { EvidencePanel } from "./components/EvidencePanel";
import { TimelineViewer } from "./components/TimelineViewer";
import { DecisionLedgerViewer } from "./components/DecisionLedgerViewer";
import { ApprovalCenter } from "./components/ApprovalCenter";
import { DemoWalkthrough } from "./components/DemoWalkthrough";
import {
  fetchMetrics,
  fetchCases,
  fetchCase,
  runInvestigation,
  fetchCaseGraph,
  fetchCaseDecisions,
  fetchPolicies,
  fetchCaseMemory,
  approveCaseAction
} from "./services/api";
import { Play, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeRole, setActiveRole] = useState("SENIOR_ANALYST");

  // State
  const [metrics, setMetrics] = useState<any>({
    total_active_cases: 20,
    high_risk_cases: 14,
    awaiting_approval: 12,
    awaiting_evidence: 2,
    resolved_cases: 4,
    average_confidence: 0.84
  });

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("CASE-001");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [graphData, setGraphData] = useState<SubgraphData | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeSar, setActiveSar] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    fetchPolicies().then(setPolicies).catch(console.error);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [m, cList] = await Promise.all([fetchMetrics(), fetchCases()]);
      setMetrics(m);
      setCases(cList);
      if (cList.length > 0 && !selectedCase) {
        loadCaseData(cList[0].case_id);
      }
    } catch (e) {
      console.error("Dashboard data load error:", e);
    }
  };

  const loadCaseData = async (caseId: string) => {
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
      console.error(e);
    } finally {
      setIsInvestigating(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterRisk === "HIGH" && c.risk_score < 0.70) return false;
    if (filterRisk === "MEDIUM" && (c.risk_score < 0.40 || c.risk_score >= 0.70)) return false;
    if (filterRisk === "LOW" && c.risk_score >= 0.40) return false;
    return true;
  });

  return (
    <div>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
      />

      <main className="main-container">
        {/* KPI Metrics Row */}
        <div className="metrics-row">
          <div className="metric-card">
            <div className="metric-label font-mono">ACTIVE DOCKETS</div>
            <div className="metric-value font-mono">{metrics.total_active_cases}</div>
          </div>
          <div className="metric-card critical">
            <div className="metric-label font-mono">HIGH-RISK SIGNALS</div>
            <div className="metric-value font-mono" style={{ color: "var(--accent-rose)" }}>
              {metrics.high_risk_cases}
            </div>
          </div>
          <div className="metric-card warning">
            <div className="metric-label font-mono">PENDING CLEARANCE</div>
            <div className="metric-value font-mono" style={{ color: "var(--accent-amber)" }}>
              {metrics.awaiting_approval}
            </div>
          </div>
          <div className="metric-card warning">
            <div className="metric-label font-mono">UNCERTAINTY GAPS</div>
            <div className="metric-value font-mono" style={{ color: "var(--accent-amber)" }}>
              {metrics.awaiting_evidence}
            </div>
          </div>
          <div className="metric-card success">
            <div className="metric-label font-mono">MOVES EXECUTED</div>
            <div className="metric-value font-mono" style={{ color: "var(--accent-emerald)" }}>
              {metrics.resolved_cases}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label font-mono">AVG CONFIDENCE</div>
            <div className="metric-value font-mono" style={{ color: "var(--accent-cyan)" }}>
              {Math.round(metrics.average_confidence * 100)}%
            </div>
          </div>
        </div>

        {/* Tab 1: Dashboard & Queue */}
        {activeTab === "dashboard" && (
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 className="font-mono" style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                  COMMAND // CASE DOCKET QUEUE
                </h2>
                <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  20 Canonical Benchmark Investigations with Graph-Grounded Entity Linkages
                </span>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="font-mono"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    border: "1px solid var(--border-color)",
                    padding: "6px 12px",
                    borderRadius: 0,
                    fontSize: "0.75rem"
                  }}
                >
                  <option value="ALL">ALL RISK TIERS</option>
                  <option value="HIGH">HIGH RISK (&ge; 0.70)</option>
                  <option value="MEDIUM">MEDIUM RISK (0.40 - 0.69)</option>
                  <option value="LOW">LOW RISK (&lt; 0.40)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="font-mono"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    border: "1px solid var(--border-color)",
                    padding: "6px 12px",
                    borderRadius: 0,
                    fontSize: "0.75rem"
                  }}
                >
                  <option value="">ALL STATUSES</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="AWAITING_APPROVAL">AWAITING_APPROVAL</option>
                  <option value="AWAITING_EVIDENCE">AWAITING_EVIDENCE</option>
                  <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="font-mono">CASE DOCKET</th>
                  <th className="font-mono">SUBJECT</th>
                  <th className="font-mono">TRIGGER TXN</th>
                  <th className="font-mono">RISK SCORE</th>
                  <th className="font-mono">CONFIDENCE</th>
                  <th className="font-mono">STATUS</th>
                  <th className="font-mono">TYPOLOGY</th>
                  <th className="font-mono">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.case_id}>
                    <td className="font-mono" style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{c.case_id}</td>
                    <td className="font-mono">{c.subject_customer_id}</td>
                    <td className="font-mono">{c.trigger_txn_id}</td>
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          color: c.risk_score >= 0.70 ? "var(--accent-rose)" : (c.risk_score >= 0.40 ? "var(--accent-amber)" : "var(--accent-emerald)")
                        }}
                      >
                        {c.risk_score.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>
                        {Math.round(c.confidence * 100)}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge font-mono ${c.status === "AWAITING_APPROVAL" ? "warning" : (c.status === "ACTION_EXECUTED" ? "active" : "")}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="font-mono" style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>
                      {c.fraud_patterns.join(", ") || "None Identified"}
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ padding: "5px 10px", fontSize: "0.72rem", borderRadius: 0 }}
                        onClick={() => {
                          loadCaseData(c.case_id);
                          setActiveTab("investigation");
                        }}
                      >
                        TRACE <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Active Investigation View */}
        {activeTab === "investigation" && selectedCase && (
          <div className="investigation-grid">
            {/* Left Column: Metadata & Evidence */}
            <div className="col-panel">
              {/* Docket Header */}
              <div className="glass-panel" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      ACTIVE DOCKET
                    </span>
                    <h2 className="font-mono" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-cyan)" }}>{selectedCase.case_id}</h2>
                  </div>
                  <span className={`status-badge font-mono ${selectedCase.status === "AWAITING_APPROVAL" ? "warning" : "active"}`}>
                    {selectedCase.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.78rem", marginBottom: 12 }}>
                  <div>
                    <span className="font-mono" style={{ color: "var(--text-muted)" }}>SUBJECT: </span>
                    <span className="font-mono" style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{selectedCase.subject_customer_id}</span>
                  </div>
                  <div>
                    <span className="font-mono" style={{ color: "var(--text-muted)" }}>TRIGGER: </span>
                    <span className="font-mono" style={{ color: "#fff", fontWeight: 600 }}>{selectedCase.trigger_txn_id}</span>
                  </div>
                  <div>
                    <span className="font-mono" style={{ color: "var(--text-muted)" }}>RISK: </span>
                    <span className="font-mono" style={{ color: "var(--accent-rose)", fontWeight: 700 }}>{selectedCase.risk_score.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-mono" style={{ color: "var(--text-muted)" }}>CONF: </span>
                    <span className="font-mono" style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>{Math.round(selectedCase.confidence * 100)}%</span>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", borderRadius: 0 }}
                  onClick={() => handleRunInvestigation(selectedCase.case_id)}
                  disabled={isInvestigating}
                >
                  <Play size={14} />
                  {isInvestigating ? "AGENT INVESTIGATING..." : "RUN AUTONOMOUS INVESTIGATION"}
                </button>
              </div>

              {/* Signals Board */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <EvidencePanel
                  caseData={selectedCase}
                  policies={policies}
                  similarCases={similarCases}
                />
              </div>
            </div>

            {/* Center Column: Graph & Timeline */}
            <div className="col-panel" style={{ overflow: "hidden" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="font-mono" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-cyan)", letterSpacing: "0.04em" }}>
                    NETWORK // TIGERGRAPH 2-HOP TRAVERSAL:
                  </span>
                  <span className="font-mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {graphData?.node_count || 0} ENTITIES | {graphData?.edge_count || 0} RELATIONS
                  </span>
                </div>
                <GraphViewer data={graphData} />
              </div>

              {/* Agent Timeline */}
              <div className="glass-panel" style={{ padding: 14 }}>
                <div className="font-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8, letterSpacing: "0.04em" }}>
                  AGENT EXECUTION & REASONING STREAM:
                </div>
                <TimelineViewer timeline={timeline} />
              </div>
            </div>

            {/* Right Column: Next-Best Actions & SAR */}
            <div className="col-panel">
              <div className="glass-panel" style={{ padding: 16, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 className="font-mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", letterSpacing: "0.04em" }}>
                    NEXT MOVE // ACTIONS
                  </h3>
                  <span className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    GUARDRAILS ENFORCED
                  </span>
                </div>

                {selectedCase.recommended_actions.length === 0 ? (
                  <p className="font-mono" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    No actions generated yet. Click "RUN AUTONOMOUS INVESTIGATION" to formulate Next Move.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {selectedCase.recommended_actions.map((act, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-tertiary)",
                          border: `1px solid ${act.priority === "CRITICAL" ? "var(--accent-rose)" : "var(--border-color)"}`,
                          borderRadius: 0,
                          padding: 12
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span className="font-mono" style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent-cyan)" }}>
                            {act.action}
                          </span>
                          <span className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, color: act.priority === "CRITICAL" ? "var(--accent-rose)" : "var(--accent-amber)" }}>
                            {act.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                          {act.reason}
                        </div>
                        <div className="font-mono" style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 8 }}>
                          ROUTE: <strong style={{ color: "#fff" }}>{act.approval_route}</strong> | POLICY: {act.policy_basis.join(", ")}
                        </div>

                        {act.approval_required ? (
                          <button
                            className="btn-primary"
                            style={{ width: "100%", padding: "6px 10px", fontSize: "0.72rem", background: "var(--accent-emerald)", color: "#000", fontWeight: 700, borderRadius: 0 }}
                            onClick={() => {
                              approveCaseAction(selectedCase.case_id, {
                                action: act.action,
                                approver_name: "Analyst Signer",
                                approver_role: activeRole,
                                approved: true,
                                notes: "Signed via Action Card"
                              }).then(() => loadCaseData(selectedCase.case_id));
                            }}
                          >
                            <CheckCircle2 size={12} /> AUTHORIZE MOVE AS {activeRole}
                          </button>
                        ) : (
                          <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--accent-emerald)" }}>
                            [✓] EXECUTED AUTONOMOUSLY
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SAR View Modal Trigger */}
                {activeSar && (
                  <div style={{ marginTop: 16, background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: 0, padding: 12 }}>
                    <div className="font-mono" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-rose)", fontWeight: 700, fontSize: "0.78rem", marginBottom: 4 }}>
                      <FileText size={14} /> FINCEN SUSPICIOUS ACTIVITY REPORT (SAR)
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                      Statutory $5,000 BSA threshold exceeded. Regulatory draft sealed.
                    </p>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.72rem", width: "100%", borderRadius: 0 }}
                      onClick={() => alert(JSON.stringify(activeSar, null, 2))}
                    >
                      VIEW SAR DOCKET JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Graph Explorer */}
        {activeTab === "graph" && (
          <div className="glass-panel" style={{ padding: 20, height: "calc(100vh - 220px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h2 className="font-mono" style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                  NETWORK // MULTI-HOP TOPOLOGY EXPLORER
                </h2>
                <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Deep Graph Traversal across Customer, Account, Transaction, Device, IP, and Card entities
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" style={{ borderRadius: 0 }} onClick={() => loadCaseData("CASE-001")}>CASE 001</button>
                <button className="btn-secondary" style={{ borderRadius: 0 }} onClick={() => loadCaseData("CASE-002")}>CASE 002</button>
                <button className="btn-secondary" style={{ borderRadius: 0 }} onClick={() => loadCaseData("CASE-003")}>CASE 003</button>
                <button className="btn-secondary" style={{ borderRadius: 0 }} onClick={() => loadCaseData("CASE-004")}>CASE 004</button>
                <button className="btn-secondary" style={{ borderRadius: 0 }} onClick={() => loadCaseData("CASE-020")}>CASE 020</button>
              </div>
            </div>
            <GraphViewer data={graphData} />
          </div>
        )}

        {/* Tab 4: Decision Ledger */}
        {activeTab === "ledger" && (
          <DecisionLedgerViewer
            caseId={selectedCaseId}
            entries={ledgerEntries}
            onRefresh={() => loadCaseData(selectedCaseId)}
          />
        )}

        {/* Tab 5: Clearance Center */}
        {activeTab === "clearance" && (
          <ApprovalCenter
            cases={cases}
            activeRole={activeRole}
            onActionComplete={loadDashboardData}
          />
        )}

        {/* Tab 6: Live Trials Mode */}
        {activeTab === "demo" && (
          <DemoWalkthrough onSelectCase={loadCaseData} />
        )}
      </main>
    </div>
  );
};

export default App;
