export function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)}%`;
}

