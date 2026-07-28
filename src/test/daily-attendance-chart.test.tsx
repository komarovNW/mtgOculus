import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TournamentListItem } from '@/shared/api/types';
import { DailyAttendanceChart } from '@/widgets/daily-attendance/DailyAttendanceChart';

function daily(id: string, date: string, playersCount: number): TournamentListItem {
  return {
    id,
    title: `Daily ${id}`,
    date,
    type: 'daily',
    city: { id: 'moscow', name: 'Москва' },
    club: { id: 'club', cityId: 'moscow', name: 'Клуб' },
    format: { id: 'legacy', name: 'Legacy' },
    playersCount,
    roundsCount: 4,
    matchesCount: playersCount * 2,
  };
}

describe('DailyAttendanceChart', () => {
  it('switches between event and monthly attendance', () => {
    render(
      <DailyAttendanceChart
        items={[
          daily('1', '2026-06-01', 8),
          daily('2', '2026-06-08', 12),
          daily('3', '2026-07-01', 15),
        ]}
      />,
    );

    expect(screen.getByText(/Количество игроков на последних 3 дейликах/))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'По месяцам' }));

    expect(screen.getByText('Среднее количество игроков на один дейлик в каждом месяце.'))
      .toBeInTheDocument();
  });
});
