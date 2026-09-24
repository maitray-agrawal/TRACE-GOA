import React, { useState } from "react";
import type { LedgerEntry } from "../types";
import { ShieldCheck, ShieldAlert, Link as LinkIcon, Hash, RefreshCw, AlertTriangle, Lock } from "lucide-react";
import { verifyLedger } from "../services/api";

interface DecisionLedgerViewerProps {
  caseId: string;
  entries: LedgerEntry[];
  onRefresh?: () => void;
}

export const DecisionLedgerViewer: React.FC<DecisionLedgerViewerProps> = ({ caseId, entries }) => {
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [simulatedTamperIndex, setSimulatedTamperIndex] = useState<number | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyLedger(caseId);
      if (simulatedTamperIndex !== null) {
        // Show simulated tamper break
        setVerificationResult({
          is_valid: false,
          error: `CHAIN BROKEN at Block #${simulatedTamperIndex}: Hash mismatch with previous block payload.`,
          entries_verified: simulatedTamperIndex,
          tampered_block: simulatedTamperIndex
        });
      } else {
        setVerificationResult(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleTamperSimulation = () => {
    if (simulatedTamperIndex === null && entries.length > 1) {
      setSimulatedTamperIndex(entries[1].entry_id);
      setVerificationResult(null);
    } else {
      setSimulatedTamperIndex(null);
      setVerificationResult(null);
    }
  };

  return (
    <div className="card-goa card-goa-paper p-6 border-3 border-ink shadow-goa select-none space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider bg-goa-green-500 text-paper px-2 py-0.5 rounded border border-ink">
              IMMUTABLE AUDIT TRAIL
            </span>
            <h2 className="font-serif text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <Lock size={22} className="text-goa-green-700" />
              Forensic Decision Ledger // Case {caseId}
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 mt-1">
            SHA-256 Cryptographic Chain of Custody for Every Autonomous Agent & Human Supervisory Move
          </p>
        </div>

        {/* Actions & Verification Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          {verificationResult && (
            <div
              className={`font-mono text-xs font-black px-3 py-1.5 rounded-lg border-2 border-ink flex items-center gap-1.5 shadow-goa-sm ${
                verificationResult.is_valid
                  ? "bg-goa-green-500 text-paper"
                  : "bg-hot-pink text-paper animate-bounce"
              }`}
            >
              {verificationResult.is_valid ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              <span>
                {verificationResult.is_valid
                  ? `SEALED & VALIDATED (${verificationResult.entries_verified || entries.length} BLOCKS)`
                  : "CRYPTOGRAPHIC TAMPER DETECTED"}
              </span>
            </div>
          )}

          <button
            onClick={toggleTamperSimulation}
            className={`font-mono text-xs font-bold px-3 py-1.5 rounded border-2 border-ink transition-colors flex items-center gap-1.5 ${
              simulatedTamperIndex !== null
                ? "bg-hot-pink text-paper"
                : "bg-sand hover:bg-sun-yellow text-ink"
            }`}
          >
            <AlertTriangle size={13} />
            <span>{simulatedTamperIndex !== null ? "REVERT TAMPER" : "SIMULATE TAMPER"}</span>
          </button>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-xs py-1.5 px-4 font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isVerifying ? "animate-spin" : ""} />
            <span>{isVerifying ? "VERIFYING HASHES..." : "SWEEP INTEGRITY"}</span>
          </button>
        </div>
      </div>

      {/* Ledger Chain Container */}
      {entries.length === 0 ? (
        <div className="py-14 text-center border-3 border-dashed border-ink/30 rounded-xl bg-sand/20 font-mono text-xs text-ink/70">
          No ledger events registered yet for case {caseId}. Run investigation to initiate blocks.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4">
          {/* Bamboo vertical connection line */}
          <div className="absolute left-2.5 top-4 bottom-4 w-1.5 bg-amber-300 border-x border-ink rounded-full" />

          {entries.map((entry, idx) => {
            const isTampered = simulatedTamperIndex === entry.entry_id;

            return (
              <div key={entry.entry_id || idx} className="relative group">
                {/* Hash Chain Node on Line */}
                <div
                  className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 border-ink flex items-center justify-center font-mono text-[9px] font-black z-10 shadow-xs ${
                    isTampered
                      ? "bg-hot-pink text-paper ring-4 ring-red-400"
                      : "bg-paper text-ink"
                  }`}
                >
                  #{entry.entry_id}
                </div>

                {/* Block Card */}
                <div
                  className={`p-4 rounded-xl border-3 border-ink shadow-goa-sm transition-all ${
                    isTampered
                      ? "bg-red-50 border-hot-pink"
                      : "card-goa card-goa-sand"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-2 mb-2">
                    <span className="font-mono text-xs font-black text-ink uppercase flex items-center gap-1.5">
                      <Hash size={13} className="text-terracotta" />
                      BLOCK #{entry.entry_id} — {entry.event_type}
                    </span>
                    <span className="font-mono text-[10px] text-ink/60 bg-paper px-2 py-0.5 rounded border border-ink/30">
                      {new Date(entry.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-2">
                    <div>
                      <span className="text-ink/60 uppercase">ACTOR: </span>
                      <strong className="text-ink">{entry.actor}</strong>
                    </div>
                    <div>
                      <span className="text-ink/60 uppercase">DECISION: </span>
                      <strong className="text-goa-green-700">{entry.decision || "LOGGED"}</strong>
                    </div>
                  </div>

                  {entry.reason && (
                    <div className="bg-paper/70 p-2.5 rounded border border-ink/20 mb-2 font-sans text-xs text-ink/90 leading-relaxed">
                      <strong className="font-mono text-[10px] text-ink/60 uppercase block mb-0.5">RATIONALE:</strong>
                      {entry.reason}
                    </div>
                  )}

                  {/* Cryptographic Hashes */}
                  <div className="p-2.5 bg-paper rounded border-2 border-ink/30 font-mono text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 text-ink/70">
                      <LinkIcon size={11} className="text-ink/50" />
                      <span>PREV HASH:</span>
                      <span className="text-ink font-bold font-mono truncate">
                        {isTampered ? "0000_TAMPERED_HASH_FAILURE_9999" : entry.previous_hash}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-ink/70">
                      <Hash size={11} className="text-goa-green-700" />
                      <span>CURR HASH:</span>
                      <span className="text-goa-green-900 font-bold font-mono truncate">
                        {entry.current_hash}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
