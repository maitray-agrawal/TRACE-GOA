import React from 'react';

interface BeachShackProps {
  verdict?: 'fraud' | 'uncertain' | 'legitimate' | string;
  isSelected?: boolean;
  size?: number;
  className?: string;
}

export const BeachShack: React.FC<BeachShackProps> = ({
  verdict = 'uncertain',
  isSelected = false,
  size = 64,
  className = '',
}) => {
  // Shutter color mapping
  let shutterColor = 'var(--sun-yellow)';
  if (verdict === 'fraud') {
    shutterColor = 'var(--hot-pink)';
  } else if (verdict === 'legitimate') {
    shutterColor = 'var(--goa-green-500)';
  }

  return (
    <svg
      viewBox="0 0 80 70"
      width={size}
      height={size * (70 / 80)}
      className={`overflow-visible select-none transition-transform duration-200 ${
        isSelected ? 'scale-110 drop-shadow-md' : 'hover:scale-105'
      } ${className}`}
    >
      {/* Ground Sand Shadow */}
      <ellipse cx="40" cy="65" rx="36" ry="4" fill="var(--ink)" opacity="0.25" />

      {/* Shack Walls */}
      <rect
        x="15"
        y="28"
        width="50"
        height="34"
        fill="var(--sand)"
        stroke="var(--ink)"
        strokeWidth="2.5"
        rx="2"
      />

      {/* Wall Planks Lines */}
      <line x1="15" y1="39" x2="65" y2="39" stroke="var(--ink)" strokeWidth="1.2" opacity="0.35" />
      <line x1="15" y1="50" x2="65" y2="50" stroke="var(--ink)" strokeWidth="1.2" opacity="0.35" />

      {/* Mangalore Terracotta Tiled Roof */}
      <polygon
        points="40,5 74,28 6,28"
        fill="var(--terracotta)"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Roof ridges */}
      <line x1="40" y1="5" x2="22" y2="28" stroke="var(--ink)" strokeWidth="1.8" />
      <line x1="40" y1="5" x2="58" y2="28" stroke="var(--ink)" strokeWidth="1.8" />
      <line x1="40" y1="5" x2="40" y2="28" stroke="var(--ink)" strokeWidth="1.8" />

      {/* Roof Banner Accent Flag */}
      <line x1="40" y1="5" x2="40" y2="1" stroke="var(--ink)" strokeWidth="2" />
      <polygon points="40,1 47,3 40,5" fill="var(--sun-yellow)" stroke="var(--ink)" strokeWidth="1.2" />

      {/* Left Shutter Window (Colored by verdict!) */}
      <rect
        x="21"
        y="35"
        width="11"
        height="14"
        fill={shutterColor}
        stroke="var(--ink)"
        strokeWidth="2"
        rx="1"
      />
      <line x1="21" y1="42" x2="32" y2="42" stroke="var(--ink)" strokeWidth="1.5" />

      {/* Right Shutter Window (Colored by verdict!) */}
      <rect
        x="48"
        y="35"
        width="11"
        height="14"
        fill={shutterColor}
        stroke="var(--ink)"
        strokeWidth="2"
        rx="1"
      />
      <line x1="48" y1="42" x2="59" y2="42" stroke="var(--ink)" strokeWidth="1.5" />

      {/* Center Doorway */}
      <rect
        x="35"
        y="38"
        width="10"
        height="24"
        fill="var(--ink)"
        rx="1"
      />

      {/* Verandah Steps */}
      <rect
        x="32"
        y="60"
        width="16"
        height="3"
        fill="var(--sand-dark)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
    </svg>
  );
};
