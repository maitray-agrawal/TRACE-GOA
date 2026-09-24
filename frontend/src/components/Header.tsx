import React from "react";
import { Terminal, Network, ShieldCheck, Activity, SlidersHorizontal, Play, ExternalLink, Video } from "lucide-react";
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

  const isOfficialMcp = diag.mcp === "OFFICIAL" || diag.mcp === "OFFICIAL_TIGERGRAPH_MCP";
  const isRealData = Boolean(diag.dataset && (diag.dataset.includes("HHGOA_IEEE") || diag.dataset_rows > 1000));

  return (
    <header className="header-bar w-full select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col gap-2">
        {/* Main Header Bar: Wordmark Left | Tab Nav Center | Role Select Right */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 min-h-[48px]">
          {/* Left: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab("dashboard")}
              className="cursor-pointer group flex items-center gap-2"
            >
              <span className="font-wordmark text-2xl sm:text-3xl text-sun-yellow tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform">
                TRACE<span className="text-hot-pink">//</span>GOA
              </span>
            </div>
            <span className="hidden lg:inline text-[11px] font-mono font-bold text-goa-green-200 border-l-2 border-ink pl-3 uppercase">
              Hacker House Goa &apos;26
            </span>
          </div>

          {/* Center: Primary Tab Navigation */}
          <nav className="flex items-center gap-1 bg-goa-green-700 p-1 rounded-md border-2 border-ink shadow-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "dashboard"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <Activity size={12} /> COMMAND
            </button>

            <button
              onClick={() => setActiveTab("investigation")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "investigation"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <Terminal size={12} /> TRACE
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "graph"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <Network size={12} /> NETWORK
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "ledger"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <ShieldCheck size={12} /> LEDGER
            </button>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "clearance"
                  ? "bg-sun-yellow text-ink border border-ink shadow-xs"
                  : "text-goa-green-100 hover:text-paper"
              }`}
            >
              <SlidersHorizontal size={12} /> CLEARANCE
            </button>

            <button
              onClick={() => setActiveTab("demo")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "demo"
                  ? "bg-hot-pink text-paper border border-ink shadow-xs animate-pulse"
                  : "bg-terracotta text-paper hover:bg-hot-pink border border-ink"
              }`}
              title="Automated Case Walkthrough Demo (Shortcut: D)"
            >
              <Play size={11} fill="currentColor" /> DEMO [D]
            </button>
          </nav>

          {/* Right: Public Links & RBAC Role Selector Dropdown */}
          <div className="flex items-center gap-2">
            <a
              href="https://youtu.be/ZbGbMlKf6bQ"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 bg-terracotta hover:bg-hot-pink text-paper text-[10px] font-mono font-black uppercase px-2 py-1 rounded border-2 border-ink shadow-xs transition-colors"
              title="Watch 3-minute Video Demo on YouTube"
            >
              <Video size={11} /> VIDEO DEMO <ExternalLink size={9} />
            </a>

            <a
              href="https://tracegoa.hashnode.dev/trace-goa"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 bg-sea-blue hover:bg-goa-green-500 text-paper text-[10px] font-mono font-black uppercase px-2 py-1 rounded border-2 border-ink shadow-xs transition-colors"
              title="Read Technical Deep-Dive on Hashnode"
            >
              BLOG <ExternalLink size={9} />
            </a>

            <div className="flex items-center gap-1 bg-sand border-2 border-ink rounded-md px-2.5 py-1 shadow-xs shrink-0">
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

        {/* Sub-Bar: Status Badges in a Wrapping Row with Gaps (Strict Honesty & Green/Yellow Coding) */}
        <div className="status-pills-row justify-center md:justify-start pt-1 border-t border-goa-green-700/50">
          <span
            className={`pill-mono text-[11px] font-mono font-black px-2.5 py-0.5 rounded border border-ink shadow-2xs ${
              isTigerGraph ? "bg-goa-green-500 text-paper" : "bg-sun-yellow text-ink"
            }`}
            title="Graph backend in use: TIGERGRAPH LIVE or IN-MEMORY SIMULATOR"
          >
            GRAPH: <strong>{isTigerGraph ? "TIGERGRAPH (LIVE)" : "SIMULATOR"}</strong>
          </span>

          <span
            className={`pill-mono text-[11px] font-mono font-black px-2.5 py-0.5 rounded border border-ink shadow-2xs ${
              isOfficialMcp ? "bg-goa-green-500 text-paper" : "bg-sun-yellow text-ink"
            }`}
            title="MCP Tool Dispatcher layer"
          >
            MCP: <strong>{isOfficialMcp ? "OFFICIAL TIGERGRAPH MCP" : (diag.mcp || "LOCAL_DISPATCHER")}</strong>
          </span>

          <span
            className={`pill-mono text-[11px] font-mono font-black px-2.5 py-0.5 rounded border border-ink shadow-2xs ${
              isGemini ? "bg-goa-green-500 text-paper" : "bg-sun-yellow text-ink"
            }`}
            title="Active LLM reasoning engine"
          >
            LLM: <strong>{isGemini ? "GEMINI (gemini-2.5-flash)" : "DETERMINISTIC RULES"}</strong>
          </span>

          <span
            className={`pill-mono text-[11px] font-mono font-black px-2.5 py-0.5 rounded border border-ink shadow-2xs ${
              isRealData ? "bg-goa-green-500 text-paper" : "bg-sun-yellow text-ink"
            }`}
            title="Dataset source"
          >
            DATA: <strong>{isRealData ? (diag.dataset || "HHGOA_IEEE (590,742 TXNS)") : "DEV FIXTURE (243 TXNS)"}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
