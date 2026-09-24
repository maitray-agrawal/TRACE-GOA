import React, { useState } from 'react';
import { PalmTree } from '../art/PalmTree';
import { Sun } from '../art/Sun';
import { Play, ArrowRight, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onStartInvestigation: () => void;
  onOpenDemo: () => void;
  onScrollToStats?: () => void;
  liveBackendStatus?: {
    graph_engine: string;
    llm: string;
    dataset: string;
    mcp?: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartInvestigation,
  onOpenDemo,
  liveBackendStatus,
}) => {
  // Draggable sticker state (wiggles on drag, snaps back with spring)
  const [stickerOffset, setStickerOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - stickerOffset.x, y: e.clientY - stickerOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setStickerOffset({
      x: Math.max(-120, Math.min(120, newX)),
      y: Math.max(-60, Math.min(60, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      setStickerOffset({ x: 0, y: 0 });
    }, 150);
  };

  const isTigerGraph = liveBackendStatus?.graph_engine === 'TIGERGRAPH';
  const isGemini = liveBackendStatus?.llm?.includes('GEMINI');

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full overflow-hidden bg-goa-green-700 border-b-4 border-ink py-10 md:py-16 select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 15%, rgba(254, 225, 1, 0.15) 0%, transparent 60%)`,
      }}
    >
      {/* Decorative Palm Trees on Left and Right flanks */}
      <div className="absolute left-2 md:left-8 bottom-0 pointer-events-none opacity-70 z-0">
        <PalmTree variant="tall" size={110} />
      </div>
      <div className="absolute right-2 md:right-8 bottom-0 pointer-events-none opacity-70 z-0 transform scale-x-[-1]">
        <PalmTree variant="compact" size={95} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="hero-grid">
          {/* Left Column: Title, Subtitle, Telemetry, CTAs */}
          <div className="flex flex-col items-start text-left">
            {/* Top Product Category Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-ink bg-sun-yellow text-ink text-xs font-mono font-black uppercase tracking-widest mb-4 shadow-goa-sm">
              <span>HACKER HOUSE GOA 2026</span>
              <span>·</span>
              <span>AUTONOMOUS FRAUD AGENT</span>
              <span>·</span>
              <span className="text-goa-green-900 font-extrabold">TIGERGRAPH</span>
            </div>

            {/* Giant Title with Absolutely Positioned Sticker */}
            <div className="relative my-2 inline-block">
              <h1 className="poster-title-clamp drop-shadow-md">
                TRACE<span className="text-paper mx-1">//</span>GOA
              </h1>

              {/* Interactive Rotated Pink "जाँच" (Investigation) Sticker */}
              <div
                onMouseDown={handleMouseDown}
                style={{
                  transform: `translate(${stickerOffset.x}px, ${stickerOffset.y}px) rotate(${
                    isDragging ? '12deg' : '-8deg'
                  })`,
                  transition: isDragging ? 'none' : 'transform 0.3s var(--ease-spring)',
                }}
                className="sticker-pink absolute -top-3 -right-2 sm:-right-6 md:-right-8 text-lg sm:text-2xl font-black py-1 px-3 z-20 cursor-grab active:cursor-grabbing shadow-goa border-3 border-ink"
                title="Draggable investigation sticker (जाँच) — Grab and release!"
              >
                जाँच
              </div>
            </div>

            {/* Product Subtitle */}
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-black text-paper tracking-tight mt-1 max-w-xl leading-snug">
              Agentic Fraud Investigation &amp; Next-Best Action Engine
            </h2>

            {/* Product Tagline */}
            <p className="font-mono text-xs sm:text-sm text-sun-yellow font-black tracking-widest uppercase mt-2">
              TRACE THE SIGNAL. FIND THE NETWORK. MAKE THE MOVE.
            </p>

            {/* Small Mono Technical Metadata Pill Strip */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4 max-w-xl">
              {['TIGERGRAPH', 'MCP', 'GRAPHRAG', 'CASE MEMORY', 'HUMAN APPROVAL', 'AUDIT LEDGER'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-sm border border-ink bg-paper text-ink text-[10px] font-mono font-bold shadow-2xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Live Backend Telemetry Pill Strip */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-sand text-ink text-[11px] font-mono font-bold shadow-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isTigerGraph ? 'bg-goa-green-500 animate-pulse' : 'bg-sun-yellow'
                  }`}
                />
                GRAPH:{' '}
                <strong className={isTigerGraph ? 'text-goa-green-700' : 'text-amber-800'}>
                  {liveBackendStatus?.graph_engine || 'SIMULATOR'}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-sand text-ink text-[11px] font-mono font-bold shadow-xs">
                LLM:{' '}
                <strong className={isGemini ? 'text-hot-pink' : 'text-ink'}>
                  {liveBackendStatus?.llm || 'DETERMINISTIC_RULES'}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-sand text-ink text-[11px] font-mono font-bold shadow-xs">
                <ShieldCheck size={12} className="text-goa-green-700" />
                GUARDRAILS: <strong>POLICIES R1–R10</strong>
              </span>
            </div>

            {/* Action Button Row with Stitched & Outlined Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <button
                onClick={onStartInvestigation}
                className="btn-primary-stitched"
              >
                <span>START INVESTIGATION</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onOpenDemo}
                className="btn-secondary-outlined"
              >
                <Play size={16} fill="currentColor" className="text-hot-pink" />
                <span>VIEW BENCHMARK [D]</span>
              </button>
            </div>
          </div>

          {/* Right Column: Sized Illustration Box (max-width: 520px) */}
          <div className="hero-illustration-box flex flex-col items-center justify-center p-6 bg-goa-green-900/40 rounded-2xl border-3 border-ink shadow-goa">
            <div className="w-full flex justify-center py-4">
              <Sun size={180} confidence={0.88} riskScore={0.75} showSea={true} />
            </div>
            <div className="mt-4 px-4 py-2 bg-sand/90 rounded border-2 border-ink text-center">
              <div className="font-mono text-xs font-black text-ink uppercase">
                COASTAL RISK &amp; CONFIDENCE RADAR
              </div>
              <div className="font-mono text-[10px] text-ink/70">
                Zenith angle = 0.88 Confidence · Tide height = 0.75 Risk Exposure
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
