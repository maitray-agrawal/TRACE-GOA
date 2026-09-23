import React, { useState } from "react";
import type { LedgerEntry } from "../types";
import { ShieldCheck, ShieldAlert, Link, Hash, RefreshCw } from "lucide-react";
import { verifyLedger } from "../services/api";

interface DecisionLedgerViewerProps {
  caseId: string;
  entries: LedgerEntry[];
  onRefresh?: () => void;
}

export const DecisionLedgerViewer: React.FC<DecisionLedgerViewerProps> = ({ caseId, entries }) => {
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyLedger(caseId);
      setVerificationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Hash size={18} color="var(--accent-indigo)" />
            Cryptographic Decision Ledger — Case {caseId}
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            SHA-256 Merkle-Chained Tamper-Evident Forensic Audit Trail
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {verificationResult && (
            <span
              className={`status-badge ${verificationResult.is_valid ? "active" : "critical"}`}
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
            >
              {verificationResult.is_valid ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {verificationResult.is_valid ? "Chain Verified (Untampered)" : "TAMPERING DETECTED"}
            </span>
          )}

          <button className="btn-primary" onClick={handleVerify} disabled={isVerifying}>
            <RefreshCw size={14} className={isVerifying ? "animate-spin" : ""} />
            {isVerifying ? "Verifying Hashes..." : "Verify Cryptographic Integrity"}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)" }}>
          No ledger events found for this case docket.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entries.map((entry) => (
            <div
              key={entry.entry_id}
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                padding: "12px 16px",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: "0.85rem" }}>
                  Block #{entry.entry_id} — {entry.event_type}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {new Date(entry.timestamp * 1000).toLocaleString()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.78rem", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Actor: </span>
                  <span style={{ color: "#fff", fontWeight: 500 }}>{entry.actor}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Decision: </span>
                  <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>{entry.decision || "N/A"}</span>
                </div>
              </div>

              {entry.reason && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>Rationale: </span>
                  {entry.reason}
                </div>
              )}

              {/* Hash chain pointers */}
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  padding: "6px 10px",
                  borderRadius: 4,
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  color: "var(--text-muted)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <Link size={10} /> Prev Hash: <span style={{ color: "#9ca3af" }}>{entry.previous_hash.slice(0, 32)}...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Hash size={10} /> Curr Hash: <span style={{ color: "var(--accent-indigo)" }}>{entry.current_hash.slice(0, 32)}...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
