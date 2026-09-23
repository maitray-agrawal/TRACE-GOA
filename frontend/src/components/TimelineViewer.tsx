import React from "react";
import type { TimelineStep } from "../types";

interface TimelineViewerProps {
  timeline: TimelineStep[];
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="font-mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "10px" }}>
        // AGENT LOG IDLE. INITIATE TRACE TO OBSERVE ACTIVITY.
      </div>
    );
  }

  return (
    <div
      className="font-mono"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        maxHeight: "190px",
        overflowY: "auto",
        background: "var(--bg-primary)",
        padding: "8px 10px",
        border: "1px solid var(--border-subtle)"
      }}
    >
      {timeline.map((step, idx) => {
        const stepNum = String(idx + 1).padStart(2, "0");
        return (
          <div
            key={idx}
            style={{
              fontSize: "0.72rem",
              lineHeight: 1.4,
              display: "flex",
              alignItems: "flex-start",
              gap: "8px"
            }}
          >
            <span style={{ color: "var(--text-muted)", minWidth: "55px" }}>[{step.time_str}]</span>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>[{stepNum}]</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{step.step_name}:</span>
            <span style={{ color: "var(--text-secondary)", flex: 1 }}>{step.details}</span>
          </div>
        );
      })}
    </div>
  );
};
