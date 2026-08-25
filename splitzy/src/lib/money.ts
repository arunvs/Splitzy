export type SplitType = "equal" | "percentage" | "exact";

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

// Returns null for unparsable/non-positive input rather than throwing, so
// callers can show a validation message instead of crashing on bad input.
export function parseAmountToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function parsePercentage(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/**
 * Splits totalCents evenly across uids. Integer cents don't always divide
 * evenly (e.g. $10 / 3), so the leftover cents are handed one-by-one to the
 * first participants — deterministic, and guarantees the shares always sum
 * to exactly totalCents (no cent lost or invented).
 */
export function splitEqually(totalCents: number, uids: string[]): Record<string, number> {
  const n = uids.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const result: Record<string, number> = {};
  uids.forEach((uid, i) => {
    result[uid] = base + (i < remainder ? 1 : 0);
  });
  return result;
}

/**
 * Splits totalCents by percentage per uid. Percentages must sum to 100
 * (within a small epsilon for floating-point input like 33.33*3). Uses the
 * largest-remainder method: floor each share, then hand out the leftover
 * cents to whichever shares had the largest fractional part — the standard
 * way to round a set of shares so they still sum exactly to the total.
 */
export function splitByPercentage(
  totalCents: number,
  percentages: Record<string, number>,
): Record<string, number> {
  const uids = Object.keys(percentages);
  const totalPercent = uids.reduce((sum, uid) => sum + percentages[uid], 0);
  if (Math.abs(totalPercent - 100) > 0.01) {
    throw new Error(`Percentages must add up to 100 (got ${totalPercent.toFixed(2)}).`);
  }

  const raw = uids.map((uid) => {
    const exact = (totalCents * percentages[uid]) / 100;
    return { uid, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });

  const flooredSum = raw.reduce((sum, r) => sum + r.floor, 0);
  const remainder = totalCents - flooredSum;

  const result: Record<string, number> = {};
  raw.forEach((r) => {
    result[r.uid] = r.floor;
  });

  [...raw]
    .sort((a, b) => b.frac - a.frac)
    .slice(0, remainder)
    .forEach((r) => {
      result[r.uid] += 1;
    });

  return result;
}

export function validateExactSplit(totalCents: number, amounts: Record<string, number>) {
  const sum = Object.values(amounts).reduce((s, v) => s + v, 0);
  if (sum !== totalCents) {
    throw new Error(
      `Amounts must add up to ${formatCents(totalCents)} (got ${formatCents(sum)}).`,
    );
  }
}
