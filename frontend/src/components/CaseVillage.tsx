import React, { useState } from 'react';
import { BeachShack } from '../art/BeachShack';
import { SurfboardChip } from '../art/SurfboardChip';
import { Search } from 'lucide-react';

export interface CaseVillageItem {
  case_id: string;
  verdict: 'fraud' | 'uncertain' | 'legitimate' | string;
  fraud_probability: number;
  pattern: string;
  exposure_usd: number;
  trigger_type?: string;
  sar_file?: boolean;
  tool_calls?: number;
  tokens?: number;
  primary_action?: string;
}

interface CaseVillageProps {
  cases: CaseVillageItem[];
  selectedCaseId?: string;
  onSelectCase: (caseId: string) => void;
  className?: string;
}

export const CaseVillage: React.FC<CaseVillageProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  className = '',
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FRAUD' | 'UNCERTAIN' | 'LEGITIMATE' | 'SAR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter calculations
  const totalCount = cases.length;
  const fraudCount = cases.filter((c) => c.verdict === 'fraud').length;
  const uncertainCount = cases.filter((c) => c.verdict === 'uncertain').length;
  const legitCount = cases.filter((c) => c.verdict === 'legitimate').length;
  const sarCount = cases.filter((c) => c.sar_file).length;

  const filteredCases = cases.filter((c) => {
    // Filter chip logic
    if (filter === 'FRAUD' && c.verdict !== 'fraud') return false;
    if (filter === 'UNCERTAIN' && c.verdict !== 'uncertain') return false;
    if (filter === 'LEGITIMATE' && c.verdict !== 'legitimate') return false;
    if (filter === 'SAR' && !c.sar_file) return false;

    // Search query logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.case_id.toLowerCase().includes(q) ||
        c.pattern.toLowerCase().includes(q) ||
        (c.trigger_type && c.trigger_type.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <section className={`w-full py-8 select-none ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border-2 border-ink bg-sand text-ink text-xs font-mono font-black uppercase tracking-widest mb-1 shadow-xs">
              BEACH-SHACK VILLAGE // 20 BENCHMARK CASUALTIES
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-sun-yellow tracking-tight uppercase drop-shadow-xs">
              Investigative Exam Roster
            </h2>
            <p className="font-mono text-xs text-goa-green-200 uppercase mt-0.5">
              Shutter color indicates agent verdict: Pink = Fraud · Yellow = Uncertain · Green = Cleared
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="SEARCH CASE ID / PATTERN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-paper text-ink font-mono text-xs uppercase px-3 py-2 pl-8 rounded border-2 border-ink shadow-xs outline-none focus:bg-amber-50 placeholder:text-ink/40"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-ink/60" />
          </div>
        </div>

        {/* Surfboard Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b-2 border-ink/30 pb-4">
          <SurfboardChip
            label="ALL CASES"
            count={totalCount}
            isActive={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            color="sand"
          />
          <SurfboardChip
            label="CONFIRMED FRAUD"
            count={fraudCount}
            isActive={filter === 'FRAUD'}
            onClick={() => setFilter('FRAUD')}
            color="pink"
          />
          <SurfboardChip
            label="UNCERTAIN / GATHER"
            count={uncertainCount}
            isActive={filter === 'UNCERTAIN'}
            onClick={() => setFilter('UNCERTAIN')}
            color="yellow"
          />
          <SurfboardChip
            label="LEGITIMATE / CLEAR"
            count={legitCount}
            isActive={filter === 'LEGITIMATE'}
            onClick={() => setFilter('LEGITIMATE')}
            color="green"
          />
          <SurfboardChip
            label="REGULATORY SAR"
            count={sarCount}
            isActive={filter === 'SAR'}
            onClick={() => setFilter('SAR')}
            color="pink"
          />
        </div>

        {/* 20 Beach-Shack Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCases.map((item) => {
            const isSelected = item.case_id === selectedCaseId;

            return (
              <div
                key={item.case_id}
                onClick={() => onSelectCase(item.case_id)}
                className={`card-goa p-4 rounded-xl border-3 border-ink cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-amber-100 ring-4 ring-sun-yellow shadow-lg scale-102 -translate-y-1'
                    : 'bg-goa-green-700 hover:bg-goa-green-600 hover:-translate-y-1'
                }`}
              >
                {/* Top Badge: Case ID + Verdict tag */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded border border-ink shadow-2xs ${
                      isSelected ? 'bg-ink text-sun-yellow' : 'bg-paper text-ink'
                    }`}
                  >
                    {item.case_id}
                  </span>

                  {item.sar_file && (
                    <span className="text-[10px] font-mono font-black bg-terracotta text-paper px-1.5 py-0.2 rounded border border-ink uppercase">
                      SAR
                    </span>
                  )}
                </div>

                {/* Beach Shack Vector Art */}
                <div className="my-2 flex justify-center py-1">
                  <BeachShack verdict={item.verdict} isSelected={isSelected} size={72} />
                </div>

                {/* Case Metadata Details */}
                <div className={`mt-2 pt-2 border-t border-ink/20 ${isSelected ? 'text-ink' : 'text-paper'}`}>
                  {/* Pattern Name */}
                  <div className="text-[11px] font-mono font-bold truncate uppercase" title={item.pattern}>
                    {item.pattern.replace(/_/g, ' ')}
                  </div>

                  {/* Exposure & Risk */}
                  <div className="flex items-center justify-between text-[11px] font-mono mt-1 opacity-90">
                    <span>
                      {item.exposure_usd > 0 ? `$${item.exposure_usd.toFixed(2)}` : '$0.00'}
                    </span>
                    <span className="font-extrabold">
                      {Math.round(item.fraud_probability * 100)}% RISK
                    </span>
                  </div>

                  {/* Action Pill */}
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border border-ink uppercase truncate ${
                        item.verdict === 'fraud'
                          ? 'bg-hot-pink text-paper'
                          : item.verdict === 'legitimate'
                          ? 'bg-goa-green-500 text-paper'
                          : 'bg-sun-yellow text-ink'
                      }`}
                    >
                      {item.primary_action ||
                        (item.verdict === 'fraud'
                          ? 'BLOCK_CARD'
                          : item.verdict === 'legitimate'
                          ? 'ALLOW_TXN'
                          : 'MONITOR')}
                    </span>

                    {typeof item.tool_calls === 'number' && (
                      <span className="text-[9px] font-mono opacity-70">
                        {item.tool_calls} tools
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
