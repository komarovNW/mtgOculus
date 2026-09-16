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
    pairingsCount: playersCount * 2,
    playedMatchesCount: playersCount * 2,
    byesCount: 0,
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
    expect(result.attendanceTrend).toBeUndefined();
    expect(result.biggestDaily?.id).toBe('2');
    expect(result.latestDaily?.id).toBe('3');
    expect(result.mostActiveClub).toMatchObject({
      eventsCount: 2,
      playersCount: 20,
      club: { id: 'a' },
    });
  });

  it('compares the latest four dailies with the previous four', () => {
    const result = getDailyInsights([
      daily('1', '2026-06-01', 'a', 8),
      daily('2', '2026-06-08', 'a', 10),
      daily('3', '2026-06-15', 'a', 12),
      daily('4', '2026-06-22', 'a', 10),
      daily('5', '2026-07-01', 'a', 12),
      daily('6', '2026-07-08', 'a', 14),
      daily('7', '2026-07-15', 'a', 16),
      daily('8', '2026-07-22', 'a', 14),
    ]);

    expect(result.attendanceTrend).toEqual({
      previousAverage: 10,
      recentAverage: 14,
      difference: 4,
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
