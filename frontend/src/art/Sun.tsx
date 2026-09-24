import React from 'react';

interface SunProps {
  confidence?: number; // 0.0 to 1.0 (determines elevation / height)
  riskScore?: number;  // 0.0 to 1.0 (determines color: green -> yellow -> pink)
  size?: number;
  className?: string;
  showSea?: boolean;
}

export const Sun: React.FC<SunProps> = ({
  confidence = 0.85,
  riskScore = 0.72,
  size = 120,
  className = '',
  showSea = true,
}) => {
  // Determine color based on risk score
  let haloColor = 'var(--goa-green-500)';
  let sunColor = 'var(--sun-yellow)';
  if (riskScore >= 0.75) {
    haloColor = 'var(--hot-pink)';
    sunColor = '#FFA0C2';
  } else if (riskScore >= 0.40) {
    haloColor = 'var(--sun-yellow)';
    sunColor = '#FFF275';
  }

  // Calculate sun vertical position based on confidence (higher confidence = sun rises higher)
  const clampedConfidence = Math.max(0.1, Math.min(1.0, confidence));
  const sunCenterY = 70 - clampedConfidence * 35; // rises from y=66 to y=35

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible"
      >
        {/* Glow Halo */}
        <circle
          cx="50"
          cy={sunCenterY}
          r="26"
          fill={haloColor}
          opacity="0.25"
          className="transition-all duration-700"
        />

        {/* Outer Rays */}
        <g stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-700">
          {[-45, -30, -15, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const r1 = 20;
            const r2 = 25;
            const x1 = 50 + Math.cos(rad) * r1;
            const y1 = sunCenterY + Math.sin(rad) * r1;
            const x2 = 50 + Math.cos(rad) * r2;
            const y2 = sunCenterY + Math.sin(rad) * r2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={haloColor}
                strokeWidth="2.5"
              />
            );
          })}
        </g>

        {/* Sun Body */}
        <circle
          cx="50"
          cy={sunCenterY}
          r="16"
          fill={sunColor}
          stroke="var(--ink)"
          strokeWidth="3"
          className="transition-all duration-700"
        />

        {/* Sun Face / Highlight */}
        <path
          d={`M 43 ${sunCenterY - 4} Q 46 ${sunCenterY - 7} 50 ${sunCenterY - 7} Q 54 ${sunCenterY - 7} 57 ${sunCenterY - 4}`}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="45" cy={sunCenterY} r="1.5" fill="var(--ink)" />
        <circle cx="55" cy={sunCenterY} r="1.5" fill="var(--ink)" />
        <path
          d={`M 46 ${sunCenterY + 4} Q 50 ${sunCenterY + 7} 54 ${sunCenterY + 4}`}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Sea Waves Horizon */}
        {showSea && (
          <g>
            {/* Sea Base */}
            <path
              d="M 5 75 Q 25 71 50 75 Q 75 79 95 75 L 95 95 L 5 95 Z"
              fill="var(--goa-green-700)"
              stroke="var(--ink)"
              strokeWidth="2.5"
            />
            {/* Top Foam Ripple */}
            <path
              d="M 5 75 Q 15 72 25 75 Q 35 78 45 75 Q 55 72 65 75 Q 75 78 85 75 Q 95 72 100 75"
              fill="none"
              stroke="var(--sand)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 12 84 Q 28 81 44 84 Q 60 87 76 84 Q 88 82 95 84"
              fill="none"
              stroke="var(--goa-green-500)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
