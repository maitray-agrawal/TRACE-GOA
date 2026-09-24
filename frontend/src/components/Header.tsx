import React from "react";
import { Terminal, Network, ShieldCheck, Activity, SlidersHorizontal, Play } from "lucide-react";
import { fetchDiagnostics } from "../services/api";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole,
}) => {
  const [diag, setDiag] = React.useState<any>({
    graph_engine: "SIMULATOR",
    mcp: "LOCAL_DISPATCHER",
    llm: "GEMINI (gemini-2.5-flash)",
    graphrag: "ACTIVE",
    dataset: "HHGOA_IEEE",
  });

  React.useEffect(() => {
    fetchDiagnostics().then(setDiag).catch(console.error);
  }, []);

  const isTigerGraph = diag.graph_engine === "TIGERGRAPH";
  const isGemini = diag.llm && diag.llm.includes("GEMINI");

  return (
    <header className="w-full bg-goa-green-900 border-b-4 border-ink px-4 py-3 select-none sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab("dashboard")}
            className="cursor-pointer group flex items-center gap-2"
          >
            <span className="font-wordmark text-2xl sm:text-3xl text-sun-yellow tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform">
              TRACE<span className="text-hot-pink">//</span>GOA
            </span>
          </div>

          <span className="hidden lg:inline text-xs font-mono font-bold text-goa-green-200 border-l-2 border-ink pl-3 uppercase">
            Hacker House Goa &apos;26
          </span>
        </div>

        {/* Center: Live Backend Diagnostics Badges (Strict Honesty) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono font-bold">
          <span
            className={`px-2 py-0.5 rounded border border-ink shadow-2xs ${
              isTigerGraph ? "bg-goa-green-500 text-paper" : "bg-sun-yellow text-ink"
            }`}
            title="Graph backend in use: TIGERGRAPH LIVE or IN-MEMORY SIMULATOR"
          >
            GRAPH: <strong>{diag.graph_engine}</strong>
          </span>

          <span
            className="px-2 py-0.5 rounded border border-ink bg-paper text-ink shadow-2xs"
            title="MCP Tool Dispatcher layer"
          >
            MCP: <strong>{diag.mcp}</strong>
          </span>

          <span
            className={`px-2 py-0.5 rounded border border-ink shadow-2xs ${
              isGemini ? "bg-hot-pink text-paper" : "bg-paper text-ink"
            }`}
            title="Active LLM Provider"
          >
            LLM: <strong>{diag.llm}</strong>
          </span>

          <span
            className="px-2 py-0.5 rounded border border-ink bg-sand text-ink shadow-2xs hidden xl:inline"
            title="Dataset source"
          >
            DATA: <strong>{diag.dataset === "HHGOA_IEEE" ? "HHGOA 590K" : "SYNTHETIC"}</strong>
          </span>
        </div>

        {/* Right: Nav Tabs & Role Selector */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <nav className="flex items-center gap-1 bg-goa-green-700 p-1 rounded-md border-2 border-ink shadow-xs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 ${
                activeTab === "dashboard"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <Activity size={12} /> COMMAND
            </button>

            <button
              onClick={() => setActiveTab("investigation")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 ${
                activeTab === "investigation"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <Terminal size={12} /> TRACE
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 ${
                activeTab === "graph"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <Network size={12} /> NETWORK
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 ${
                activeTab === "ledger"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <ShieldCheck size={12} /> LEDGER
            </button>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 ${
                activeTab === "clearance"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <SlidersHorizontal size={12} /> CLEARANCE
            </button>

            <button
              onClick={() => setActiveTab("demo")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 ${
                activeTab === "demo"
                  ? "bg-hot-pink text-paper border border-ink shadow-xs animate-pulse"
                  : "bg-terracotta text-paper hover:bg-hot-pink border border-ink"
              }`}
              title="Automated Case Walkthrough Demo (Shortcut: D)"
            >
              <Play size={11} fill="currentColor" /> DEMO [D]
            </button>
          </nav>

          {/* RBAC Role Selector Dropdown */}
          <div className="flex items-center gap-1 bg-sand border-2 border-ink rounded-md px-2 py-0.5 shadow-xs">
            <span className="text-[10px] font-mono font-black text-ink/70 uppercase">ROLE:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="bg-transparent text-ink font-mono text-xs font-bold border-none outline-none cursor-pointer"
            >
              <option value="ANALYST">ANALYST [L1]</option>
              <option value="SENIOR_ANALYST">SENIOR ANALYST [L2]</option>
              <option value="FRAUD_MANAGER">FRAUD MANAGER [L3]</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
