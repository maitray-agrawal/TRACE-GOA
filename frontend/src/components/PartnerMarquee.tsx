import React from 'react';
import { PalmTree } from '../art/PalmTree';

export const PartnerMarquee: React.FC<{ className?: string }> = ({ className = '' }) => {
  const partners = [
    { label: 'TIGERGRAPH GRAPH DATABASE', tag: 'GRAPH_ENGINE' },
    { label: 'HACKER HOUSE GOA 2026', tag: 'HHGOA' },
    { label: 'GOOGLE CLOUD GEMINI 2.5', tag: 'REASONING_LLM' },
    { label: 'MODEL CONTEXT PROTOCOL (MCP)', tag: 'TOOL_DISPATCH' },
    { label: 'FINCEN REGULATORY BSA', tag: 'SAR_REPORTING' },
    { label: 'SHA-256 AUDIT LEDGER', tag: 'GOVERNANCE' },
  ];

  return (
    <div className={`w-full overflow-hidden bg-goa-green-900 text-paper border-t-3 border-ink py-3 select-none ${className}`}>
      <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
        {[...partners, ...partners].map((p, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <PalmTree size={18} className="opacity-70" />
            <span className="font-mono text-xs font-black tracking-wider text-sun-yellow">
              {p.label}
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-paper text-ink font-bold border border-ink">
              {p.tag}
            </span>
            <span className="text-paper/40 font-mono text-xs">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};
