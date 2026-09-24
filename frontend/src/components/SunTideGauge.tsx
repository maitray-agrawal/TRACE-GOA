import React from 'react';
import { Sun } from '../art/Sun';
import { TideGauge } from '../art/TideGauge';

interface SunTideGaugeProps {
  confidence: number;
  riskScore: number;
  enoughToAct?: boolean;
  missingEvidence?: string[];
  isInvestigating?: boolean;
}

export const SunTideGauge: React.FC<SunTideGaugeProps> = ({
  confidence = 0.85,
  riskScore = 0.72,
  enoughToAct = true,
  missingEvidence = [],
  isInvestigating = false,
}) => {
  // Determine coastal condition status
  let conditionText = 'CALM TIDE // BENIGN FLOW';
  let conditionBg = 'bg-goa-green-500';
  let conditionTextColor = 'text-paper';

  if (riskScore >= 0.75) {
    conditionText = 'STORM SURGE // CRITICAL ANOMALY';
    conditionBg = 'bg-hot-pink';
    conditionTextColor = 'text-paper';
  } else if (riskScore >= 0.40) {
    conditionText = 'HIGH SURF // FRICTION DETECTED';
    conditionBg = 'bg-sun-yellow';
    conditionTextColor = 'text-ink';
  }

  const elevationDeg = Math.round(confidence * 90);

  return (
    <div className="card-goa card-goa-paper p-4 relative overflow-hidden select-none border-3 border-ink shadow-goa">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase font-extrabold tracking-wider text-ink">
            ☀ TIDE & ZENITH GAUGE // STOP-RULE RADAR
          </span>
          {isInvestigating && (
            <span className="animate-spin text-xs" title="Tracking realtime graph signals">
              ⚙
            </span>
          )}
        </div>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded font-black border-2 border-ink uppercase ${conditionBg} ${conditionTextColor}`}
        >
          {conditionText}
        </span>
      </div>

      {/* Main visual side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Sun Zenith Display */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-sand/30 border-2 border-ink relative overflow-hidden">
          <div className="absolute top-1 left-2 font-mono text-[9px] font-bold text-ink/70 uppercase">
            Confidence Zenith
          </div>
          <div className={`transition-transform duration-1000 ${isInvestigating ? 'animate-pulse' : ''}`}>
            <Sun confidence={confidence} riskScore={riskScore} size={110} />
          </div>
          <div className="flex items-center justify-between w-full mt-1 px-1 font-mono text-[10px] font-extrabold border-t border-ink/20 pt-1 text-ink">
            <span>ELEVATION: {elevationDeg}°</span>
            <span>CONF: {Math.round(confidence * 100)}%</span>
          </div>
        </div>

        {/* Tide Water Gauge */}
        <div className="h-full flex flex-col justify-center">
          <TideGauge
            enoughToAct={enoughToAct}
            confidence={confidence}
            threshold={0.70}
            missingEvidence={missingEvidence}
            height={135}
          />
        </div>
      </div>

      {/* Footer guideline */}
      <div className="mt-2.5 pt-2 border-t border-ink/20 flex items-center justify-between font-mono text-[9px] text-ink/70">
        <span>STOP RULE: 70% THRESHOLD CUTOFF</span>
        <span className="font-bold text-ink">
          {enoughToAct ? '✓ SUFFICIENT EVIDENCE TO PROCEED' : '⚠ STEP-UP CHALLENGE REQUIRED'}
        </span>
      </div>
    </div>
  );
};
