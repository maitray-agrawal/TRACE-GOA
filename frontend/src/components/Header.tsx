import React from "react";
import { Terminal, Network, ShieldCheck, Activity, SlidersHorizontal, Play } from "lucide-react";

import { fetchDiagnostics } from "../services/api";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, activeRole, setActiveRole }) => {
  const [diag, setDiag] = React.useState<any>({
    graph_engine: "SIMULATOR",
    mcp: "LOCAL_DISPATCHER",
    llm: "DETERMINISTIC_RULES",
    graphrag: "ACTIVE",
    dataset: "SYNTHETIC_DEVELOPMENT_FIXTURE"
  });

  React.useEffect(() => {
    fetchDiagnostics().then(setDiag).catch(console.error);
  }, []);

  return (
    <header className="app-header">
      <div className="brand-section">
        <div>
          <div className="brand-logo">
            TRACE<span className="cyan">//</span>GOA
          </div>
          <div className="brand-tagline">
            Trace the signal. Find the network. Make the move.
          </div>
        </div>

        <div className="tech-tags">
          <span className="tech-tag" title="Graph Engine">
            GRAPH: <strong style={{ color: diag.graph_engine === "TIGERGRAPH" ? "var(--accent-cyan)" : "#f59e0b" }}>{diag.graph_engine}</strong> ●
          </span>
          <span className="tech-tag" title="MCP Tool Layer">
            MCP: <strong style={{ color: "var(--accent-emerald)" }}>{diag.mcp}</strong> ●
          </span>
          <span className="tech-tag" title="LLM Runtime Engine">
            LLM: <strong style={{ color: diag.llm && diag.llm.includes("GEMINI") ? "var(--accent-cyan)" : "#a855f7" }}>{diag.llm}</strong> ●
          </span>
          <span className="tech-tag" title="GraphRAG Synthesis Layer">
            GRAPHRAG: <strong style={{ color: "var(--accent-emerald)" }}>{diag.graphrag}</strong> ●
          </span>
          <span className="tech-tag" title="Dataset Ingestion Baseline">
            DATA: <strong style={{ color: diag.dataset === "HHGOA_IEEE" ? "var(--accent-cyan)" : "#eab308" }}>{diag.dataset === "HHGOA_IEEE" ? "HHGOA" : "DEV_FIXTURE"}</strong> ●
          </span>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <Activity size={13} /> COMMAND
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "investigation" ? "active" : ""}`}
          onClick={() => setActiveTab("investigation")}
        >
          <Terminal size={13} /> TRACE
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "graph" ? "active" : ""}`}
          onClick={() => setActiveTab("graph")}
        >
          <Network size={13} /> NETWORK
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          <ShieldCheck size={13} /> LEDGER
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "clearance" ? "active" : ""}`}
          onClick={() => setActiveTab("clearance")}
        >
          <SlidersHorizontal size={13} /> CLEARANCE
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "demo" ? "active" : ""}`}
          onClick={() => setActiveTab("demo")}
          style={{ borderColor: activeTab === "demo" ? "var(--accent-cyan)" : "rgba(0, 242, 254, 0.4)" }}
        >
          <Play size={13} color="var(--accent-cyan)" /> TRIALS // DEMO
        </button>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="tech-tag" style={{ border: "none", color: "var(--text-muted)" }}>
          ROLE:
        </span>
        <select
          value={activeRole}
          onChange={(e) => setActiveRole(e.target.value)}
          className="font-mono"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--accent-cyan)",
            border: "1px solid var(--border-color)",
            padding: "4px 8px",
            borderRadius: 0,
            fontSize: "0.75rem",
            fontWeight: 700
          }}
        >
          <option value="ANALYST">ANALYST [L1]</option>
          <option value="SENIOR_ANALYST">SENIOR ANALYST [L2]</option>
          <option value="FRAUD_MANAGER">FRAUD MANAGER [L3]</option>
        </select>

        <span className="status-indicator active">
          <span style={{ width: 6, height: 6, background: "var(--accent-emerald)", display: "inline-block" }}></span>
          ONLINE
        </span>
      </div>
    </header>
  );
};
