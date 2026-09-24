import React from 'react';

interface RubberStampProps {
  type: 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'BLOCKED' | 'CLEARED';
  date?: string;
  by?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RubberStamp: React.FC<RubberStampProps> = ({
  type,
  date = '2026-10-29',
  by = 'ANALYST_01',
  size = 'md',
  className = '',
}) => {
  let borderColor = 'var(--goa-green-500)';
  let textColor = 'var(--goa-green-500)';
  let label = type;

  if (type === 'REJECTED' || type === 'BLOCKED') {
    borderColor = 'var(--hot-pink)';
    textColor = 'var(--hot-pink)';
  } else if (type === 'ESCALATED') {
    borderColor = 'var(--terracotta)';
    textColor = 'var(--terracotta)';
  }

  const scaleClass = size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-125' : 'scale-100';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-2 rounded-lg border-4 border-dashed rotate-[-6deg] select-none uppercase tracking-wider font-black font-mono transition-transform duration-150 hover:scale-105 ${scaleClass} ${className}`}
      style={{ borderColor, color: textColor }}
    >
      <div className="flex items-center gap-1 border-b-2 border-dashed w-full justify-center pb-0.5 mb-0.5" style={{ borderColor }}>
        <span className="text-[10px] tracking-widest opacity-80">TRACE//GOA</span>
      </div>
      <div className="text-xl sm:text-2xl font-extrabold tracking-tight px-3 py-0.5">
        {label}
      </div>
      <div className="text-[9px] tracking-widest flex items-center justify-between w-full pt-0.5 border-t-2 border-dashed opacity-90" style={{ borderColor }}>
        <span>{date}</span>
        <span>BY: {by}</span>
      </div>
    </div>
  );
};
