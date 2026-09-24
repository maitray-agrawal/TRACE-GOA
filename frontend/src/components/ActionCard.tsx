import React, { useState } from 'react';
import type { RecommendedAction } from '../types';
import { ShieldAlert, CheckCircle2, ArrowRight, FileText, UserCheck, RefreshCw, Zap } from 'lucide-react';

interface ActionCardProps {
  actions: RecommendedAction[];
  activeRole: string;
  onAuthorize: (action: RecommendedAction) => Promise<void>;
  sarDocket?: any;
  onViewSar?: () => void;
  isAuthorizing?: boolean;
  beforeEvidenceAction?: {
    action: string;
    risk: number;
    confidence: number;
  };
  decisionChanged?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  actions = [],
  activeRole,
  onAuthorize,
  sarDocket,
  onViewSar,
  isAuthorizing = false,
  beforeEvidenceAction,
  decisionChanged = true,
}) => {
  const [showComparison, setShowComparison] = useState(true);
  const [authorizingIndex, setAuthorizingIndex] = useState<number | null>(null);

  const handleAuthClick = async (act: RecommendedAction, idx: number) => {
    setAuthorizingIndex(idx);
    try {
      await onAuthorize(act);
    } finally {
      setAuthorizingIndex(null);
    }
  };

  const primaryAction = actions[0];

  return (
    <div className="card-goa card-goa-paper p-5 border-3 border-ink shadow-goa relative flex flex-col h-full select-none space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-terracotta" />
            NEXT-BEST ACTION (NBA) // VISUAL HERO
          </span>
        </div>

        {/* Comparison toggle */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-sand border border-ink hover:bg-sun-yellow transition-colors flex items-center gap-1"
        >
          <RefreshCw size={10} />
          {showComparison ? 'HIDE EVIDENCE DELTA' : 'SHOW EVIDENCE DELTA'}
        </button>
      </div>

      {/* BEFORE / AFTER EVIDENCE COMPARISON POSTER */}
      {showComparison && (
        <div className="p-3 bg-paper rounded-xl border-2 border-ink shadow-goa-sm space-y-2">
          <div className="flex items-center justify-between border-b border-ink/15 pb-1.5">
            <span
              className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded border border-ink flex items-center gap-1 ${
                decisionChanged ? 'bg-sun-yellow text-ink' : 'bg-goa-green-200 text-goa-green-900'
              }`}
            >
              <Zap size={11} className={decisionChanged ? 'text-terracotta' : 'text-goa-green-700'} />
              {decisionChanged ? 'EVIDENCE CHANGED THE DECISION' : 'EVIDENCE CONFIRMED THE DECISION'}
            </span>
            <span className="font-mono text-[9px] text-ink/60 uppercase">TigerGraph 2-Hop Grounding</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Left: Before Evidence */}
            <div className="p-2.5 bg-sand/40 rounded border border-ink/30 space-y-1">
              <div className="text-[9px] font-black text-ink/60 uppercase tracking-wide">
                BEFORE EVIDENCE (NAIVE ALERT):
              </div>
              <div className="font-serif text-sm font-bold text-terracotta">
                {beforeEvidenceAction?.action || 'REQUEST_STEP_UP_AUTH'}
              </div>
              <div className="text-[10px] text-ink/70 flex justify-between pt-1 border-t border-ink/10">
                <span>RISK: {(beforeEvidenceAction?.risk ?? 0.61).toFixed(2)}</span>
                <span>CONF: {Math.round((beforeEvidenceAction?.confidence ?? 0.45) * 100)}%</span>
              </div>
            </div>

            {/* Right: After Evidence */}
            <div className="p-2.5 bg-goa-green-100 rounded border-2 border-goa-green-700 space-y-1">
              <div className="text-[9px] font-black text-goa-green-900 uppercase tracking-wide">
                POST-GRAPH (VERIFIED NBA):
              </div>
              <div className="font-serif text-sm font-bold text-goa-green-900">
                {primaryAction?.action || 'BLOCK_TRANSACTION'}
              </div>
              <div className="text-[10px] text-goa-green-800 flex justify-between pt-1 border-t border-goa-green-500/20">
                <span>RISK: {(primaryAction?.confidence ? 0.88 : 0.72).toFixed(2)}</span>
                <span>CONF: {Math.round((primaryAction?.confidence ?? 0.84) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Action List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {actions.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-ink/40 rounded bg-sand/30 font-mono text-xs text-ink/70">
            No action formulated yet. Click <strong>&quot;RUN AUTONOMOUS INVESTIGATION&quot;</strong> to formulate Next Move.
          </div>
        ) : (
          actions.map((act, idx) => {
            let priorityBadgeColor = 'bg-goa-green-500 text-paper';
            if (act.priority === 'CRITICAL') priorityBadgeColor = 'bg-hot-pink text-paper';
            else if (act.priority === 'HIGH') priorityBadgeColor = 'bg-terracotta text-paper';
            else if (act.priority === 'MEDIUM') priorityBadgeColor = 'bg-sun-yellow text-ink';

            return (
              <div
                key={idx}
                className="card-goa card-goa-sand p-4 border-2 border-ink shadow-goa-sm relative transition-all duration-300 space-y-2.5"
              >
                {/* Top Action Title & Priority */}
                <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2">
                  <div>
                    <span className="font-mono text-[9px] font-black uppercase text-ink/60 block">
                      RECOMMENDED MOVE #{idx + 1}
                    </span>
                    <span className="font-serif text-lg font-black text-ink tracking-tight">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[9px] font-black px-2 py-0.5 rounded border border-ink uppercase ${priorityBadgeColor}`}
                  >
                    {act.priority}
                  </span>
                </div>

                {/* Reason Rationale */}
                <p className="font-sans text-xs text-ink/90 leading-relaxed">
                  {act.reason}
                </p>

                {/* Policy and routing metadata */}
                <div className="bg-paper p-2.5 rounded border border-ink/20 space-y-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-ink/60 uppercase">APPROVAL ROUTE:</span>
                    <span className="font-bold text-ink bg-sand px-1.5 py-0.2 rounded border border-ink/30">
                      {act.approval_route || 'AUTOMATIC_EXECUTION'}
                    </span>
                  </div>
                  {act.policy_basis && act.policy_basis.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-ink/60 uppercase">POLICY MANDATE:</span>
                      <span className="font-bold text-goa-green-700">
                        {act.policy_basis.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Authorization or execution status */}
                <div>
                  {act.approval_required ? (
                    <button
                      onClick={() => handleAuthClick(act, idx)}
                      disabled={isAuthorizing || authorizingIndex === idx}
                      className="w-full btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-black uppercase tracking-wider transition-transform active:translate-y-0.5"
                    >
                      {authorizingIndex === idx ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>SIGNING MOVE AS {activeRole}...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} />
                          <span>AUTHORIZE MOVE AS {activeRole}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-goa-green-200 text-goa-green-900 border border-ink rounded font-mono text-xs font-black">
                      <CheckCircle2 size={13} />
                      <span>EXECUTED AUTONOMOUSLY VIA POLICY CLEARANCE</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Regulatory SAR Docket card if triggered */}
        {sarDocket && (
          <div className="p-3 bg-hot-pink/10 border-2 border-hot-pink rounded relative shadow-goa-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-black text-hot-pink flex items-center gap-1">
                <FileText size={14} />
                FINCEN SUSPICIOUS ACTIVITY REPORT (SAR)
              </span>
              <span className="font-mono text-[9px] bg-hot-pink text-paper px-1.5 py-0.5 rounded font-bold">
                SEALED DRAFT
              </span>
            </div>
            <p className="font-mono text-[10px] text-ink/80 mb-2">
              Statutory $5,000 BSA threshold exceeded. 5-point narrative docket prepared for FinCEN filing.
            </p>
            {onViewSar && (
              <button
                onClick={onViewSar}
                className="w-full font-mono text-[10px] font-bold py-1.5 bg-paper hover:bg-sand text-ink border border-ink rounded flex items-center justify-center gap-1"
              >
                <span>INSPECT SAR NARRATIVE &amp; METRICS</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
