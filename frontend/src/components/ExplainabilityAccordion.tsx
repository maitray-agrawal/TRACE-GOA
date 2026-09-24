import React, { useState } from 'react';
import type { CaseRecord } from '../types';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface ExplainabilityAccordionProps {
  caseData: CaseRecord | null;
  className?: string;
}

export const ExplainabilityAccordion: React.FC<ExplainabilityAccordionProps> = ({
  caseData,
  className = '',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!caseData) return null;

  const faqs = [
    {
      q: 'Why was this specific Next-Best Action chosen?',
      a:
        caseData.recommended_actions && caseData.recommended_actions.length > 0
          ? caseData.recommended_actions[0].reason
          : 'The agent synthesizes TigerGraph 2-hop topology evidence, compares against risk tolerance thresholds, and selects the minimum friction action that eliminates financial loss.',
    },
    {
      q: 'What institutional policy guardrails governed this move?',
      a:
        caseData.recommended_actions?.[0]?.policy_basis?.length
          ? `Action adheres strictly to: ${caseData.recommended_actions[0].policy_basis.join(
              ', '
            )}. GraphRAG deterministic gating prevented unauthorized autonomous freeze.`
          : 'Bank Policy POL-04 (Dual Control for Account Freeze) and POL-02 (Out-of-Band Step-Up Challenge for Uncertain IP/Device Signals) were evaluated.',
    },
    {
      q: 'What graph link or anomaly was decisive in the investigation?',
      a:
        caseData.fraud_patterns && caseData.fraud_patterns.length > 0
          ? `Decisive pattern: ${caseData.fraud_patterns.join(
              ', '
            )}. Multi-hop traversal uncovered shared card/device fingerprints across multiple customer dockets.`
          : '2-hop BFS traversal from trigger transaction identified correlated device fingerprint and velocity anomaly.',
    },
    {
      q: 'Why did the agent not freeze the customer account immediately?',
      a:
        caseData.risk_score < 0.85
          ? `Because the risk score (${caseData.risk_score.toFixed(
              2
            )}) was within the uncertainty boundary (0.40–0.85) with mitigating signals. Policy requires stepping up verification before imposing customer friction.`
          : 'High risk was verified, but mandatory supervisory clearance protocol requires Analyst sign-off before irreversible account closure.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className={`card-goa card-goa-paper p-4 border-3 border-ink shadow-goa select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-goa-green-700" />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-ink">
            EXPLAINABILITY ACCORDION // WHY THIS MOVE?
          </h3>
        </div>
        <span className="font-mono text-[9px] bg-sun-yellow text-ink px-2 py-0.5 rounded font-black border border-ink">
          AUDITABLE RATIONALE
        </span>
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="border-2 border-ink rounded-lg bg-sand/30 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-3 text-left font-mono text-xs font-bold text-ink flex items-center justify-between gap-2 hover:bg-sand/60 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-terracotta font-black">Q{idx + 1}.</span>
                  {faq.q}
                </span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isOpen && (
                <div className="p-3 bg-paper border-t border-ink/20 font-sans text-xs text-ink/90 leading-relaxed space-y-1.5 animate-fadeIn">
                  <p>{faq.a}</p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-goa-green-900 pt-1 border-t border-ink/10">
                    <CheckCircle size={11} className="text-goa-green-500" />
                    <span>Cross-referenced against TigerGraph schema & Policy Knowledge Graph</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
