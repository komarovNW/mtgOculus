import { describe, expect, it } from 'vitest';
import type { PlayerTournamentItem } from '@/shared/api/types';
import { getEventStructure, getTournamentAchievements } from '@/shared/lib/tournamentResults';

function participation(id: string, rank: number, type: 'daily' | 'tournament' = 'tournament', playersCount = 109): PlayerTournamentItem {
  return { tournament: { id, title: id, type, date: '2026-10-21', playersCount,
    city: { id: 'moscow', name: 'Москва' }, club: { id: 'portal', name: 'Портал', cityId: 'moscow' }, format: { id: 'standard', name: 'Standard' } },
  rank, record: '4-2', points: 12 };
}

describe('tournament achievements', () => {
  it('counts final places once, excludes dailies and unknown ranks, and breaks ties by field size', () => {
    const result = getTournamentAchievements([
      participation('daily', 1, 'daily'), participation('win', 1), participation('win', 1),
      participation('small-win', 1, 'tournament', 8), participation('semi', 4), participation('quarter', 8),
      participation('outside', 9), participation('unknown', 0),
    ]);
    expect(result).toMatchObject({ count: 6, wins: 2, top4: 3, top8: 4 });
    expect(result.best?.tournament.id).toBe('win');
    expect(getTournamentAchievements([]).best).toBeUndefined();
  });
  it('does not describe missing playoff information as a tournament without playoffs', () => {
    expect(getEventStructure({ type: 'tournament' })).toBe('Турнир');
    expect(getEventStructure({ type: 'tournament', playoffSize: null })).toBe('Только швейцарка');
    expect(getEventStructure({ type: 'tournament', playoffSize: 4 })).toBe('Топ-4');
    expect(getEventStructure({ type: 'tournament', playoffSize: 8 })).toBe('Топ-8');
    expect(getEventStructure({ type: 'daily' })).toBe('Дейлик');
  });
});
