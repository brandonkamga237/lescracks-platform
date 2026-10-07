import type { ReactNode } from 'react';

export type LineArtMotif = 'network' | 'code' | 'book' | 'video' | 'calendar' | 'search' | 'path';

interface LineArtProps {
  motif: LineArtMotif;
  /** Size and colour come from the caller: the strokes follow `currentColor`. */
  className?: string;
}

const MOTIFS: Record<LineArtMotif, ReactNode> = {
  network: (
    <>
      <g opacity="0.45">
        <path d="M40 60 110 40 190 70M40 60 70 130 150 120 110 40M190 70 150 120 210 160 190 70M70 130 50 200 130 190 150 120M130 190 210 160" />
      </g>
      {[[40, 60], [190, 70], [70, 130], [210, 160], [50, 200]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" className="fill-[var(--surface-0)]" />)}
      {[[110, 40], [150, 120], [130, 190]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="currentColor" />)}
    </>
  ),
  code: (
    <>
      <path d="M90 50C70 50 70 60 70 80v25c0 10-8 15-18 15 10 0 18 5 18 15v25c0 20 0 30 20 30M150 50c20 0 20 10 20 30v25c0 10 8 15 18 15-10 0-18 5-18 15v25c0 20 0 30-20 30" />
      <rect x="114" y="100" width="12" height="40" fill="currentColor" stroke="none" />
    </>
  ),
  book: (
    <>
      <path d="M120 70C100 58 70 56 40 62v120c30-6 60-4 80 8M120 70c20-12 50-14 80-8v120c-30-6-60-4-80 8M120 70v120" />
      <path opacity="0.45" d="M58 90l44 4M58 110l44 3M58 130l44 2M58 150l32 1M138 94l44-4M138 113l44-3M138 132l44-2" />
      <path d="M168 57v36l8-8 8 8V56" fill="currentColor" />
    </>
  ),
  video: (
    <>
      <rect x="30" y="50" width="180" height="120" rx="4" />
      <path d="M108 88v44l36-22z" fill="currentColor" />
      <path opacity="0.35" d="M110 196h100" />
      <path d="M30 196h80" />
      <circle cx="110" cy="196" r="5" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="36" y="44" width="168" height="160" rx="4" />
      <path d="M80 32v24M160 32v24M36 80h168" />
      {Array.from({ length: 28 }, (_, i) => {
        const cx = 56 + (i % 7) * 22;
        const cy = 102 + Math.floor(i / 7) * 26;
        return <circle key={i} cx={cx} cy={cy} r="2.5" fill="currentColor" stroke="none" opacity={cx === 144 && cy === 128 ? 1 : 0.45} />;
      })}
      <circle cx="144" cy="128" r="11" />
    </>
  ),
  search: (
    <>
      <circle cx="104" cy="104" r="50" />
      <path d="M140 140l56 56" />
      <path opacity="0.45" d="M80 104h48" strokeDasharray="2 8" />
    </>
  ),
  path: (
    <>
      <path d="M30 190c50 0 40-70 90-70s50-60 90-70" strokeDasharray="2 8" />
      <circle cx="30" cy="190" r="6" fill="currentColor" />
      <path d="M200 40l20 20M220 40l-20 20" />
    </>
  ),
};

/**
 * The house illustration style: hairline gold geometry on black, no people.
 * There are no real photos of the community yet, so these carry the visual weight
 * without passing stock images off as LesCracks.
 */
export default function LineArt({ motif, className = '' }: LineArtProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {MOTIFS[motif]}
    </svg>
  );
}
