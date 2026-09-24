import React from 'react';

interface SurfboardChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  color?: 'yellow' | 'pink' | 'green' | 'sand';
  className?: string;
}

export const SurfboardChip: React.FC<SurfboardChipProps> = ({
  label,
  count,
  isActive,
  onClick,
  color = 'sand',
  className = '',
}) => {
  let activeBg = 'bg-sun-yellow text-ink';
  if (color === 'pink') activeBg = 'bg-hot-pink text-paper';
  if (color === 'green') activeBg = 'bg-goa-green-500 text-paper';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-ink text-xs font-mono font-extrabold uppercase tracking-wider transition-all duration-150 select-none shadow-sm ${
        isActive
          ? `${activeBg} -translate-y-0.5 shadow-md scale-105`
          : 'bg-sand text-ink hover:bg-sand-light hover:-translate-y-0.5'
      } ${className}`}
    >
      {/* Mini surfboard stripe mark */}
      <span className="w-1.5 h-3.5 rounded-full bg-ink/40 inline-block" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`px-1.5 py-0.2 text-[10px] rounded-full border border-ink font-mono ${
            isActive ? 'bg-ink text-paper' : 'bg-paper text-ink'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
