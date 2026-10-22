import type { PlayerTournamentItem, TournamentType } from '@/shared/api/types';

export function getEventStructure(event: { type: TournamentType; playoffSize?: number | null }) {
  if (event.type === 'daily') return 'Дейлик';
  if (event.playoffSize === null) return 'Только швейцарка';
  return event.playoffSize ? `Топ-${event.playoffSize}` : 'Турнир';
}

export function getTournamentAchievements(items: PlayerTournamentItem[]) {
  const tournaments = [...new Map(items
    .filter((item) => item.tournament.type === 'tournament')
    .map((item) => [item.tournament.id, item])).values()];
  const ranked = tournaments.filter((item) => item.rank > 0);
  return {
    count: tournaments.length,
    wins: ranked.filter((item) => item.rank === 1).length,
    top4: ranked.filter((item) => item.rank <= 4).length,
    top8: ranked.filter((item) => item.rank <= 8).length,
    best: [...ranked].sort((a, b) => a.rank - b.rank || b.tournament.playersCount - a.tournament.playersCount || b.tournament.date.localeCompare(a.tournament.date))[0],
  };
}
