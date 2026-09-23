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
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} color="var(--accent-amber)" />
            Institutional Governance & Approval Center
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            High-Impact Enforcement Actions Requiring Supervisory Electronic Sign-Off
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Signing as:</span>
          <input
            type="text"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            style={{
              background: "var(--bg-tertiary)",
              color: "#fff",
              border: "1px solid var(--border-color)",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: "0.8rem"
            }}
          />
        </div>
      </div>

      {pendingCases.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          <CheckCircle size={32} color="var(--accent-emerald)" style={{ margin: "0 auto 10px", opacity: 0.8 }} />
          <p>No actions currently awaiting approval. System operational.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pendingCases.map((c) => {
            const pending = c.approvals.find((a) => a.status === "PENDING") || {
              action: c.recommended_actions[0]?.action || "ACTION",
              required_role: c.recommended_actions[0]?.approval_route || "FRAUD_MANAGER",
              reason: c.recommended_actions[0]?.reason || "Supervisory sign-off required"
            };

            return (
              <div
                key={c.case_id}
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  borderRadius: 8,
                  padding: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{c.case_id}</span>
                    <span style={{ marginLeft: 10, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Subject: {c.subject_customer_id} | Trigger: {c.trigger_txn_id}
                    </span>
                  </div>
                  <span className="status-badge warning">
                    Requires: {pending.required_role}
                  </span>
                </div>

                <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px", borderRadius: 6, marginBottom: 12, fontSize: "0.82rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--accent-amber)", marginBottom: 4 }}>
                    Proposed Action: {pending.action}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>{pending.reason}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                    Risk Score: {c.risk_score} | Confidence: {c.confidence} | Patterns: {c.fraud_patterns.join(", ") || "None"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Optional justification or policy citation note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      flex: 1,
                      background: "var(--bg-tertiary)",
                      color: "#fff",
                      border: "1px solid var(--border-color)",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: "0.8rem"
                    }}
                  />
                  <button
                    className="btn-primary"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                    onClick={() => handleDecision(c.case_id, pending.action, true)}
                    disabled={processingCaseId === c.case_id}
                  >
                    <CheckCircle size={14} /> Authorize & Execute
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDecision(c.case_id, pending.action, false)}
                    disabled={processingCaseId === c.case_id}
                  >
                    <XCircle size={14} /> Reject Action
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
