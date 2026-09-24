import React from "react";
import type { TimelineStep } from "../types";

interface TimelineViewerProps {
  timeline: TimelineStep[];
  className?: string;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ timeline, className = "" }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="card-goa card-goa-sand p-6 text-center font-mono text-xs text-ink/70 border-2 border-ink">
        <div className="text-2xl mb-1">🧭</div>
        <div className="font-bold uppercase tracking-wider">ROADMAP TIMELINE IDLE</div>
        <div className="text-[11px] opacity-80 mt-1">
          Initiate case trace to observe autonomous MCP tool dispatch and agent reasoning.
        </div>
      </div>
    );
  }

  return (
    <div className={`card-goa card-goa-sand p-4 border-3 border-ink rounded-xl shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded bg-ink text-sun-yellow">
            THE TIMELINE AT A GLANCE
          </span>
          <span className="font-mono text-[11px] text-ink/80 font-bold hidden sm:inline">
            AGENT EXECUTION ROADMAP
          </span>
        </div>
        <span className="font-mono text-xs font-black text-ink bg-paper px-2 py-0.5 rounded border border-ink shadow-2xs">
          {timeline.length} STEPS
        </span>
      </div>

      {/* Vertical Timeline Stepper */}
      <div className="relative pl-6 space-y-4 max-h-[380px] overflow-y-auto pr-2">
        {/* Continuous Bamboo Vertical Track Line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-1 bg-amber-300 border-x border-ink rounded-full" />

        {timeline.map((step, idx) => {
          const isLast = idx === timeline.length - 1;
          const stepNum = String(idx + 1).padStart(2, "0");

          return (
            <div key={idx} className="relative group">
              {/* Step Node Marker on Bamboo Line */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-ink flex items-center justify-center font-mono text-[10px] font-black shadow-xs z-10 transition-transform group-hover:scale-125 ${
                  isLast
                    ? "bg-sun-yellow text-ink ring-2 ring-hot-pink animate-pulse"
                    : "bg-paper text-ink"
                }`}
              >
                {stepNum}
              </div>

              {/* Step Content Card */}
              <div className="bg-paper p-3 rounded-lg border-2 border-ink shadow-xs transition-transform hover:-translate-y-0.5">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1 border-b border-ink/10 pb-1">
                  <span className="font-mono text-xs font-extrabold text-ink uppercase tracking-wide">
                    {step.step_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-ink/60 bg-sand-light px-1.5 py-0.2 rounded border border-ink/20">
                      {step.time_str}
                    </span>
                    {step.latency_ms && (
                      <span className="bg-goa-green-100 text-goa-green-900 font-bold px-1.5 py-0.2 rounded border border-goa-green-500/40">
                        {step.latency_ms}ms
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Narrative */}
                <p className="font-mono text-xs text-ink/90 leading-relaxed">
                  {step.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
