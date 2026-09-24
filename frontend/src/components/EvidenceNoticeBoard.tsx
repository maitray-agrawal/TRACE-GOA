import React, { useState } from 'react';
import type { CaseRecord } from '../types';
import { NoticePin, TapeStrip } from '../art/NoticePin';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, History, Tag } from 'lucide-react';

interface EvidenceNoticeBoardProps {
  caseData: CaseRecord | null;
  policies?: any[];
  similarCases?: any[];
}

export const EvidenceNoticeBoard: React.FC<EvidenceNoticeBoardProps> = ({
  caseData,
  policies = [],
  similarCases = [],
}) => {
  const [activeTab, setActiveTab] = useState<'signals' | 'guardrails' | 'memory'>('signals');

  if (!caseData) {
    return (
      <div className="card-goa card-goa-sand p-6 border-3 border-ink text-center">
        <p className="font-mono text-sm text-ink/70">
          SELECT A SHACK DOCKET FROM THE VILLAGE TO INSPECT PINNED EVIDENCE.
        </p>
      </div>
    );
  }

  const totalSignals =
    caseData.supporting_evidence.length +
    caseData.contradicting_evidence.length +
    caseData.missing_evidence.length;

  return (
    <div className="card-goa card-goa-sand p-4 border-3 border-ink shadow-goa relative flex flex-col h-full overflow-hidden select-none">
      {/* Top Cork Board Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2.5 mb-3 bg-paper/60 p-2 rounded-sm border border-ink/40">
        <div className="flex items-center gap-2">
          <NoticePin color="pink" size={20} />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-ink">
            PINNED EVIDENCE // CORK BOARD
          </h3>
        </div>

        {/* Tab Switcher Styled as Notice Badges */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-2.5 py-1 rounded font-bold border-2 border-ink transition-all ${
              activeTab === 'signals'
                ? 'bg-sun-yellow text-ink shadow-xs -translate-y-0.5'
                : 'bg-paper text-ink/70 hover:bg-sand/60'
            }`}
          >
            SIGNALS ({totalSignals})
          </button>
          <button
            onClick={() => setActiveTab('guardrails')}
            className={`px-2.5 py-1 rounded font-bold border-2 border-ink transition-all flex items-center gap-1 ${
              activeTab === 'guardrails'
                ? 'bg-goa-green-500 text-paper shadow-xs -translate-y-0.5'
                : 'bg-paper text-ink/70 hover:bg-sand/60'
            }`}
          >
            <ShieldCheck size={12} />
            GUARDRAILS ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-2.5 py-1 rounded font-bold border-2 border-ink transition-all flex items-center gap-1 ${
              activeTab === 'memory'
                ? 'bg-terracotta text-paper shadow-xs -translate-y-0.5'
                : 'bg-paper text-ink/70 hover:bg-sand/60'
            }`}
          >
            <History size={12} />
            MEMORY ({similarCases.length})
          </button>
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {/* TAB 1: SIGNALS */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            {/* Incriminating Signals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-black uppercase text-hot-pink flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-hot-pink stroke-[3]" />
                  [+] INCRIMINATING SIGNALS ({caseData.supporting_evidence.length})
                </span>
                <span className="font-mono text-[9px] text-ink/60 uppercase">Weight: High</span>
              </div>

              {caseData.supporting_evidence.length === 0 ? (
                <div className="p-3 bg-paper/50 border border-dashed border-ink/40 rounded text-center font-mono text-xs text-ink/60">
                  No incriminating patterns verified in graph.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {caseData.supporting_evidence.map((ev, i) => (
                    <div
                      key={ev.id || i}
                      className="relative p-3 bg-paper rounded border-2 border-ink shadow-goa-sm transition-transform hover:-translate-y-0.5 hover:rotate-0"
                      style={{
                        transform: i % 2 === 0 ? 'rotate(-0.8deg)' : 'rotate(0.6deg)',
                      }}
                    >
                      <div className="absolute -top-2.5 right-4 pointer-events-none">
                        <NoticePin color="pink" size={16} />
                      </div>
                      <div className="font-serif text-sm font-bold text-ink leading-tight mb-1 pr-6">
                        {ev.title}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-ink/10 font-mono text-[10px]">
                        <span className="text-ink/70 flex items-center gap-1">
                          <Tag size={10} /> SRC: <strong>{ev.source || 'GRAPH_TRAVERSAL'}</strong>
                        </span>
                        <span className="px-1.5 py-0.5 bg-hot-pink/15 text-hot-pink font-bold rounded border border-hot-pink/30">
                          CONFIRMED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contradicting / Mitigating Signals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-black uppercase text-goa-green-700 flex items-center gap-1.5">
                  <XCircle size={13} className="text-goa-green-700 stroke-[3]" />
                  [-] BENIGN / MITIGATING SIGNALS ({caseData.contradicting_evidence.length})
                </span>
                <span className="font-mono text-[9px] text-ink/60 uppercase">Defense Factor</span>
              </div>

              {caseData.contradicting_evidence.length === 0 ? (
                <div className="p-3 bg-paper/50 border border-dashed border-ink/40 rounded text-center font-mono text-xs text-ink/60">
                  No mitigating counter-evidence discovered.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {caseData.contradicting_evidence.map((ev, i) => (
                    <div
                      key={ev.id || i}
                      className="relative p-3 bg-goa-green-200/50 rounded border-2 border-ink shadow-goa-sm transition-transform hover:-translate-y-0.5 hover:rotate-0"
                      style={{
                        transform: i % 2 === 0 ? 'rotate(0.7deg)' : 'rotate(-0.5deg)',
                      }}
                    >
                      <div className="absolute -top-2.5 left-4 pointer-events-none">
                        <NoticePin color="green" size={16} />
                      </div>
                      <div className="font-serif text-sm font-bold text-ink leading-tight mb-1 pl-6">
                        {ev.title}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-ink/10 font-mono text-[10px]">
                        <span className="text-ink/70 flex items-center gap-1">
                          <Tag size={10} /> SRC: <strong>{ev.source || 'REPUTATION_CACHE'}</strong>
                        </span>
                        <span className="px-1.5 py-0.5 bg-goa-green-500 text-paper font-bold rounded border border-ink">
                          BENIGN
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing Evidence / Uncertainty Gaps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-black uppercase text-terracotta flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-terracotta stroke-[3]" />
                  [?] UNCERTAINTY GAPS // STEP-UP NEEDED ({caseData.missing_evidence.length})
                </span>
                <span className="font-mono text-[9px] text-ink/60 uppercase">Verification Gate</span>
              </div>

              {caseData.missing_evidence.length === 0 ? (
                <div className="p-2.5 bg-goa-green-200 border-2 border-ink rounded font-mono text-xs text-goa-green-900 font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} /> Evidence completeness sufficient for autonomous execution.
                </div>
              ) : (
                <div className="space-y-2">
                  {caseData.missing_evidence.map((gap, i) => (
                    <div
                      key={i}
                      className="p-3 bg-sun-yellow/40 rounded border-2 border-ink shadow-goa-sm relative overflow-hidden"
                    >
                      <div className="absolute -top-1 -right-4 pointer-events-none">
                        <TapeStrip />
                      </div>
                      <div className="font-mono text-xs font-black text-ink mb-1">
                        {gap}
                      </div>
                      <div className="font-mono text-[10px] text-terracotta font-extrabold flex items-center gap-1">
                        ⚡ ACTION TRIGGER: Requires out-of-band biometric/OTP challenge before account freeze
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GUARDRAILS (GraphRAG Policies) */}
        {activeTab === 'guardrails' && (
          <div className="space-y-2.5">
            <div className="font-mono text-[10px] text-ink/70 bg-paper/80 p-2 rounded border border-ink/30 mb-2">
              // INSTITUTIONAL POLICIES RETRIEVED VIA GRAPHRAG (DETERMINISTIC GATES):
            </div>
            {policies.length === 0 ? (
              <p className="font-mono text-xs text-ink/60 text-center py-4">No policy guardrails loaded.</p>
            ) : (
              policies.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-3 bg-paper rounded border-2 border-ink shadow-goa-sm relative"
                  style={{
                    transform: idx % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.4deg)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-black text-goa-green-700 bg-goa-green-200 px-1.5 py-0.5 rounded border border-ink">
                      {p.id}: {p.topic}
                    </span>
                    <span className="font-mono text-[9px] text-ink/60 uppercase">ENFORCED</span>
                  </div>
                  <p className="font-serif text-xs text-ink/90 leading-relaxed">{p.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MEMORY (Historical Precedents) */}
        {activeTab === 'memory' && (
          <div className="space-y-2.5">
            <div className="font-mono text-[10px] text-ink/70 bg-paper/80 p-2 rounded border border-ink/30 mb-2">
              // HISTORICAL CASE PRECEDENTS MATCHED FROM 5,565 CASES:
            </div>
            {similarCases.length === 0 ? (
              <p className="font-mono text-xs text-ink/60 text-center py-4">
                No precedent match found for current graph topology.
              </p>
            ) : (
              similarCases.map((mem, idx) => (
                <div
                  key={mem.case_id || idx}
                  className="p-3 bg-paper rounded border-2 border-ink shadow-goa-sm relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-ink">{mem.case_id}</span>
                    <span
                      className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded border border-ink ${
                        mem.final_outcome === 'CONFIRMED_FRAUD'
                          ? 'bg-hot-pink text-paper'
                          : 'bg-goa-green-500 text-paper'
                      }`}
                    >
                      {mem.final_outcome}
                    </span>
                  </div>
                  <p className="font-serif text-xs text-ink/90 mb-2">{mem.summary}</p>
                  <div className="flex items-center justify-between font-mono text-[10px] text-ink/70 border-t border-ink/10 pt-1">
                    <span>RISK: {(mem.risk_score || 0).toFixed(2)}</span>
                    <span>CONFIDENCE: {Math.round((mem.confidence || 0) * 100)}%</span>
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
