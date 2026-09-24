import React from 'react';

interface PinProps {
  color?: 'pink' | 'yellow' | 'green' | 'white';
  className?: string;
  size?: number;
}

export const NoticePin: React.FC<PinProps> = ({
  color = 'pink',
  className = '',
  size = 20,
}) => {
  let fillColor = 'var(--hot-pink)';
  if (color === 'yellow') fillColor = 'var(--sun-yellow)';
  if (color === 'green') fillColor = 'var(--goa-green-500)';
  if (color === 'white') fillColor = 'var(--paper)';

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`overflow-visible drop-shadow-sm select-none ${className}`}
    >
      {/* Pin Shadow */}
      <ellipse cx="14" cy="20" rx="3" ry="1.5" fill="var(--ink)" opacity="0.3" />
      {/* Pin Needle */}
      <line x1="12" y1="14" x2="14" y2="20" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      {/* Pin Head */}
      <circle cx="12" cy="9" r="6" fill={fillColor} stroke="var(--ink)" strokeWidth="2" />
      {/* Pin Highlight */}
      <circle cx="10" cy="7" r="2" fill="var(--paper)" opacity="0.6" />
    </svg>
  );
};

export const TapeStrip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`h-4 w-16 bg-amber-100/80 border-y border-dashed border-ink/40 shadow-2xs rotate-[-2deg] select-none ${className}`}
  />
);
