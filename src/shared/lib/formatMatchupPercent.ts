const percent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export function formatMatchupPercent(value: number | null) {
  return value === null || !Number.isFinite(value) ? '—' : `${percent.format(value)}%`;
}
