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
            <div className="metric-label">Active Dockets</div>
            <div className="metric-value">{metrics.total_active_cases}</div>
          </div>
          <div className="metric-card critical">
            <div className="metric-label">High-Risk Cases</div>
            <div className="metric-value" style={{ color: "var(--accent-rose)" }}>
              {metrics.high_risk_cases}
            </div>
          </div>
          <div className="metric-card warning">
            <div className="metric-label">Awaiting Approval</div>
            <div className="metric-value" style={{ color: "var(--accent-amber)" }}>
              {metrics.awaiting_approval}
            </div>
          </div>
          <div className="metric-card warning">
            <div className="metric-label">Awaiting Evidence</div>
            <div className="metric-value" style={{ color: "var(--accent-amber)" }}>
              {metrics.awaiting_evidence}
            </div>
          </div>
          <div className="metric-card success">
            <div className="metric-label">Resolved / Executed</div>
            <div className="metric-value" style={{ color: "var(--accent-emerald)" }}>
              {metrics.resolved_cases}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Agent Confidence</div>
            <div className="metric-value" style={{ color: "var(--accent-cyan)" }}>
              {Math.round(metrics.average_confidence * 100)}%
            </div>
          </div>
        </div>

        {/* Tab 1: Dashboard & Queue */}
        {activeTab === "dashboard" && (
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Investigation Case Docket Queue</h2>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  20 Benchmark Investigations with Graph-Grounded Entity Linkages
                </span>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    border: "1px solid var(--border-color)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: "0.8rem"
                  }}
                >
                  <option value="ALL">All Risk Tiers</option>
                  <option value="HIGH">High Risk (&ge; 0.70)</option>
                  <option value="MEDIUM">Medium Risk (0.40 - 0.69)</option>
                  <option value="LOW">Low Risk (&lt; 0.40)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    border: "1px solid var(--border-color)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: "0.8rem"
                  }}
                >
                  <option value="">All Statuses</option>
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
                  <th>Case Docket ID</th>
                  <th>Subject Customer</th>
                  <th>Trigger Transaction</th>
                  <th>Risk Score</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Identified Pattern</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.case_id}>
                    <td style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{c.case_id}</td>
                    <td>{c.subject_customer_id}</td>
                    <td>{c.trigger_txn_id}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: c.risk_score >= 0.70 ? "var(--accent-rose)" : (c.risk_score >= 0.40 ? "var(--accent-amber)" : "var(--accent-emerald)")
                        }}
                      >
                        {c.risk_score.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                        {Math.round(c.confidence * 100)}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${c.status === "AWAITING_APPROVAL" ? "warning" : (c.status === "ACTION_EXECUTED" ? "active" : "")}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      {c.fraud_patterns.join(", ") || "None Identified"}
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                        onClick={() => {
                          loadCaseData(c.case_id);
                          setActiveTab("investigation");
                        }}
                      >
                        Investigate <ArrowRight size={12} />
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
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Active Case File
                    </span>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{selectedCase.case_id}</h2>
                  </div>
                  <span className={`status-badge ${selectedCase.status === "AWAITING_APPROVAL" ? "warning" : "active"}`}>
                    {selectedCase.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.8rem", marginBottom: 12 }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Subject: </span>
                    <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{selectedCase.subject_customer_id}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Trigger: </span>
                    <span style={{ color: "#fff", fontWeight: 500 }}>{selectedCase.trigger_txn_id}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Risk: </span>
                    <span style={{ color: "var(--accent-rose)", fontWeight: 700 }}>{selectedCase.risk_score.toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Confidence: </span>
                    <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>{Math.round(selectedCase.confidence * 100)}%</span>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => handleRunInvestigation(selectedCase.case_id)}
                  disabled={isInvestigating}
                >
                  <Play size={14} />
                  {isInvestigating ? "Agent Investigating..." : "Run Autonomous Investigation"}
                </button>
              </div>

              {/* Evidence Board */}
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
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                    TigerGraph 2-Hop Traversal (Interactive Neighborhood):
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {graphData?.node_count || 0} Entities | {graphData?.edge_count || 0} Relationships
                  </span>
                </div>
                <GraphViewer data={graphData} />
              </div>

              {/* Agent Timeline */}
              <div className="glass-panel" style={{ padding: 14 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8 }}>
                  Agent Autonomous Reasoning & Tool Timeline:
                </div>
                <TimelineViewer timeline={timeline} />
              </div>
            </div>

            {/* Right Column: Next-Best Actions & SAR */}
            <div className="col-panel">
              <div className="glass-panel" style={{ padding: 16, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                    Next-Best Action Plan
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Policy-Enforced
                  </span>
                </div>

                {selectedCase.recommended_actions.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    No actions generated yet. Click "Run Autonomous Investigation" to formulate NBA plan.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {selectedCase.recommended_actions.map((act, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(0, 0, 0, 0.35)",
                          border: `1px solid ${act.priority === "CRITICAL" ? "rgba(244, 63, 94, 0.4)" : "var(--border-color)"}`,
                          borderRadius: 6,
                          padding: 12
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent-cyan)" }}>
                            {act.action}
                          </span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: act.priority === "CRITICAL" ? "var(--accent-rose)" : "var(--accent-amber)" }}>
                            {act.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                          {act.reason}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 8 }}>
                          Route: <strong style={{ color: "#fff" }}>{act.approval_route}</strong> | Policy: {act.policy_basis.join(", ")}
                        </div>

                        {act.approval_required ? (
                          <button
                            className="btn-primary"
                            style={{ width: "100%", padding: "6px 10px", fontSize: "0.75rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
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
                            <CheckCircle2 size={12} /> Sign & Execute as {activeRole}
                          </button>
                        ) : (
                          <div style={{ fontSize: "0.72rem", color: "var(--accent-emerald)" }}>
                            ✓ Executed Autonomously
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SAR View Modal Trigger */}
                {activeSar && (
                  <div style={{ marginTop: 16, background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: 6, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-rose)", fontWeight: 700, fontSize: "0.82rem", marginBottom: 4 }}>
                      <FileText size={14} /> FinCEN Suspicious Activity Report (SAR)
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                      Statutory $5,000 threshold triggered. Formal regulatory draft prepared.
                    </p>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.75rem", width: "100%" }}
                      onClick={() => alert(JSON.stringify(activeSar, null, 2))}
                    >
                      View Generated SAR Draft JSON
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
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>TigerGraph Multi-Hop Topology Explorer</h2>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Deep Graph Traversal across Customer, Account, Transaction, Device, IP, and Card entities
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" onClick={() => loadCaseData("CASE-001")}>Case 001</button>
                <button className="btn-secondary" onClick={() => loadCaseData("CASE-002")}>Case 002</button>
                <button className="btn-secondary" onClick={() => loadCaseData("CASE-003")}>Case 003</button>
                <button className="btn-secondary" onClick={() => loadCaseData("CASE-004")}>Case 004</button>
                <button className="btn-secondary" onClick={() => loadCaseData("CASE-020")}>Case 020</button>
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

        {/* Tab 5: Approval Center */}
        {activeTab === "approval" && (
          <ApprovalCenter
            cases={cases}
            activeRole={activeRole}
            onActionComplete={loadDashboardData}
          />
        )}

        {/* Tab 6: Live Demo Mode */}
        {activeTab === "demo" && (
          <DemoWalkthrough onSelectCase={loadCaseData} />
        )}
      </main>
    </div>
  );
};

export default App;
