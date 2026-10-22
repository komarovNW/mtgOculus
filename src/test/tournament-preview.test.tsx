import { getTournamentStandingHighlights } from '@/shared/lib/tournamentInsights';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { TournamentDetailPage } from '@/pages/tournament-detail/TournamentDetailPage';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';
import { getTournamentMockResponse } from '@/dev/tournament-preview/api';
import { tournamentPreviews } from '@/dev/tournament-preview/fixtures';
import { TestProviders } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('opens mock tournaments through the production list and detail without preview controls', async () => {
  vi.stubEnv('VITE_MOCK_TOURNAMENTS', 'true');
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<TestProviders initialEntry="/tournaments?cityId=moscow&clubId=demo-club&formatId=legacy"><Routes>
    <Route path="/tournaments" element={<TournamentsPage />} />
    <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
  </Routes></TestProviders>);
  const link = await screen.findByRole('link', { name: 'Большой кубок' });
  expect(link).toHaveAttribute('href', '/tournaments/900003?cityId=moscow&clubId=portal_moscow&formatId=legacy');
  expect(screen.queryByText('Демонстрационные турниры')).not.toBeInTheDocument();
  await userEvent.setup().click(link);
  expect(await screen.findByRole('heading', { name: 'Большой кубок' })).toBeInTheDocument();
  expect(screen.queryByText('Предпросмотр турниров')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Плей-офф' }));
  expect(screen.getByRole('heading', { name: 'Четвертьфинал' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Финал' })).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('filters and paginates the mock tournament list', () => {
  expect(getTournamentMockResponse('/tournaments', { tournamentType: 'tournament', page_size: 2 })).toMatchObject({ count: 3, next: '/tournaments?page=2' });
  expect(getTournamentMockResponse('/tournaments', { tournamentType: 'tournament', formatId: 'pauper' })).toMatchObject({ count: 0, results: [] });
  expect(getTournamentMockResponse('/tournaments', { tournamentType: 'daily' })).toBeUndefined();
});

it('keeps demo standings and totals consistent with the match results', () => {
  for (const { details } of tournamentPreviews) {
    const matches = [...details.rounds.flatMap((r) => r.matches), ...(details.playoff ?? []).flatMap((s) => s.matches)];
    expect(matches.length).toBe(details.tournament.pairingsCount);
    expect(matches.filter((m) => !m.isBye).length).toBe(details.tournament.playedMatchesCount);
    for (const entry of details.standings) {
      const swiss = details.rounds.flatMap((r) => r.matches).filter((m) => m.playerA.id === entry.player.id || m.playerB.id === entry.player.id);
      expect(swiss.filter((m) => m.winnerPlayerId === entry.player.id).length).toBe(entry.matchWins);
      expect(entry.points).toBe(entry.matchWins * 3 + entry.matchDraws);
    }
  }
  expect(tournamentPreviews[0].details.standings[0]).toMatchObject({ rank: 1, swissRank: 4 });
});

it('has 109 unique players, seven complete Swiss rounds and a complete top eight', () => {
  const { details } = tournamentPreviews.find((item) => item.id === 'demo-large')!;
  expect(details.standings).toHaveLength(109);
  expect(new Set(details.standings.map((entry) => entry.player.name)).size).toBe(109);
  expect(details.rounds).toHaveLength(7);
  const pairs = new Set<string>();
  const byes = new Set<string>();
  for (const round of details.rounds) {
    const players = round.matches.flatMap((m) => m.isBye ? [m.playerA.id] : [m.playerA.id, m.playerB.id]);
    expect(players).toHaveLength(109);
    expect(new Set(players).size).toBe(109);
    for (const m of round.matches) {
      if (m.isBye) {
        expect(byes.has(m.playerA.id)).toBe(false);
        byes.add(m.playerA.id);
      } else {
        const key = [m.playerA.id, m.playerB.id].sort().join(':');
        expect(pairs.has(key)).toBe(false);
        pairs.add(key);
      }
    }
  }
  expect(details.playoff?.map((stage) => [stage.topN, stage.matches.length])).toEqual([[8, 4], [4, 2], [2, 1]]);
  expect(details.playoff?.at(-1)?.matches[0].winnerPlayerId).toBe(details.tournament.winner?.player.id);
});


it('highlights the actual playoff field or the first three places without playoffs', () => {
  const small = tournamentPreviews[0].details;
  const large = tournamentPreviews[2].details;
  expect(getTournamentStandingHighlights(small).size).toBe(4);
  expect(getTournamentStandingHighlights(large).size).toBe(8);
  const swiss = tournamentPreviews[1].details;
  expect([...getTournamentStandingHighlights(swiss).keys()]).toEqual(swiss.standings.slice(0, 3).map((row) => row.player.id));
  const replacement = structuredClone(small);
  replacement.playoff![0].matches[0].playerA.id = 'replacement';
  const highlights = getTournamentStandingHighlights(replacement);
  expect(highlights.has('replacement')).toBe(true);
  expect(highlights.has(small.playoff![0].matches[0].playerA.id)).toBe(false);
  expect(getTournamentStandingHighlights({ ...swiss, tournament: { ...swiss.tournament, type: 'daily' } }).size).toBe(0);
});
