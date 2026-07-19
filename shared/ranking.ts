/**
 * Standard competition ranking (1-2-2-4): teams with equal raw values share
 * the same 0-based rank index, and the next distinct value's rank skips by
 * however many entries tied for the rank(s) above it.
 *
 * `orderedIds` must already be sorted by `raw` value descending — the
 * returned array lines up 1:1 with it.
 */
export function rankIndices(orderedIds: string[], raw: Record<string, number>): number[] {
  const out: number[] = [];
  let lastValue: number | null = null;
  let lastRank = 0;
  orderedIds.forEach((id, i) => {
    const value = raw[id] ?? 0;
    if (lastValue === null || value !== lastValue) {
      lastRank = i;
      lastValue = value;
    }
    out.push(lastRank);
  });
  return out;
}
