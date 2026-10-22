import { fireEvent, render, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { tournamentPreviews } from '@/dev/tournament-preview/fixtures';
import { TournamentDetailPage } from '@/pages/tournament-detail/TournamentDetailPage';
import { getDeckQualificationCounts, getPlayerTournamentMatches } from '@/shared/lib/tournamentExploration';
import { TestProviders } from './test-utils';

afterEach(() => vi.unstubAllEnvs());

it('searches players, filters the actual top and expands their Swiss and playoff matches', async () => {
  vi.stubEnv('VITE_MOCK_TOURNAMENTS', 'true');
  render(<TestProviders initialEntry="/tournaments/900003"><Routes><Route path="/tournaments/:id" element={<TournamentDetailPage />} /></Routes></TestProviders>);
  await screen.findByRole('heading', { name: 'Большой кубок' });
  fireEvent.click(screen.getByRole('button', { name: 'Только топ-8' }));
  expect(screen.getByText(/Показано 8 из 109/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Найти игрока'), { target: { value: 'егоров НИКИТА' } });
  expect(screen.getByText(/Показано 1 из 109/)).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Никита Егоров' }).length).toBeGreaterThan(0);
  const toggle = screen.getByRole('button', { name: 'Показать матчи игрока Никита Егоров' });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('heading', { name: 'Матчи' })).toBeInTheDocument();
  expect(screen.queryByText('Профиль игрока →')).not.toBeInTheDocument();
  const matches = screen.getByRole('region', { name: 'Матчи: Никита Егоров' });
  expect(within(matches).getByText('Четвертьфинал')).toBeInTheDocument();
  expect(within(matches).getByText('Финал')).toBeInTheDocument();
  expect(within(matches).getAllByRole('row')).toHaveLength(11);
  fireEvent.click(toggle);
  expect(screen.queryByRole('region', { name: 'Матчи: Никита Егоров' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Найти игрока'), { target: { value: 'несуществующий игрок' } });
  expect(screen.getByText(/Нет игроков по выбранным условиям/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить поиск и фильтр' }));
  expect(screen.getByText(/Показано 109 из 109/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Метагейм турнира' }));
  expect(screen.getByRole('columnheader', { name: /В топ-8/ })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /Лучшее место/ })).toBeInTheDocument();
});

it('orients scores including draws and keeps BYE distinct from played matches', () => {
  const playoff = tournamentPreviews[0].details;
  const finalistId = playoff.playoff!.at(-1)!.matches[0].playerB.id;
  expect(getPlayerTournamentMatches(playoff, finalistId).at(-1)).toMatchObject({ stage: 'Финал', score: '1-2-1', result: 'Поражение' });
  const swiss = tournamentPreviews[1].details;
  expect(getPlayerTournamentMatches(swiss, '7')[0]).toMatchObject({ kind: 'bye', score: 'BYE', result: 'BYE' });
  expect(getPlayerTournamentMatches(swiss, '3')[0]).toMatchObject({ result: 'Ничья' });
  const missing = structuredClone(swiss);
  missing.rounds[0].matches[0].kind = 'unknown';
  expect(getPlayerTournamentMatches(missing, '1')[0]).toMatchObject({ score: 'Нет данных', result: 'Нет данных' });
});

it('counts top participation once per player and uses the first three only without playoffs', () => {
  expect([...getDeckQualificationCounts(tournamentPreviews[0].details).values()].reduce((a, b) => a + b, 0)).toBe(4);
  expect([...getDeckQualificationCounts(tournamentPreviews[1].details).values()].reduce((a, b) => a + b, 0)).toBe(3);
  expect([...getDeckQualificationCounts(tournamentPreviews[2].details).values()].reduce((a, b) => a + b, 0)).toBe(8);
});
