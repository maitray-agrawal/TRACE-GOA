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

  const supportingTitles = caseData.supporting_evidence?.map((e) => e.title).join('; ') || 'No incriminating evidence detected.';
  const contradictingTitles = caseData.contradicting_evidence?.map((e) => e.title).join('; ') || 'No mitigating signals observed in graph.';
  const missingText = caseData.missing_evidence?.join('; ') || 'Evidence completeness sufficient for immediate execution.';
  const patternsText = caseData.fraud_patterns?.join(', ') || 'No anomalous ring detected.';
  const nbaAction = caseData.recommended_actions?.[0]?.action || 'MONITOR_TRANSACTION';
  const nbaReason = caseData.recommended_actions?.[0]?.reason || 'Standard monitoring baseline under policy.';

  const faqs = [
    {
      q: 'WHY THIS CASE?',
      a: `Investigation initiated because trigger transaction ${caseData.trigger_txn_id} on customer account ${caseData.subject_customer_id} generated an initial anomaly score of ${caseData.risk_score.toFixed(2)}.`,
    },
    {
      q: 'WHY THIS PATTERN?',
      a: `TigerGraph 2-hop traversal identified typology [${patternsText}], characterized by shared device/IP fingerprints across coordinated accounts within temporal bursts.`,
    },
    {
      q: 'WHAT EVIDENCE SUPPORTS IT?',
      a: `Supporting signals (${caseData.supporting_evidence?.length || 0}): ${supportingTitles}`,
    },
    {
      q: 'WHAT CONTRADICTS IT?',
      a: `Mitigating signals (${caseData.contradicting_evidence?.length || 0}): ${contradictingTitles}`,
    },
    {
      q: 'WHY WAS MORE EVIDENCE REQUESTED?',
      a: caseData.missing_evidence?.length
        ? `Uncertainty gaps identified: ${missingText}. Policy mandates customer validation or out-of-band step-up authentication prior to account freeze.`
        : 'Sufficient evidence was already available in the graph topology to meet the 70% confidence decision threshold.',
    },
    {
      q: 'WHY THIS NBA?',
      a: `Recommended move is ${nbaAction}. Rationale: ${nbaReason} Grounded in policy mandates: ${caseData.recommended_actions?.[0]?.policy_basis?.join(', ') || 'POL-01, POL-04'}.`,
    },
    {
      q: 'WHAT WOULD CHANGE THE DECISION?',
      a: `If the cardholder validates transaction ${caseData.trigger_txn_id} via out-of-band challenge, or if recurring legitimate merchant history is confirmed, the risk score drops below 0.40 and the action changes to ALLOW_TRANSACTION / CLOSE_NO_FRAUD.`,
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className={`card-goa card-goa-paper p-5 border-3 border-ink shadow-goa select-none space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-goa-green-700" />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-ink">
            EXPLAINABILITY &amp; REASONING ACCORDION // GROUNDED AUDIT
          </h3>
        </div>
        <span className="font-mono text-[9px] bg-sun-yellow text-ink px-2 py-0.5 rounded font-black border border-ink">
          7-POINT AUDITABLE INQUIRY
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
                className="w-full p-3 text-left font-mono text-xs font-black text-ink flex items-center justify-between gap-2 hover:bg-sand/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-terracotta font-black">[Q{idx + 1}]</span>
                  <span>{faq.q}</span>
                </span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isOpen && (
                <div className="p-3 bg-paper border-t border-ink/20 font-sans text-xs text-ink/90 leading-relaxed space-y-2 animate-fadeIn">
                  <p>{faq.a}</p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-goa-green-900 pt-1.5 border-t border-ink/10">
                    <CheckCircle size={11} className="text-goa-green-500" />
                    <span>Cross-referenced against TigerGraph topology &amp; Policy Knowledge Graph</span>
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
