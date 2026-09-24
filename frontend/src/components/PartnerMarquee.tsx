import React, { useEffect, useState } from 'react';
import { PalmTree } from '../art/PalmTree';
import { fetchDiagnostics } from '../services/api';

export const PartnerMarquee: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [diag, setDiag] = useState<any>({
    graph_engine: 'SIMULATOR',
    mcp: 'LOCAL_DISPATCHER',
    llm: 'DETERMINISTIC_RULES',
    dataset: 'HHGOA_IEEE',
    ledger: 'ACTIVE'
  });

  useEffect(() => {
    fetchDiagnostics().then(setDiag).catch(console.error);
  }, []);

  const isTigerGraphLive = diag.graph_engine === 'TIGERGRAPH' || diag.graph_engine === 'TIGERGRAPH (LIVE)';
  const isGeminiLive = Boolean(diag.llm && diag.llm.toUpperCase().includes('GEMINI'));
  const isOfficialMcp = diag.mcp === 'OFFICIAL';

  const partners = [
    {
      label: isTigerGraphLive ? 'TIGERGRAPH LIVE GRAPH DATABASE' : 'TIGERGRAPH GRAPH SIMULATOR',
      tag: isTigerGraphLive ? 'LIVE_GRAPH' : 'SIMULATOR'
    },
    { label: 'HACKER HOUSE GOA 2026', tag: 'HHGOA' },
    {
      label: isGeminiLive ? `GOOGLE GEMINI (${diag.llm})` : 'DETERMINISTIC REASONING ENGINE',
      tag: isGeminiLive ? 'REASONING_LLM' : 'POLICY_ENGINE'
    },
    {
      label: isOfficialMcp ? 'TIGERGRAPH MCP SERVER' : 'MCP LOCAL DISPATCHER',
      tag: isOfficialMcp ? 'OFFICIAL_MCP' : 'LOCAL_MCP'
    },
    { label: 'SHA-256 HASH-CHAINED AUDIT LEDGER', tag: 'GOVERNANCE' },
    { label: 'SAR REGULATORY COMPLIANCE GATEWAY', tag: 'POLICY_R1' },
    { label: 'GRAPHRAG CONTEXT SYNTHESIZER', tag: 'KNOWLEDGE_BASE' }
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
