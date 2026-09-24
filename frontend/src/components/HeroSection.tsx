import React, { useState } from 'react';
import { PalmTree } from '../art/PalmTree';
import { Sun } from '../art/Sun';
import { Play, ArrowDown, ShieldAlert, Cpu } from 'lucide-react';

interface HeroSectionProps {
  onStartInvestigation: () => void;
  onOpenDemo: () => void;
  onScrollToStats: () => void;
  liveBackendStatus?: {
    graph_engine: string;
    llm: string;
    dataset: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartInvestigation,
  onOpenDemo,
  onScrollToStats,
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
    // Limit bounds so it doesn't leave the hero area
    setStickerOffset({
      x: Math.max(-120, Math.min(120, newX)),
      y: Math.max(-60, Math.min(60, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Smoothly snap back
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
      className="relative w-full overflow-hidden bg-goa-green-700 border-b-4 border-ink py-12 md:py-20 select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 10%, rgba(255, 225, 0, 0.12) 0%, transparent 60%)`,
      }}
    >
      {/* Decorative Palm Trees on Left and Right flanks */}
      <div className="absolute left-2 md:left-8 bottom-0 pointer-events-none opacity-80 z-0">
        <PalmTree variant="tall" size={120} />
      </div>
      <div className="absolute right-2 md:right-8 bottom-0 pointer-events-none opacity-80 z-0 transform scale-x-[-1]">
        <PalmTree variant="compact" size={100} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
        {/* Top Location & Hackathon Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-ink bg-sand text-ink text-xs font-mono font-black uppercase tracking-widest mb-6 shadow-sm">
          <span>GOA, INDIA</span>
          <span>·</span>
          <span>HACKER HOUSE GOA 2026</span>
          <span>·</span>
          <span className="text-terracotta">TIGERGRAPH CHALLENGE</span>
        </div>

        {/* Central Sun Graphic */}
        <div className="mb-2">
          <Sun size={110} confidence={0.88} riskScore={0.75} showSea={false} />
        </div>

        {/* Giant Stacked Poster Title: TRACE // GOA */}
        <div className="relative my-2 inline-block">
          <h1 className="poster-title text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter">
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
            className="sticker-pink absolute -top-4 -right-4 sm:-right-8 md:-right-12 text-xl sm:text-2xl md:text-3xl font-black py-1 px-4 z-20 cursor-grab active:cursor-grabbing shadow-md border-3 border-ink"
            title="Draggable investigation sticker (जाँच) — Grab and release!"
          >
            जाँच
          </div>
        </div>

        {/* Monospaced Technical Sub-line */}
        <p className="font-mono text-xs sm:text-sm md:text-base text-goa-green-200 tracking-wider uppercase font-semibold mt-3 max-w-3xl">
          AGENTIC FRAUD INVESTIGATION &amp; NEXT-BEST ACTION ENGINE · POWERED BY TIGERGRAPH
        </p>

        {/* Core Manifesto Tagline */}
        <div className="mt-4 px-4 py-1.5 rounded-md border border-ink/40 bg-goa-green-900/60 text-sand-light font-display text-lg sm:text-xl tracking-wide uppercase italic">
          &ldquo;Trace the signal. Find the network. Make the move.&rdquo;
        </div>

        {/* Live Backend Telemetry Pill Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-paper text-ink text-[11px] font-mono font-bold shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isTigerGraph ? 'bg-goa-green-500 animate-pulse' : 'bg-sun-yellow'
              }`}
            />
            GRAPH:{' '}
            <strong className={isTigerGraph ? 'text-goa-green-700' : 'text-amber-700'}>
              {liveBackendStatus?.graph_engine || 'SIMULATOR'}
            </strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-paper text-ink text-[11px] font-mono font-bold shadow-xs">
            <Cpu size={12} className="text-terracotta" />
            LLM:{' '}
            <strong className={isGemini ? 'text-hot-pink' : 'text-ink'}>
              {liveBackendStatus?.llm || 'GEMINI (gemini-2.5-flash)'}
            </strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-paper text-ink text-[11px] font-mono font-bold shadow-xs">
            <ShieldAlert size={12} className="text-goa-green-600" />
            POLICY: <strong>DETERMINISTIC GATE (R1-R10)</strong>
          </span>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={onStartInvestigation}
            className="btn-goa-primary text-sm sm:text-base py-3 px-6 shadow-md"
          >
            START INVESTIGATION ➔
          </button>

          <button
            onClick={onOpenDemo}
            className="btn-goa-primary btn-goa-pink text-sm sm:text-base py-3 px-6 shadow-md flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            DEMO MODE [D]
          </button>

          <button
            onClick={onScrollToStats}
            className="btn-goa-outline text-xs sm:text-sm py-2.5 px-4 font-mono font-bold flex items-center gap-1"
          >
            CHECK RESULTS <ArrowDown size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
