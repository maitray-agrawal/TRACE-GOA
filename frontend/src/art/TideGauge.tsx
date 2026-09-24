import React from 'react';

interface TideGaugeProps {
  enoughToAct: boolean;
  confidence: number;
  threshold?: number;
  missingEvidence?: string[];
  height?: number;
}

export const TideGauge: React.FC<TideGaugeProps> = ({
  enoughToAct,
  confidence,
  threshold = 0.70,
  missingEvidence = [],
  height = 140,
}) => {
  const percentage = Math.min(100, Math.max(10, Math.round(confidence * 100)));
  const thresholdPct = Math.round(threshold * 100);

  return (
    <div
      className="card-goa card-goa-sand p-3 flex flex-col justify-between select-none relative overflow-hidden"
      style={{ height, minWidth: 200 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/20 pb-1 mb-1">
        <span className="font-mono text-xs uppercase font-extrabold tracking-wider text-ink">
          Tide Gauge // Stop Rule
        </span>
        <span
          className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold border border-ink ${
            enoughToAct ? 'bg-goa-green-500 text-paper' : 'bg-sun-yellow text-ink'
          }`}
        >
          {enoughToAct ? 'ENOUGH TO ACT' : 'GATHER EVIDENCE'}
        </span>
      </div>

      {/* Visual Post & Water Level */}
      <div className="relative flex-1 bg-amber-50 rounded-sm border-2 border-ink overflow-hidden flex items-end">
        {/* Wooden depth markers */}
        <div className="absolute left-1 inset-y-0 flex flex-col justify-between text-[9px] font-mono font-bold text-ink/60 py-1 pointer-events-none z-10">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
        </div>

        {/* Enough to act threshold line */}
        <div
          className="absolute inset-x-0 border-t-2 border-dashed border-hot-pink z-10 flex items-center justify-end pr-1 pointer-events-none"
          style={{ bottom: `${thresholdPct}%` }}
        >
          <span className="bg-hot-pink text-paper text-[9px] font-mono px-1 rounded-xs font-bold leading-tight shadow-xs">
            LINE: {thresholdPct}%
          </span>
        </div>

        {/* Animated Water Fill */}
        <div
          className="w-full bg-goa-green-600 border-t-2 border-ink transition-all duration-700 relative"
          style={{ height: `${percentage}%` }}
        >
          {/* Surface Foam */}
          <div className="absolute -top-1 inset-x-0 h-2 bg-sand-light opacity-80 border-t border-ink" />
          <div className="absolute inset-x-0 bottom-1 flex justify-center text-xs font-mono font-extrabold text-sun-yellow tracking-wider drop-shadow-sm">
            TIDE LEVEL: {percentage}%
          </div>
        </div>
      </div>

      {/* Floating Missing Evidence Badges */}
      {missingEvidence.length > 0 && !enoughToAct && (
        <div className="mt-2 pt-1 border-t border-ink/20 flex flex-wrap gap-1">
          <span className="text-[10px] font-mono font-bold uppercase text-ink/70">
            Bottles in tide:
          </span>
          {missingEvidence.slice(0, 2).map((item, idx) => (
            <span
              key={idx}
              className="text-[9px] font-mono bg-paper text-ink px-1.5 py-0.5 rounded border border-ink shadow-xs"
              title={item}
            >
              🍾 {item.length > 20 ? item.slice(0, 18) + '...' : item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
