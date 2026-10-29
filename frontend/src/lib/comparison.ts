// Below this base a percentage says more about chance, or about a period that was barely
// measured, than about a trend: 7 visitors becoming 310 reads "+4 329 %".
export const MIN_BASE = 20;

/** A figure set against another: the percentage only when it means something, the other figure always. */
export interface Comparison {
  pct: number | null;
  note: string | null;
}

export const compareWith = (
  value: number | null | undefined, previous: number | null | undefined, before: string,
): Comparison => {
  if (value == null || previous == null) return { pct: null, note: null };
  if (previous === 0) return { pct: null, note: `rien de mesuré ${before}` };
  return {
    pct: previous >= MIN_BASE ? Math.round(((value - previous) / previous) * 100) : null,
    note: `contre ${previous.toLocaleString('fr-FR')} ${before}`,
  };
};

/** How much a total grew: what it gained against what it was at the start, if that start is large enough. */
export const growthOf = (total: number, gained: number): number | null => {
  const atStart = total - gained;
  return atStart >= MIN_BASE ? Math.round((gained / atStart) * 100) : null;
};
