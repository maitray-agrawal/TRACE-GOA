import React from "react";
import type { TimelineStep } from "../types";
import { Clock, ArrowRightCircle } from "lucide-react";

interface TimelineViewerProps {
  timeline: TimelineStep[];
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "10px" }}>
        No timeline events recorded yet. Run investigation to observe agent activity.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
      {timeline.map((step, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            fontSize: "0.78rem",
            padding: "6px 8px",
            borderRadius: "4px",
            background: "rgba(0, 0, 0, 0.25)",
            borderLeft: "2px solid var(--accent-cyan)"
          }}
        >
          <div style={{ minWidth: "55px", color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={10} />
            {step.time_str}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 5 }}>
              <ArrowRightCircle size={11} /> {step.step_name}
            </div>
            <div style={{ color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.3 }}>
              {step.details}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
