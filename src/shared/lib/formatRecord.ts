export function formatRecord(wins?: number | null, losses?: number | null, draws?: number | null) {
  if (wins === undefined || wins === null || losses === undefined || losses === null) {
    return '—';
  }

  const safeDraws = draws ?? 0;

  if (safeDraws > 0) {
    return `${wins}-${losses}-${safeDraws}`;
  }

  return `${wins}-${losses}`;
}

