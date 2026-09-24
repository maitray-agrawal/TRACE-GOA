import React from 'react';
import { Sun } from '../art/Sun';
import { TideGauge } from '../art/TideGauge';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

interface SunTideGaugeProps {
  confidence: number;
  riskScore: number;
  enoughToAct?: boolean;
  missingEvidence?: string[];
  isInvestigating?: boolean;
}

export const SunTideGauge: React.FC<SunTideGaugeProps> = ({
  confidence = 0.84,
  riskScore = 0.78,
  enoughToAct = true,
  missingEvidence = [],
  isInvestigating = false,
}) => {
  const riskPct = Math.round(riskScore * 100);
  const confPct = Math.round(confidence * 100);
  const thresholdPct = 70;

  let conditionText = 'CALM TIDE // LOW FRICTION';
  let conditionBg = 'bg-goa-green-500';
  let conditionTextColor = 'text-paper';

  if (riskScore >= 0.75) {
    conditionText = 'STORM SURGE // CONFIRMED ANOMALY';
    conditionBg = 'bg-hot-pink';
    conditionTextColor = 'text-paper';
  } else if (riskScore >= 0.40) {
    conditionText = 'HIGH SURF // ELEVATED FRICTION';
    conditionBg = 'bg-sun-yellow';
    conditionTextColor = 'text-ink';
  }

  return (
    <div className="card-goa card-goa-paper p-5 border-3 border-ink shadow-goa select-none space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase font-black tracking-wider text-ink">
            RISK, CONFIDENCE &amp; UNCERTAINTY STOP-RULE // GAUGE RADAR
          </span>
          {isInvestigating && (
            <span className="animate-spin text-xs" title="Tracking realtime graph signals">
              ⚙
            </span>
          )}
        </div>
        <span
          className={`font-mono text-[10px] px-2.5 py-0.5 rounded font-black border-2 border-ink uppercase ${conditionBg} ${conditionTextColor}`}
        >
          {conditionText}
        </span>
      </div>

      {/* Primary Numerical Metrics Ribbon (Numbers First, Metaphor Second) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Risk Card */}
        <div className="p-3 bg-paper rounded-lg border-2 border-ink text-center shadow-xs">
          <span className="text-[10px] font-mono font-black text-ink/60 uppercase block">
            CALCULATED RISK
          </span>
          <div className="font-display text-3xl font-black text-terracotta">
            {riskPct}%
          </div>
          <span className="text-[9px] font-mono font-bold text-ink/70">
            {riskPct >= 75 ? 'HIGH RISK' : riskPct >= 40 ? 'MEDIUM RISK' : 'LOW RISK'}
          </span>
        </div>

        {/* Confidence Card */}
        <div className="p-3 bg-paper rounded-lg border-2 border-ink text-center shadow-xs">
          <span className="text-[10px] font-mono font-black text-ink/60 uppercase block">
            EVIDENCE CONFIDENCE
          </span>
          <div className="font-display text-3xl font-black text-goa-green-700">
            {confPct}%
          </div>
          <span className="text-[9px] font-mono font-bold text-ink/70">
            {confPct >= thresholdPct ? '>= CUTOFF LINE' : '< CUTOFF LINE'}
          </span>
        </div>

        {/* Action Threshold */}
        <div className="p-3 bg-paper rounded-lg border-2 border-ink text-center shadow-xs">
          <span className="text-[10px] font-mono font-black text-ink/60 uppercase block">
            DECISION THRESHOLD
          </span>
          <div className="font-display text-3xl font-black text-ink">
            {thresholdPct}%
          </div>
          <span className="text-[9px] font-mono font-bold text-ink/70">
            POLICY STOP-RULE
          </span>
        </div>

        {/* Action Gate Verdict */}
        <div
          className={`p-3 rounded-lg border-2 border-ink text-center shadow-xs flex flex-col justify-center ${
            enoughToAct ? 'bg-goa-green-200 text-goa-green-900' : 'bg-sun-yellow text-ink'
          }`}
        >
          <span className="text-[10px] font-mono font-black uppercase block opacity-80">
            DECISION GATE
          </span>
          <div className="font-mono text-sm font-black flex items-center justify-center gap-1 my-1">
            {enoughToAct ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
            <span>{enoughToAct ? 'ENOUGH TO ACT' : 'MORE EVIDENCE'}</span>
          </div>
          <span className="text-[9px] font-mono font-bold">
            {enoughToAct ? 'Proceed with NBA' : 'Step-Up Required'}
          </span>
        </div>
      </div>

      {/* Visual Metaphor: Sun Elevation + Tide Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
        {/* Sun Zenith Angle */}
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-sand/30 border-2 border-ink relative overflow-hidden">
          <div className="absolute top-1 left-2 font-mono text-[9px] font-black text-ink/60 uppercase">
            Confidence Zenith (Sun Elevation: {Math.round(confidence * 90)}°)
          </div>
          <div className={`transition-transform duration-700 ${isInvestigating ? 'animate-pulse' : ''}`}>
            <Sun confidence={confidence} riskScore={riskScore} size={110} />
          </div>
          <div className="flex items-center justify-between w-full mt-2 px-1 font-mono text-[10px] font-extrabold border-t border-ink/20 pt-1 text-ink">
            <span>SUN ZENITH: {Math.round(confidence * 90)}°</span>
            <span className="text-terracotta">HALO RADIUS: {riskScore.toFixed(2)}</span>
          </div>
        </div>

        {/* Tide Water Gauge */}
        <div className="h-full flex flex-col justify-center">
          <TideGauge
            enoughToAct={enoughToAct}
            confidence={confidence}
            threshold={0.70}
            missingEvidence={missingEvidence}
            height={140}
          />
        </div>
      </div>

      {/* Uncertainty Loop Progression Strip */}
      <div className="p-3 bg-sand/40 rounded-xl border-2 border-ink space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-ink/70">
          <span className="font-black uppercase text-ink">AGENT UNCERTAINTY LOOP TRANSITION:</span>
          <span>Policy Rule R1 / R2 / R3</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-ink">
          <span className="px-2 py-0.5 bg-paper rounded border border-ink font-bold">
            01 NAIVE ALERT ({confPct < 70 ? `${confPct}%` : '61%'})
          </span>
          <ArrowRight size={10} className="text-ink/60" />
          <span className="px-2 py-0.5 bg-sun-yellow rounded border border-ink font-bold">
            02 STEP-UP / OWNER VALIDATION
          </span>
          <ArrowRight size={10} className="text-ink/60" />
          <span className="px-2 py-0.5 bg-paper rounded border border-ink font-bold">
            03 NEW EVIDENCE INGESTED
          </span>
          <ArrowRight size={10} className="text-ink/60" />
          <span className="px-2 py-0.5 bg-goa-green-500 text-paper rounded border border-ink font-black">
            04 REASSESSMENT ({confPct >= 70 ? `${confPct}%` : '84%'} &gt;= 70%) ➔ NBA
          </span>
        </div>
      </div>
    </div>
  );
};
