import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpCircle,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { MatchStatus } from '../data/skillBridgeData';

export const MatchStatusBadge: React.FC<{
  status: MatchStatus;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : size === 'lg'
      ? 'px-4 py-2 text-sm gap-2'
      : 'px-3 py-1.5 text-xs gap-1.5';

  switch (status) {
    case 'Match':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#238a7a] shrink-0" aria-hidden="true" />
          <span>Cocok</span>
        </span>
      );
    case 'Underqualified':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <AlertTriangle className="w-4 h-4 text-[#b7791f] shrink-0" aria-hidden="true" />
          <span>Perlu penguatan skill</span>
        </span>
      );
    case 'Potentially Overqualified':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-blue-50 text-blue-900 border border-blue-300 ${sizeClasses}`}
        >
          <ArrowUpCircle className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          <span>Melampaui level posisi</span>
        </span>
      );
    case 'Insufficient Evidence':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-300 ${sizeClasses}`}
        >
          <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
          <span>Bukti CV belum cukup</span>
        </span>
      );
  }
};

export const SkillComparisonBadge: React.FC<{
  status: 'matched' | 'missing' | 'insufficient';
  compact?: boolean;
}> = ({ status, compact = false }) => {
  const padding = compact ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  if (status === 'matched') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 ${padding}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>Terbukti di CV</span>
      </span>
    );
  }
  if (status === 'insufficient') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 ${padding}`}
      >
        <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
        <span>Perlu bukti tambahan</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 ${padding}`}
    >
      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
      <span>Belum ditemukan di CV</span>
    </span>
  );
};

export const ScoreGauge: React.FC<{
  score: number;
  status: MatchStatus;
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, status, size = 'md' }) => {
  const dimensions =
    size === 'sm' ? 56 : size === 'lg' ? 92 : 70;
  const strokeWidth = size === 'sm' ? 5 : size === 'lg' ? 8 : 6;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 80 ? '#238a7a' : score >= 65 ? '#b7791f' : '#c45555';
  const scoreLabel =
    score >= 80 ? 'Kuat' : score >= 65 ? 'Sedang' : 'Rendah';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: dimensions, height: dimensions }}
      aria-label={`Skor estimasi kecocokan ${score} dari 100`}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dimensions} ${dimensions}`}>
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-mono-metric font-bold text-slate-900 leading-none ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base'
          }`}
        >
          {score}%
        </span>
        {size !== 'sm' && (
          <span
            className="text-[10px] font-semibold mt-0.5"
            style={{ color: strokeColor }}
          >
            {scoreLabel}
          </span>
        )}
      </div>
    </div>
  );
};
