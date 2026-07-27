import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '@/widgets/app-layout/AppLayout';

describe('AppLayout navigation', () => {
  it('preserves dashboard filters between public sections', () => {
    render(
      <MemoryRouter initialEntries={['/players?cityId=spb&formatId=&page=3']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="players" element={<div>Игроки</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Турниры' })).toHaveAttribute(
      'href',
      '/tournaments?cityId=spb&formatId=',
    );
    expect(screen.getByRole('link', { name: 'Дейлики' })).toHaveAttribute(
      'href',
      '/dailies?cityId=spb&formatId=',
    );
    expect(screen.getByRole('link', { name: 'Колоды' })).toHaveAttribute(
      'href',
      '/decks?cityId=spb&formatId=',
    );
    expect(screen.getByRole('link', { name: 'Дайджест' })).toHaveAttribute(
      'href',
      '/digest',
    );
    expect(screen.queryByRole('link', { name: 'Добавить' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'v0.2.0 · Что нового' })).toHaveAttribute(
      'href',
      '/changelog',
    );
  });
});
