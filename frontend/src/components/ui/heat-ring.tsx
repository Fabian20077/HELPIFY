'use client';

const LEVELS = [
  { max: 20, color: 'oklch(0.78 0.18 145)', glow: '0 0 8px oklch(0.78 0.18 145 / 0.3)' },
  { max: 40, color: 'oklch(0.82 0.16 85)', glow: '0 0 12px oklch(0.82 0.16 85 / 0.3)' },
  { max: 60, color: 'oklch(0.75 0.2 55)', glow: '0 0 16px oklch(0.75 0.2 55 / 0.35)' },
  { max: 80, color: 'oklch(0.68 0.22 35)', glow: '0 0 20px oklch(0.68 0.22 35 / 0.4)' },
  { max: 101, color: 'oklch(0.58 0.22 25)', glow: '0 0 24px oklch(0.58 0.22 25 / 0.5)' },
];

function getLevel(score: number) {
  return LEVELS.find(s => score < s.max) || LEVELS[LEVELS.length - 1];
}

const SIZES = {
  sm: { ring: 36, stroke: 3, fontSize: 11 },
  md: { ring: 48, stroke: 3.5, fontSize: 13 },
  lg: { ring: 64, stroke: 4, fontSize: 16 },
};

interface HeatRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function HeatRing({ score, size = 'md', pulse = true }: HeatRingProps) {
  const { ring, stroke, fontSize } = SIZES[size];
  const level = getLevel(score);
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1) * circumference;

  return (
    <div
      className="relative"
      style={{
        width: ring,
        height: ring,
        filter: pulse ? level.glow : undefined,
      }}
    >
      <svg width={ring} height={ring} className="-rotate-90">
        <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" stroke="oklch(0.25 0.015 260)" strokeWidth={stroke} />
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono font-bold tabular-nums"
        style={{ fontSize, color: level.color }}
      >
        {score}
      </div>
    </div>
  );
}

/* ── Linear Heat Bar for lists ── */
interface HeatBarProps {
  score: number;
}

export function HeatBar({ score }: HeatBarProps) {
  const level = getLevel(score);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 rounded-full bg-surface overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(score, 100)}%`, background: level.color, transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </div>
      <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: level.color }}>
        {score}
      </span>
    </div>
  );
}
