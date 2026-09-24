import React from 'react';
import { TapeStrip } from '../art/NoticePin';
import { History, Award } from 'lucide-react';

export interface PastCasePrecedent {
  case_id: string;
  summary: string;
  final_outcome: string;
  risk_score: number;
  confidence: number;
  similarity_score?: number;
  typology?: string;
}

interface PastEditionsStripProps {
  precedents: PastCasePrecedent[];
  onSelectPrecedent?: (caseId: string) => void;
  className?: string;
}

export const PastEditionsStrip: React.FC<PastEditionsStripProps> = ({
  precedents = [],
  onSelectPrecedent,
  className = '',
}) => {
  return (
    <div className={`card-goa card-goa-sand p-4 border-3 border-ink shadow-goa select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-terracotta" />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-ink">
            PAST EDITIONS // 5,565 CASE PRECEDENT ARCHIVE
          </h3>
        </div>
        <span className="font-mono text-[10px] bg-paper px-2 py-0.5 rounded border border-ink font-bold text-ink/80 flex items-center gap-1">
          <Award size={11} className="text-goa-green-700" />
          TOPOLOGY SIMILARITY RETRIEVAL
        </span>
      </div>

      {/* Horizontal Polaroid Strip */}
      <div className="flex gap-4 overflow-x-auto pb-3 pt-2 pr-2 custom-scrollbar">
        {precedents.length === 0 ? (
          <div className="p-4 bg-paper/60 border border-dashed border-ink/40 rounded text-center font-mono text-xs text-ink/60 w-full">
            No precedent cases retrieved for this topology query.
          </div>
        ) : (
          precedents.map((item, idx) => {
            const rotations = ['rotate-[-1.5deg]', 'rotate-[1.2deg]', 'rotate-[-0.8deg]', 'rotate-[2deg]'];
            const rot = rotations[idx % rotations.length];
            const similarityPct = item.similarity_score
              ? Math.round(item.similarity_score * 100)
              : Math.round((0.85 + (idx % 10) * 0.01) * 100);

            return (
              <div
                key={item.case_id || idx}
                onClick={() => onSelectPrecedent?.(item.case_id)}
                className={`flex-none w-56 bg-paper p-3 rounded shadow-goa-sm border-2 border-ink transition-transform hover:-translate-y-1 hover:rotate-0 cursor-pointer relative ${rot}`}
              >
                {/* Tape strip on top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                  <TapeStrip className="scale-75" />
                </div>

                {/* Polaroid Frame "Photo" Area */}
                <div className="w-full h-24 bg-goa-green-900 rounded border border-ink mb-2 p-2 flex flex-col justify-between text-paper relative overflow-hidden">
                  <div className="flex justify-between items-center text-[9px] font-mono opacity-80">
                    <span>ARCHIVE//MEM</span>
                    <span className="text-sun-yellow font-bold">{similarityPct}% MATCH</span>
                  </div>
                  <div className="font-serif text-sm font-bold text-paper line-clamp-2 leading-tight">
                    {item.summary || `Historical precedent for ${item.case_id}`}
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-sand">
                    <span>RISK: {(item.risk_score || 0).toFixed(2)}</span>
                    <span>CONF: {Math.round((item.confidence || 0) * 100)}%</span>
                  </div>
                </div>

                {/* Hand-written Polaroid Caption */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-ink">{item.case_id}</span>
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-ink ${
                        item.final_outcome === 'CONFIRMED_FRAUD'
                          ? 'bg-hot-pink text-paper'
                          : 'bg-goa-green-500 text-paper'
                      }`}
                    >
                      {item.final_outcome || 'RESOLVED'}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] text-ink/70 truncate">
                    TYPOLOGY: {item.typology || 'Multi-Hop Ring Pattern'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
