import React, { useState } from "react";
import type { CaseRecord } from "../types";
import { CheckCircle2, XCircle, AlertTriangle, BookOpen, History } from "lucide-react";

interface EvidencePanelProps {
  caseData: CaseRecord | null;
  policies?: any[];
  similarCases?: any[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ caseData, policies = [], similarCases = [] }) => {
  const [activeTab, setActiveTab] = useState<"evidence" | "policy" | "memory">("evidence");

  if (!caseData) {
    return (
      <div className="glass-panel" style={{ padding: 16 }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Select an active case to inspect evidence.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 8 }}>
        <button
          className={`nav-tab-btn ${activeTab === "evidence" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
          onClick={() => setActiveTab("evidence")}
        >
          Evidence ({caseData.supporting_evidence.length + caseData.contradicting_evidence.length})
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "policy" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
          onClick={() => setActiveTab("policy")}
        >
          <BookOpen size={12} /> GraphRAG Policy
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "memory" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
          onClick={() => setActiveTab("memory")}
        >
          <History size={12} /> Case Memory
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {activeTab === "evidence" && (
          <div>
            {/* Supporting Evidence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={14} color="#f43f5e" />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-rose)", textTransform: "uppercase" }}>
                  Supporting Fraud Hypothesis ({caseData.supporting_evidence.length})
                </span>
              </div>
              {caseData.supporting_evidence.length === 0 ? (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>None observed.</p>
              ) : (
                caseData.supporting_evidence.map((ev) => (
                  <div key={ev.id} className="evidence-card supporting">
                    <div style={{ fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ev.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Source: {ev.source}</div>
                  </div>
                ))
              )}
            </div>

            {/* Contradicting Evidence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <XCircle size={14} color="#10b981" />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-emerald)", textTransform: "uppercase" }}>
                  Contradicting / Benign Signals ({caseData.contradicting_evidence.length})
                </span>
              </div>
              {caseData.contradicting_evidence.length === 0 ? (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>None observed.</p>
              ) : (
                caseData.contradicting_evidence.map((ev) => (
                  <div key={ev.id} className="evidence-card contradicting">
                    <div style={{ fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ev.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Source: {ev.source}</div>
                  </div>
                ))
              )}
            </div>

            {/* Missing Evidence / Uncertainty */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-amber)", textTransform: "uppercase" }}>
                  Missing Evidence / Uncertainty Gap ({caseData.missing_evidence.length})
                </span>
              </div>
              {caseData.missing_evidence.length === 0 ? (
                <p style={{ fontSize: "0.78rem", color: "var(--accent-emerald)" }}>Evidence completeness sufficient.</p>
              ) : (
                caseData.missing_evidence.map((item, idx) => (
                  <div key={idx} className="evidence-card missing">
                    <div style={{ fontWeight: 500, color: "#fef3c7" }}>{item}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--accent-amber)", marginTop: 2 }}>
                      Requires Out-of-band Step-up challenge
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "policy" && (
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
              Retrieved from GraphRAG Institutional Knowledge Base:
            </span>
            {policies.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  padding: "10px",
                  marginBottom: 8,
                  fontSize: "0.78rem"
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 4 }}>
                  {p.id}: {p.topic}
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>{p.content}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "memory" && (
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
              Similar Historical Investigations from Case Memory:
            </span>
            {similarCases.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>No past cases matching current topology.</p>
            ) : (
              similarCases.map((mem) => (
                <div
                  key={mem.case_id}
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 6,
                    padding: "10px",
                    marginBottom: 8,
                    fontSize: "0.78rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#fff" }}>{mem.case_id}</span>
                    <span
                      style={{
                        color: mem.final_outcome === "CONFIRMED_FRAUD" ? "var(--accent-rose)" : "var(--accent-emerald)",
                        fontWeight: 600,
                        fontSize: "0.7rem"
                      }}
                    >
                      {mem.final_outcome}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{mem.summary}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Risk: {mem.risk_score} | Conf: {mem.confidence}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
