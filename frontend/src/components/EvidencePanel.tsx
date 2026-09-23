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
          style={{ padding: "4px 8px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
          onClick={() => setActiveTab("evidence")}
        >
          SIGNALS ({caseData.supporting_evidence.length + caseData.contradicting_evidence.length})
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "policy" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
          onClick={() => setActiveTab("policy")}
        >
          <BookOpen size={12} /> GUARDRAILS
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "memory" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
          onClick={() => setActiveTab("memory")}
        >
          <History size={12} /> MEMORY
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {activeTab === "evidence" && (
          <div>
            {/* Supporting Evidence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={13} color="var(--accent-rose)" />
                <span className="font-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-rose)", letterSpacing: "0.05em" }}>
                  [+] INCRIMINATING SIGNALS ({caseData.supporting_evidence.length})
                </span>
              </div>
              {caseData.supporting_evidence.length === 0 ? (
                <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None observed.</p>
              ) : (
                caseData.supporting_evidence.map((ev) => (
                  <div key={ev.id} className="evidence-card supporting">
                    <div style={{ fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ev.title}</div>
                    <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>SRC: {ev.source}</div>
                  </div>
                ))
              )}
            </div>

            {/* Contradicting Evidence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <XCircle size={13} color="var(--accent-emerald)" />
                <span className="font-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-emerald)", letterSpacing: "0.05em" }}>
                  [-] BENIGN / MITIGATING SIGNALS ({caseData.contradicting_evidence.length})
                </span>
              </div>
              {caseData.contradicting_evidence.length === 0 ? (
                <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None observed.</p>
              ) : (
                caseData.contradicting_evidence.map((ev) => (
                  <div key={ev.id} className="evidence-card contradicting">
                    <div style={{ fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ev.title}</div>
                    <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>SRC: {ev.source}</div>
                  </div>
                ))
              )}
            </div>

            {/* Missing Evidence / Uncertainty */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={13} color="var(--accent-amber)" />
                <span className="font-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-amber)", letterSpacing: "0.05em" }}>
                  [?] UNCERTAINTY GAP / STEP-UP REQ ({caseData.missing_evidence.length})
                </span>
              </div>
              {caseData.missing_evidence.length === 0 ? (
                <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>Evidence completeness sufficient.</p>
              ) : (
                caseData.missing_evidence.map((item, idx) => (
                  <div key={idx} className="evidence-card missing">
                    <div style={{ fontWeight: 500, color: "#fef3c7" }}>{item}</div>
                    <div className="font-mono" style={{ fontSize: "0.68rem", color: "var(--accent-amber)", marginTop: 2 }}>
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
            <span className="font-mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 10, letterSpacing: "0.04em" }}>
              // INSTITUTIONAL GUARDRAILS & POLICIES (GRAPHRAG):
            </span>
            {policies.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 0,
                  padding: "10px",
                  marginBottom: 8,
                  fontSize: "0.78rem"
                }}
              >
                <div className="font-mono" style={{ fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 4, letterSpacing: "0.04em" }}>
                  {p.id}: {p.topic}
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>{p.content}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "memory" && (
          <div>
            <span className="font-mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 10, letterSpacing: "0.04em" }}>
              // HISTORICAL CASE MEMORY MATCHES:
            </span>
            {similarCases.length === 0 ? (
              <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No past cases matching current topology.</p>
            ) : (
              similarCases.map((mem) => (
                <div
                  key={mem.case_id}
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 0,
                    padding: "10px",
                    marginBottom: 8,
                    fontSize: "0.78rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{mem.case_id}</span>
                    <span
                      className="font-mono"
                      style={{
                        color: mem.final_outcome === "CONFIRMED_FRAUD" ? "var(--accent-rose)" : "var(--accent-emerald)",
                        fontWeight: 700,
                        fontSize: "0.7rem"
                      }}
                    >
                      {mem.final_outcome}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{mem.summary}</div>
                  <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    RISK: {mem.risk_score} | CONF: {mem.confidence}
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
