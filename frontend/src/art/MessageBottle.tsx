import React from 'react';

interface MessageBottleProps {
  status?: 'floating_out' | 'floating_in' | 'opened';
  size?: number;
  className?: string;
}

export const MessageBottle: React.FC<MessageBottleProps> = ({
  status = 'floating_in',
  size = 60,
  className = '',
}) => {
  const isOpened = status === 'opened';

  return (
    <svg
      viewBox="0 0 70 90"
      width={size}
      height={size * (90 / 70)}
      className={`overflow-visible select-none transition-transform duration-500 ${
        isOpened ? 'scale-110' : 'animate-bounce duration-1000'
      } ${className}`}
    >
      {/* Bottle Glass Body */}
      <path
        d="M 28 20 L 28 30 C 20 38 18 50 18 70 C 18 80 26 84 35 84 C 44 84 52 80 52 70 C 52 50 50 38 42 30 L 42 20 Z"
        fill="rgba(169, 221, 185, 0.45)"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Glass Highlight */}
      <path
        d="M 23 48 C 22 55 22 68 25 74"
        fill="none"
        stroke="var(--paper)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Cork Stopper - popped up if opened */}
      <polygon
        points={isOpened ? "30,4 40,4 39,12 31,12" : "30,12 40,12 39,20 31,20"}
        fill="var(--sand-dark)"
        stroke="var(--ink)"
        strokeWidth="2"
        className="transition-all duration-300"
      />

      {/* Paper Scroll inside bottle */}
      <rect
        x="27"
        y="42"
        width="16"
        height="28"
        fill="var(--sand-light)"
        stroke="var(--ink)"
        strokeWidth="1.5"
        rx="2"
        transform="rotate(6 35 56)"
      />
      {/* Scroll text lines */}
      <line x1="30" y1="48" x2="38" y2="49" stroke="var(--ink)" strokeWidth="1.2" opacity="0.6" />
      <line x1="30" y1="54" x2="39" y2="55" stroke="var(--ink)" strokeWidth="1.2" opacity="0.6" />
      <line x1="30" y1="60" x2="37" y2="61" stroke="var(--ink)" strokeWidth="1.2" opacity="0.6" />

      {/* Water Ripple at base */}
      <path
        d="M 10 78 Q 22 74 35 78 Q 48 82 60 78"
        fill="none"
        stroke="var(--goa-green-300)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
