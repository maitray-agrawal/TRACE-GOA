import React, { useState } from "react";
import type { CaseRecord } from "../types";
import { RubberStamp } from "../art/RubberStamp";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, UserCheck, Lock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { approveCaseAction } from "../services/api";

interface ApprovalCenterProps {
  cases: CaseRecord[];
  activeRole: string;
  onActionComplete?: () => void;
}

const ROLE_RANKS: Record<string, number> = {
  ANALYST: 1,
  SENIOR_ANALYST: 2,
  FRAUD_MANAGER: 3,
};

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ cases, activeRole, onActionComplete }) => {
  const [approverName, setApproverName] = useState("Lead Investigator M. Agrawal");
  const [notes, setNotes] = useState("");
  const [processingCaseId, setProcessingCaseId] = useState<string | null>(null);
  const [recentDecision, setRecentDecision] = useState<{ caseId: string; type: "APPROVED" | "REJECTED" | "ESCALATED" } | null>(null);

  const pendingCases = cases.filter((c) => c.status === "AWAITING_APPROVAL");

  const canApproveRole = (requiredRole: string): boolean => {
    const userRank = ROLE_RANKS[activeRole] || 1;
    const reqRank = ROLE_RANKS[requiredRole] || 2;
    return userRank >= reqRank;
  };

  const handleDecision = async (caseId: string, actionName: string, approved: boolean, isEscalation = false) => {
    setProcessingCaseId(caseId);
    try {
      await approveCaseAction(caseId, {
        action: actionName,
        approver_name: approverName,
        approver_role: activeRole,
        approved,
        notes: notes || (isEscalation ? "Escalated to Fraud Manager clearance" : approved ? "Authorized pursuant to policy review" : "Rejected: insufficient evidence")
      });
      setRecentDecision({ caseId, type: isEscalation ? "ESCALATED" : approved ? "APPROVED" : "REJECTED" });
      setNotes("");
      onActionComplete?.();
      setTimeout(() => setRecentDecision(null), 3000);
    } catch (e) {
      alert(`Approval error: ${e}`);
    } finally {
      setProcessingCaseId(null);
    }
  };

  return (
    <div className="card-goa card-goa-paper p-6 border-3 border-ink shadow-goa select-none space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider bg-sun-yellow text-ink px-2 py-0.5 rounded border border-ink">
              RBAC GOVERNANCE
            </span>
            <h2 className="font-serif text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-terracotta" size={24} />
              Supervisory Clearance Center // Rubber Stamp Approvals
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 mt-1">
            High-Impact Enforcement Actions Requiring Supervisory Electronic Sign-Off &amp; SHA-256 Ledger Notarization
          </p>
        </div>

        {/* Signer Identity Bar */}
        <div className="flex items-center gap-2 bg-sand/50 p-2 rounded-lg border-2 border-ink">
          <UserCheck size={16} className="text-goa-green-700" />
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-ink/60 uppercase">CURRENT USER ROLE:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-ink bg-sun-yellow px-1.5 py-0.2 rounded border border-ink">
                {activeRole}
              </span>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="font-mono text-xs font-bold bg-paper text-ink px-2 py-0.5 rounded border border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Approval Queue */}
      {pendingCases.length === 0 ? (
        <div className="py-16 text-center border-3 border-dashed border-ink/30 rounded-xl bg-sand/20 space-y-3">
          <div className="text-4xl">🏖</div>
          <h3 className="font-serif text-xl font-black text-ink">Clearance Queue Clear</h3>
          <p className="font-mono text-xs text-ink/70 max-w-md mx-auto">
            All high-impact enforcement actions have been vetted and signed. Return to the Village Grid to inspect incoming transactions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingCases.map((c) => {
            const pending = c.approvals?.find((a) => a.status === "PENDING") || {
              action: c.recommended_actions?.[0]?.action || "STEP_UP_AUTH",
              required_role: c.recommended_actions?.[0]?.approval_route || "SENIOR_ANALYST",
              reason: c.recommended_actions?.[0]?.reason || "Supervisory clearance required by institutional policy"
            };

            const isAuthorized = canApproveRole(pending.required_role);
            const isCurrentDecision = recentDecision?.caseId === c.case_id;

            return (
              <div
                key={c.case_id}
                className="relative card-goa card-goa-sand p-5 border-3 border-ink shadow-goa-sm overflow-hidden"
              >
                {/* Stamp Overlay on Decision */}
                {isCurrentDecision && recentDecision && (
                  <div className="absolute inset-0 bg-paper/90 z-20 flex items-center justify-center animate-bounce">
                    <RubberStamp
                      type={recentDecision.type}
                      by={approverName}
                      date={new Date().toISOString().split("T")[0]}
                      size="lg"
                    />
                  </div>
                )}

                {/* Case Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink/20 pb-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-goa-green-900 bg-paper px-2.5 py-0.5 rounded border border-ink">
                      {c.case_id}
                    </span>
                    <span className="font-mono text-xs text-ink/70">
                      CUSTOMER: <strong className="text-ink">{c.subject_customer_id}</strong> | TRIGGER: {c.trigger_txn_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-sun-yellow text-ink border border-ink flex items-center gap-1">
                      <AlertTriangle size={11} />
                      REQUIRED ROLE: {pending.required_role}
                    </span>

                    {!isAuthorized && (
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-hot-pink text-paper border border-ink flex items-center gap-1">
                        <Lock size={11} />
                        LOCKED FOR {activeRole}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action + Policy Summary Box */}
                <div className="bg-paper p-3.5 rounded-lg border-2 border-ink mb-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-terracotta uppercase tracking-wide">
                      PROPOSED MOVE: {pending.action}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-ink/70">
                      <span>STATUS: <strong className="text-amber-800">PENDING SIGN-OFF</strong></span>
                      <span>•</span>
                      <span>RISK: <strong>{c.risk_score.toFixed(2)}</strong></span>
                      <span>•</span>
                      <span>CONFIDENCE: <strong>{Math.round(c.confidence * 100)}%</strong></span>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-ink/90 leading-relaxed">
                    {pending.reason}
                  </p>

                  <div className="font-mono text-[10px] text-ink/60 border-t border-ink/10 pt-1.5 flex items-center justify-between">
                    <span>POLICY BASIS: <strong>POL-04 (Dual-Control Mandatory Clearance)</strong></span>
                    <span>TYPOLOGY: <strong>{c.fraud_patterns?.join(", ") || "Cross-Card Syndicate"}</strong></span>
                  </div>
                </div>

                {/* Supervisory Authorization Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Enter supervisory rationale or policy citation note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex-1 min-w-[220px] font-mono text-xs bg-paper text-ink px-3 py-2 rounded border-2 border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />

                  {/* APPROVE STAMP BUTTON */}
                  <button
                    onClick={() => handleDecision(c.case_id, pending.action, true)}
                    disabled={processingCaseId === c.case_id || !isAuthorized}
                    title={!isAuthorized ? `Requires ${pending.required_role} approval. Current role: ${activeRole}.` : 'Authorize and seal decision block'}
                    className={`btn-goa text-xs py-2 px-4 flex items-center gap-1.5 font-black uppercase tracking-wider ${
                      isAuthorized
                        ? 'bg-goa-green-500 hover:bg-goa-green-700 text-paper'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                    }`}
                  >
                    {!isAuthorized ? <Lock size={13} /> : <CheckCircle size={14} />}
                    <span>STAMP APPROVE</span>
                  </button>

                  {/* REJECT STAMP BUTTON */}
                  <button
                    onClick={() => handleDecision(c.case_id, pending.action, false)}
                    disabled={processingCaseId === c.case_id}
                    className="btn-goa bg-hot-pink hover:bg-red-700 text-paper text-xs py-2 px-4 flex items-center gap-1.5 font-black uppercase tracking-wider"
                  >
                    <XCircle size={14} />
                    <span>STAMP REJECT</span>
                  </button>

                  {/* ESCALATE BUTTON */}
                  <button
                    onClick={() => handleDecision(c.case_id, pending.action, false, true)}
                    disabled={processingCaseId === c.case_id}
                    className="btn-goa bg-sun-yellow hover:bg-yellow-400 text-ink text-xs py-2 px-3 flex items-center gap-1 font-black uppercase tracking-wider"
                  >
                    <ArrowUpRight size={13} />
                    <span>ESCALATE [L3]</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 bg-goa-green-100 border border-goa-green-500/40 rounded-lg flex items-center justify-between font-mono text-[10px] text-goa-green-900">
        <span className="flex items-center gap-1 font-bold">
          <ShieldCheck size={13} />
          CRYPTOGRAPHIC GUARANTEE: Every authorization decision is signed and appended to the SHA-256 Decision Ledger.
        </span>
        <span className="uppercase font-black">TRACE//GOA COMPLIANCE</span>
      </div>
    </div>
  );
};
