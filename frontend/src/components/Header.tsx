import React from "react";
import { ShieldAlert, Network, Terminal, FileCheck, PlayCircle, BarChart3 } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, activeRole, setActiveRole }) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <ShieldAlert size={26} color="#06b6d4" />
        <div>
          <h1 className="brand-title">TIGERGRAPH FRAUD INVESTIGATION COMMAND CENTER</h1>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Autonomous GraphRAG & Next-Best Action Engine — HHGOA
          </span>
        </div>
        <div style={{ marginLeft: "16px" }}>
          <span className="status-badge active">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            TigerGraph Dual-Engine Active
          </span>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <BarChart3 size={15} /> Dashboard & Queue
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "investigation" ? "active" : ""}`}
          onClick={() => setActiveTab("investigation")}
        >
          <Terminal size={15} /> Active Investigation
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "graph" ? "active" : ""}`}
          onClick={() => setActiveTab("graph")}
        >
          <Network size={15} /> Graph Explorer
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          <FileCheck size={15} /> Decision Ledger
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "demo" ? "active" : ""}`}
          onClick={() => setActiveTab("demo")}
          style={{ borderColor: activeTab === "demo" ? "var(--accent-cyan)" : "rgba(6, 182, 212, 0.4)" }}
        >
          <PlayCircle size={15} color="#06b6d4" /> Live Demo Mode
        </button>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Analyst Role:</span>
        <select
          value={activeRole}
          onChange={(e) => setActiveRole(e.target.value)}
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            padding: "5px 10px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 600
          }}
        >
          <option value="ANALYST">Analyst (Tier 1)</option>
          <option value="SENIOR_ANALYST">Senior Analyst (Tier 2)</option>
          <option value="FRAUD_MANAGER">Fraud Manager (Tier 3)</option>
        </select>
      </div>
    </header>
  );
};
