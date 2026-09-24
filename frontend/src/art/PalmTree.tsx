import React from 'react';

interface PalmTreeProps {
  variant?: 'tall' | 'compact';
  size?: number;
  className?: string;
}

export const PalmTree: React.FC<PalmTreeProps> = ({
  variant = 'tall',
  size = 80,
  className = '',
}) => {
  if (variant === 'compact') {
    return (
      <svg
        viewBox="0 0 80 100"
        width={size * 0.8}
        height={size}
        className={`overflow-visible palm-sway select-none ${className}`}
      >
        {/* Trunk */}
        <path
          d="M 40 95 Q 38 65 37 40 Q 38 35 41 40 Q 42 65 44 95 Z"
          fill="var(--terracotta)"
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Trunk Segments */}
        <line x1="38" y1="75" x2="43" y2="76" stroke="var(--ink)" strokeWidth="2" />
        <line x1="37" y1="58" x2="42" y2="59" stroke="var(--ink)" strokeWidth="2" />
        <line x1="38" y1="45" x2="41" y2="46" stroke="var(--ink)" strokeWidth="2" />

        {/* Coconuts */}
        <circle cx="36" cy="38" r="3" fill="#7A4B1A" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="42" cy="37" r="3" fill="#653D14" stroke="var(--ink)" strokeWidth="1.5" />

        {/* Fronds */}
        {/* Left top */}
        <path
          d="M 39 36 Q 22 25 8 36 Q 22 38 39 36"
          fill="var(--goa-green-500)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        {/* Right top */}
        <path
          d="M 39 36 Q 58 25 72 36 Q 58 38 39 36"
          fill="var(--goa-green-500)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        {/* Center high */}
        <path
          d="M 39 36 Q 39 12 40 5 Q 43 14 39 36"
          fill="var(--goa-green-300)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        {/* Left drooping */}
        <path
          d="M 39 36 Q 16 38 12 55 Q 26 47 39 36"
          fill="var(--goa-green-600)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        {/* Right drooping */}
        <path
          d="M 39 36 Q 62 38 68 55 Q 54 47 39 36"
          fill="var(--goa-green-600)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 140"
      width={size}
      height={size * 1.4}
      className={`overflow-visible palm-sway select-none ${className}`}
    >
      {/* Tall Curved Trunk */}
      <path
        d="M 45 135 Q 48 85 36 45 Q 40 43 43 46 Q 54 85 52 135 Z"
        fill="var(--terracotta)"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Trunk Ring Stripes */}
      <line x1="47" y1="115" x2="52" y2="116" stroke="var(--ink)" strokeWidth="2.5" />
      <line x1="45" y1="95" x2="51" y2="97" stroke="var(--ink)" strokeWidth="2.5" />
      <line x1="41" y1="75" x2="47" y2="78" stroke="var(--ink)" strokeWidth="2.5" />
      <line x1="38" y1="58" x2="43" y2="60" stroke="var(--ink)" strokeWidth="2.5" />

      {/* Coconuts cluster */}
      <circle cx="36" cy="45" r="4.5" fill="#6B3E14" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="43" cy="44" r="4.5" fill="#7D4B1C" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="40" cy="49" r="4" fill="#58310E" stroke="var(--ink)" strokeWidth="2" />

      {/* Arching Fronds with Ink Outlines */}
      {/* Upper Left */}
      <path
        d="M 40 43 Q 18 20 2 34 Q 18 36 40 43"
        fill="var(--goa-green-300)"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
      {/* Upper Right */}
      <path
        d="M 40 43 Q 66 18 88 30 Q 68 36 40 43"
        fill="var(--goa-green-300)"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
      {/* Crest High */}
      <path
        d="M 40 43 Q 36 10 44 2 Q 47 16 40 43"
        fill="var(--goa-green-200)"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
      {/* Low Left */}
      <path
        d="M 40 43 Q 10 46 6 68 Q 24 56 40 43"
        fill="var(--goa-green-500)"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
      {/* Low Right */}
      <path
        d="M 40 43 Q 72 45 92 62 Q 74 54 40 43"
        fill="var(--goa-green-500)"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
    </svg>
  );
};
