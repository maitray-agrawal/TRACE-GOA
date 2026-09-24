import React, { useState } from 'react';
import type { RecommendedAction } from '../types';
import { ShieldAlert, CheckCircle2, ArrowRight, FileText, UserCheck, RefreshCw } from 'lucide-react';

interface ActionCardProps {
  actions: RecommendedAction[];
  activeRole: string;
  onAuthorize: (action: RecommendedAction) => Promise<void>;
  sarDocket?: any;
  onViewSar?: () => void;
  isAuthorizing?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  actions = [],
  activeRole,
  onAuthorize,
  sarDocket,
  onViewSar,
  isAuthorizing = false,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [authorizingIndex, setAuthorizingIndex] = useState<number | null>(null);

  const handleAuthClick = async (act: RecommendedAction, idx: number) => {
    setAuthorizingIndex(idx);
    try {
      await onAuthorize(act);
    } finally {
      setAuthorizingIndex(null);
    }
  };

  return (
    <div className="card-goa card-goa-paper p-4 border-3 border-ink shadow-goa relative flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
            <ShieldAlert size={15} className="text-terracotta" />
            NEXT MOVE // ACTION RECOMMENDATIONS
          </span>
        </div>

        {/* Comparison toggle */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-sand border border-ink hover:bg-sun-yellow transition-colors flex items-center gap-1"
        >
          <RefreshCw size={10} />
          {showComparison ? 'HIDE GRAPH DELTA' : 'SHOW GRAPH DELTA'}
        </button>
      </div>

      {/* Action list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {actions.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-ink/40 rounded bg-sand/30 font-mono text-xs text-ink/70">
            No action formulated yet. Click <strong>"RUN AUTONOMOUS INVESTIGATION"</strong> to synthesize
            graph signals and evaluate policy guardrails.
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
                className="card-goa card-goa-sand p-3.5 border-2 border-ink shadow-goa-sm relative transition-all duration-300"
              >
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-serif text-base font-bold text-ink tracking-tight">
                    {act.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded border border-ink uppercase ${priorityBadgeColor}`}
                    >
                      {act.priority}
                    </span>
                  </div>
                </div>

                {/* Optional Graph Delta (Before vs After Evidence) */}
                {showComparison && (
                  <div className="mb-2 p-2 bg-paper rounded border border-ink/40 text-[10px] font-mono grid grid-cols-2 gap-2">
                    <div className="border-r border-ink/20 pr-1 text-ink/70">
                      <div className="text-[9px] font-bold text-terracotta uppercase">Pre-Graph Naive Move:</div>
                      <div>REVERT / FREEZE TXN</div>
                    </div>
                    <div className="pl-1 text-ink">
                      <div className="text-[9px] font-bold text-goa-green-700 uppercase">Post-Graph Grounded:</div>
                      <div className="font-bold">{act.action}</div>
                    </div>
                  </div>
                )}

                {/* Reason description */}
                <p className="font-sans text-xs text-ink/90 leading-relaxed mb-2.5">
                  {act.reason}
                </p>

                {/* Policy and routing metadata */}
                <div className="bg-paper/70 p-2 rounded border border-ink/20 mb-3 space-y-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-ink/60 uppercase">APPROVAL ROUTE:</span>
                    <span className="font-bold text-ink bg-sand/60 px-1 rounded">
                      {act.approval_route || 'AUTOMATIC_EXECUTION'}
                    </span>
                  </div>
                  {act.policy_basis && act.policy_basis.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-ink/60 uppercase">POLICY BASIS:</span>
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
                      className="w-full btn-goa bg-goa-green-500 hover:bg-goa-green-700 text-paper text-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-transform active:translate-y-0.5"
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
                    <div className="flex items-center justify-center gap-1.5 py-1.5 bg-goa-green-200 text-goa-green-900 border border-ink rounded font-mono text-xs font-black">
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
                <span>INSPECT SAR NARRATIVE & METRICS</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
