export function formatPlayoffStage(topN: number) {
  return topN === 2 ? 'Финал' : topN === 4 ? 'Полуфинал' : topN === 8 ? 'Четвертьфинал' : `Топ-${topN}`;
}
