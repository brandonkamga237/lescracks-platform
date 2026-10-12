import { memo } from 'react';

const SIZE = 100;
const ROWS = 3;
const COLS = 3;
const ORIGIN_X = 30;
const ORIGIN_Y = 70;
// The piece the reader is about to set: the lab's promise, one missing piece of reasoning.
const MISSING = { row: 1, col: 2 };
// Signs of the inner edges: 1 means the tab sticks out of the upper or left piece.
const HORIZONTAL = [[1, -1, 1], [-1, 1, -1]];
const VERTICAL = [[-1, 1], [1, -1], [-1, 1]];
const GLYPHS = ['{ }', '?', '→', '∑', '', 'if', '%', 'λ', '#'];

type Point = [number, number];

/** One side of a piece, from `a` to `b`, with a tab outward (1), a slot (-1) or flat (0). */
function edge([ax, ay]: Point, [bx, by]: Point, bump: number) {
  const ux = (bx - ax) / SIZE;
  const uy = (by - ay) / SIZE;
  const at = (t: number, h: number) => {
    const x = ax + ux * t * SIZE + uy * h * SIZE * bump;
    const y = ay + uy * t * SIZE - ux * h * SIZE * bump;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  if (!bump) return `L${bx} ${by}`;
  return `L${at(0.37, 0)} C${at(0.42, 0.06)} ${at(0.3, 0.2)} ${at(0.5, 0.2)} C${at(0.7, 0.2)} ${at(0.58, 0.06)} ${at(0.63, 0)} L${bx} ${by}`;
}

function piecePath(row: number, col: number, x: number, y: number) {
  const top = row === 0 ? 0 : -HORIZONTAL[row - 1][col];
  const bottom = row === ROWS - 1 ? 0 : HORIZONTAL[row][col];
  const left = col === 0 ? 0 : -VERTICAL[row][col - 1];
  const right = col === COLS - 1 ? 0 : VERTICAL[row][col];
  const tl: Point = [x, y];
  const tr: Point = [x + SIZE, y];
  const br: Point = [x + SIZE, y + SIZE];
  const bl: Point = [x, y + SIZE];
  return `M${x} ${y} ${edge(tl, tr, top)} ${edge(tr, br, right)} ${edge(br, bl, bottom)} ${edge(bl, tl, left)} Z`;
}

interface PuzzleArtProps {
  className?: string;
  /** Decorative glyphs on the pieces; off for small sizes where they turn into noise. */
  glyphs?: boolean;
}

function PuzzleArt({ className, glyphs = true }: PuzzleArtProps) {
  const cells = Array.from({ length: ROWS * COLS }, (_, index) => ({ row: Math.floor(index / COLS), col: index % COLS, index }));
  const missingX = ORIGIN_X + MISSING.col * SIZE;
  const missingY = ORIGIN_Y + MISSING.row * SIZE;
  return (
    <svg viewBox="0 0 400 420" className={className} aria-hidden focusable="false">
      {cells.filter(({ row, col }) => row !== MISSING.row || col !== MISSING.col).map(({ row, col, index }) => {
        const x = ORIGIN_X + col * SIZE;
        const y = ORIGIN_Y + row * SIZE;
        return (
          <g key={index}>
            <path d={piecePath(row, col, x, y)} className="fill-noir-800 stroke-line-strong" strokeWidth={1.5} />
            {glyphs && GLYPHS[index] && (
              <text x={x + SIZE / 2} y={y + SIZE / 2 + 6} textAnchor="middle" className="fill-t4 font-mono text-[18px]">{GLYPHS[index]}</text>
            )}
          </g>
        );
      })}
      <path d={piecePath(MISSING.row, MISSING.col, missingX, missingY)} fill="none" className="stroke-gold-400/60" strokeWidth={1.5} strokeDasharray="5 5" />
      <g transform={`translate(34 -58) rotate(9 ${missingX + SIZE / 2} ${missingY + SIZE / 2})`}>
        <path d={piecePath(MISSING.row, MISSING.col, missingX, missingY)} className="fill-gold-400 stroke-noir-950" strokeWidth={1.5} />
        <path d={`M${missingX + 34} ${missingY + 52} l12 12 l22 -26`} fill="none" className="stroke-noir-950" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default memo(PuzzleArt);
