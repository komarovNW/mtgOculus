import { describe, expect, it } from 'vitest';
import type { TournamentListItem } from '@/shared/api/types';
import { getDailyInsights, getMonthlyAttendance } from '@/shared/lib/dailyInsights';

function daily(
  id: string,
  date: string,
  clubId: string,
  playersCount: number,
): TournamentListItem {
  return {
    id,
    title: `Daily ${id}`,
    date,
    type: 'daily',
    city: { id: 'moscow', name: 'Москва' },
    club: { id: clubId, cityId: 'moscow', name: `Клуб ${clubId}` },
    format: { id: 'legacy', name: 'Legacy' },
    playersCount,
    roundsCount: 4,
    matchesCount: playersCount * 2,
  };
}

describe('getDailyInsights', () => {
  it('calculates attendance across the complete event collection', () => {
    const result = getDailyInsights([
      daily('1', '2026-07-01', 'a', 8),
      daily('2', '2026-07-08', 'a', 12),
      daily('3', '2026-07-15', 'b', 10),
    ]);

    expect(result.averagePlayers).toBe(10);
    expect(result.biggestDaily?.id).toBe('2');
    expect(result.latestDaily?.id).toBe('3');
    expect(result.mostActiveClub).toMatchObject({
      eventsCount: 2,
      playersCount: 20,
      club: { id: 'a' },
    });
  });

  it('groups attendance by month using the average per daily', () => {
    expect(
      getMonthlyAttendance([
        daily('1', '2026-06-01', 'a', 8),
        daily('2', '2026-06-08', 'a', 12),
        daily('3', '2026-07-01', 'a', 15),
      ]),
    ).toEqual([
      {
        month: '2026-06',
        eventsCount: 2,
        averagePlayers: 10,
      },
      {
        month: '2026-07',
        eventsCount: 1,
        averagePlayers: 15,
      },
    ]);
  });
});
