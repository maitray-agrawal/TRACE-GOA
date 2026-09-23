import React, { useState } from "react";
import type { CaseRecord } from "../types";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { approveCaseAction } from "../services/api";

interface ApprovalCenterProps {
  cases: CaseRecord[];
  activeRole: string;
  onActionComplete?: () => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ cases, activeRole, onActionComplete }) => {
  const [approverName, setApproverName] = useState("Analyst J. Doe");
  const [notes, setNotes] = useState("");
  const [processingCaseId, setProcessingCaseId] = useState<string | null>(null);

  const pendingCases = cases.filter((c) => c.status === "AWAITING_APPROVAL");

  const handleDecision = async (caseId: string, actionName: string, approved: boolean) => {
    setProcessingCaseId(caseId);
    try {
      await approveCaseAction(caseId, {
        action: actionName,
        approver_name: approverName,
        approver_role: activeRole,
        approved,
        notes: notes || (approved ? "Authorized pursuant to policy review" : "Rejected: insufficient evidence")
      });
      setNotes("");
      onActionComplete?.();
    } catch (e) {
      alert(`Approval error: ${e}`);
    } finally {
      setProcessingCaseId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 className="font-mono" style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.04em" }}>
            <AlertCircle size={18} color="var(--accent-amber)" />
            CLEARANCE CENTER // SUPERVISORY SIGN-OFF
          </h2>
          <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            High-Impact Enforcement Actions Requiring Supervisory Electronic Clearance
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SIGNING AS:</span>
          <input
            type="text"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            className="font-mono"
            style={{
              background: "var(--bg-tertiary)",
              color: "#fff",
              border: "1px solid var(--border-color)",
              padding: "4px 8px",
              borderRadius: 0,
              fontSize: "0.78rem"
            }}
          />
        </div>
      </div>

      {pendingCases.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          <CheckCircle size={32} color="var(--accent-emerald)" style={{ margin: "0 auto 10px", opacity: 0.8 }} />
          <p className="font-mono" style={{ fontSize: "0.85rem" }}>No actions currently awaiting clearance. Queue clear.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pendingCases.map((c) => {
            const pending = c.approvals.find((a) => a.status === "PENDING") || {
              action: c.recommended_actions[0]?.action || "ACTION",
              required_role: c.recommended_actions[0]?.approval_route || "FRAUD_MANAGER",
              reason: c.recommended_actions[0]?.reason || "Supervisory clearance required"
            };

            return (
              <div
                key={c.case_id}
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--accent-amber)",
                  borderRadius: 0,
                  padding: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <span className="font-mono" style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--accent-cyan)" }}>{c.case_id}</span>
                    <span className="font-mono" style={{ marginLeft: 10, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      SUBJECT: {c.subject_customer_id} | TRIGGER: {c.trigger_txn_id}
                    </span>
                  </div>
                  <span className="status-badge warning font-mono">
                    REQUIRES: {pending.required_role}
                  </span>
                </div>

                <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px", borderRadius: 0, marginBottom: 12, fontSize: "0.82rem", border: "1px solid var(--border-color)" }}>
                  <div className="font-mono" style={{ fontWeight: 700, color: "var(--accent-amber)", marginBottom: 4 }}>
                    PROPOSED MOVE: {pending.action}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>{pending.reason}</div>
                  <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>
                    RISK: {c.risk_score} | CONFIDENCE: {c.confidence} | TYPOLOGY: {c.fraud_patterns.join(", ") || "None"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Optional justification or policy citation note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="font-mono"
                    style={{
                      flex: 1,
                      background: "var(--bg-primary)",
                      color: "#fff",
                      border: "1px solid var(--border-color)",
                      padding: "8px 12px",
                      borderRadius: 0,
                      fontSize: "0.78rem"
                    }}
                  />
                  <button
                    className="btn-primary"
                    style={{ background: "var(--accent-emerald)", color: "#000", fontWeight: 700, borderRadius: 0 }}
                    onClick={() => handleDecision(c.case_id, pending.action, true)}
                    disabled={processingCaseId === c.case_id}
                  >
                    <CheckCircle size={14} /> AUTHORIZE MOVE
                  </button>
                  <button
                    className="btn-danger"
                    style={{ borderRadius: 0 }}
                    onClick={() => handleDecision(c.case_id, pending.action, false)}
                    disabled={processingCaseId === c.case_id}
                  >
                    <XCircle size={14} /> DENY MOVE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
