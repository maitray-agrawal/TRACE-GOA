import React, { useState, useEffect } from 'react';

interface SignpostStatsProps {
  stats?: {
    benchmarkCases?: number;
    fraudCases?: number;
    memoryCases?: number;
    accuracy?: number;
    majorityBaseline?: number;
    totalTransactions?: number;
  };
  className?: string;
}

export const SignpostStats: React.FC<SignpostStatsProps> = ({
  stats = {
    benchmarkCases: 20,
    fraudCases: 13,
    memoryCases: 5565,
    accuracy: 87.24,
    majorityBaseline: 83.65,
    totalTransactions: 590742,
  },
  className = '',
}) => {
  // Count-up animation state
  const [counts, setCounts] = useState({
    cases: 0,
    fraud: 0,
    memory: 0,
    acc: 0,
    base: 0,
  });

  useEffect(() => {
    const duration = 1000;
    const steps = 25;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts({
        cases: Math.round(ease * (stats.benchmarkCases ?? 20)),
        fraud: Math.round(ease * (stats.fraudCases ?? 13)),
        memory: Math.round(ease * (stats.memoryCases ?? 5565)),
        acc: Number((ease * (stats.accuracy ?? 87.24)).toFixed(2)),
        base: Number((ease * (stats.majorityBaseline ?? 83.65)).toFixed(2)),
      });

      if (step >= steps) clearInterval(timer);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [stats]);

  const lift = (counts.acc - counts.base).toFixed(2);

  return (
    <div className={`w-full py-6 select-none ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-0.5 flex-1 bg-ink/30" />
          <span className="font-mono text-xs font-black uppercase tracking-widest px-3 py-1 rounded border-2 border-ink bg-sun-yellow text-ink shadow-goa-sm">
            BENCHMARK TELEMETRY &amp; EVALUATION SIGNPOST
          </span>
          <div className="h-0.5 flex-1 bg-ink/30" />
        </div>

        {/* Signpost Boards Row */}
        <div className="signpost-grid">
          {/* Board 1: Benchmark Cases */}
          <div className="card-goa card-goa-sand p-4 border-3 border-ink rounded-lg shadow-goa-sm relative group hover:-translate-y-1 transition-transform">
            <div className="absolute top-2 right-2 text-xs font-mono font-black text-ink/40">
              [01]
            </div>
            <div className="font-display text-4xl sm:text-5xl font-black text-ink mb-1">
              {counts.cases}
            </div>
            <div className="font-mono text-xs uppercase font-black text-ink tracking-wider">
              BENCHMARK CASES
            </div>
            <div className="text-[11px] font-mono text-ink/70 mt-1">
              HHG-001 to HHG-020 (Recorded Suite)
            </div>
          </div>

          {/* Board 2: Fraud Detections */}
          <div className="card-goa bg-hot-pink text-paper p-4 border-3 border-ink rounded-lg shadow-goa-sm relative group hover:-translate-y-1 transition-transform">
            <div className="absolute top-2 right-2 text-xs font-mono font-black text-paper/60">
              [02]
            </div>
            <div className="font-display text-4xl sm:text-5xl font-black text-sun-yellow drop-shadow-sm mb-1">
              {counts.fraud}
            </div>
            <div className="font-mono text-xs uppercase font-black text-paper tracking-wider">
              CONFIRMED FRAUD CASES
            </div>
            <div className="text-[11px] font-mono text-paper/90 mt-1">
              Cross-card rings &amp; structuring bursts
            </div>
          </div>

          {/* Board 3: Memory Corpus */}
          <div className="card-goa bg-goa-green-700 text-paper p-4 border-3 border-ink rounded-lg shadow-goa-sm relative group hover:-translate-y-1 transition-transform">
            <div className="absolute top-2 right-2 text-xs font-mono font-black text-paper/40">
              [03]
            </div>
            <div className="font-display text-4xl sm:text-5xl font-black text-goa-green-200 mb-1">
              {counts.memory.toLocaleString()}
            </div>
            <div className="font-mono text-xs uppercase font-black text-paper tracking-wider">
              HISTORICAL PRECEDENTS
            </div>
            <div className="text-[11px] font-mono text-goa-green-200/90 mt-1">
              Case Memory Corpus (Historical DB)
            </div>
          </div>

          {/* Board 4: Decision Accuracy vs Majority Baseline */}
          <div className="card-goa bg-sun-yellow text-ink p-4 border-3 border-ink rounded-lg shadow-goa-sm relative group hover:-translate-y-1 transition-transform">
            <div className="absolute top-2 right-2 text-xs font-mono font-black text-ink/40">
              [04]
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-4xl sm:text-5xl font-black text-ink">
                {counts.acc}%
              </span>
              <span className="font-mono text-xs font-black text-terracotta bg-paper px-1.5 py-0.5 rounded border border-ink">
                +{lift} pp
              </span>
            </div>
            <div className="font-mono text-xs uppercase font-black text-ink tracking-wider">
              BACKTEST ACCURACY
            </div>
            <div className="text-[10px] font-mono text-ink/80 mt-1 flex items-center justify-between border-t border-ink/20 pt-1">
              <span>MAJORITY BASELINE:</span>
              <strong>{counts.base}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
