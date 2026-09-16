import type { TournamentListItem } from '@/shared/api/types';

export function getDailyInsights(items: TournamentListItem[]) {
  const chronologicalItems = [...items].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const biggestDaily = [...items].sort(
    (left, right) =>
      right.playersCount - left.playersCount ||
      right.matchesCount - left.matchesCount,
  )[0];
  const latestDaily = [...items].sort((left, right) =>
    right.date.localeCompare(left.date),
  )[0];
  const averagePlayers = items.length
    ? items.reduce((sum, item) => sum + item.playersCount, 0) / items.length
    : 0;
  const comparisonItems = chronologicalItems.slice(-8);
  const attendanceTrend = comparisonItems.length === 8
    ? (() => {
        const previous = comparisonItems.slice(0, 4);
        const recent = comparisonItems.slice(4);
        const previousAverage = previous.reduce((sum, item) => sum + item.playersCount, 0) / previous.length;
        const recentAverage = recent.reduce((sum, item) => sum + item.playersCount, 0) / recent.length;

        return {
          previousAverage,
          recentAverage,
          difference: recentAverage - previousAverage,
        };
      })()
    : undefined;
  const clubStats = new Map<
    string,
    { club: TournamentListItem['club']; eventsCount: number; playersCount: number }
  >();

  items.forEach((item) => {
    const current = clubStats.get(item.club.id);

    clubStats.set(item.club.id, {
      club: item.club,
      eventsCount: (current?.eventsCount ?? 0) + 1,
      playersCount: (current?.playersCount ?? 0) + item.playersCount,
    });
  });

  const mostActiveClub = [...clubStats.values()].sort(
    (left, right) =>
      right.eventsCount - left.eventsCount ||
      right.playersCount - left.playersCount,
  )[0];

  return {
    averagePlayers,
    attendanceTrend,
    biggestDaily,
    latestDaily,
    mostActiveClub,
  };
}

export function getMonthlyAttendance(items: TournamentListItem[]) {
  const months = new Map<
    string,
    { month: string; eventsCount: number; playersCount: number }
  >();

  items.forEach((item) => {
    const month = item.date.slice(0, 7);
    const current = months.get(month);

    months.set(month, {
      month,
      eventsCount: (current?.eventsCount ?? 0) + 1,
      playersCount: (current?.playersCount ?? 0) + item.playersCount,
    });
  });

  return [...months.values()]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((item) => ({
      month: item.month,
      eventsCount: item.eventsCount,
      averagePlayers: item.playersCount / item.eventsCount,
    }));
}
