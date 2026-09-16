const heatStops = [0, 25, 40, 50, 60, 75, 100] as const;

const colorAt = (stop: number) => `var(--matchup-heat-${stop})`;

export const matchupHeatGradient = `linear-gradient(to right in srgb, ${heatStops
  .map((stop) => `${colorAt(stop)} ${stop}%`)
  .join(', ')})`;

/** The legend and cells use the same continuous scale, independent of sample size. */
export function getMatchupHeatColor(winRate: number | null): string | undefined {
  if (winRate === null || !Number.isFinite(winRate)) return undefined;

  const value = Math.max(0, Math.min(100, winRate));
  const upperIndex = heatStops.findIndex((stop) => stop >= value);
  const upper = heatStops[upperIndex];
  if (value === upper) return colorAt(upper);

  const lower = heatStops[upperIndex - 1];
  const lowerWeight = ((upper - value) / (upper - lower)) * 100;
  return `color-mix(in srgb, ${colorAt(lower)} ${lowerWeight.toFixed(3)}%, ${colorAt(upper)})`;
}
