import { fireEvent, render, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getTournamentDetails } from '@/entities/tournament/api';
import { TournamentDetailPage } from '@/pages/tournament-detail/TournamentDetailPage';
import type { TournamentDetailsResponse } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/tournament/api', () => ({
  getTournamentDetails: vi.fn(),
}));

const details: TournamentDetailsResponse = {
  tournament: {
    id: '145',
    title: 'Legacy Daily',
    date: '2026-07-24',
    type: 'daily',
    city: { id: 'moscow', name: 'Москва' },
    club: { id: 'portal', name: 'Портал', cityId: 'moscow' },
    format: { id: 'legacy', name: 'Legacy' },
    playersCount: 3,
    roundsCount: 2,
    matchesCount: 3,
    pairingsCount: 2,
    playedMatchesCount: 1,
    byesCount: 1,
    sourceUrl: 'https://aetherhub.com/Tourney/RoundTourney/145',
    winner: {
      player: { id: 'winner', name: 'Победитель' },
      deck: { id: 'forge', name: 'Forge' },
    },
  },
  standings: [
    {
      rank: 1,
      player: { id: 'winner', name: 'Победитель' },
      deck: { id: 'forge', name: 'Forge' },
      record: '2-0',
      points: 6,
      matchWins: 2,
      matchLosses: 0,
      matchDraws: 0,
      omw: 50,
      gw: 66.67,
      ogw: 50,
    },
    {
      rank: 2,
      player: { id: 'opponent', name: 'Оппонент' },
      deck: { id: 'tempo', name: 'Tempo' },
      record: '1-1',
      points: 3,
      matchWins: 1,
      matchLosses: 1,
      matchDraws: 0,
    },
  ],
  rounds: [
    {
      roundNumber: 1,
      matches: [{
        tableNumber: 1,
        playerA: { id: 'opponent', name: 'Оппонент', deck: { id: 'tempo', name: 'Tempo' }, score: 1 },
        playerB: { id: 'winner', name: 'Победитель', deck: { id: 'forge', name: 'Forge' }, score: 2 },
        scoreText: '1-2',
        winnerPlayerId: 'winner',
        isBye: false,
      }],
    },
    {
      roundNumber: 2,
      matches: [{
        tableNumber: 1,
        playerA: { id: 'winner', name: 'Победитель', deck: { id: 'forge', name: 'Forge' }, score: 2 },
        playerB: { id: 'player_bye', name: 'BYE', score: 0 },
        scoreText: '2-0',
        winnerPlayerId: 'winner',
        isBye: true,
      }],
    },
  ],
  playerDecks: [
    {
      player: { id: 'winner', name: 'Победитель' },
      deck: { id: 'forge', name: 'Forge' },
      rank: 1,
      record: '2-0',
    },
    {
      player: { id: 'opponent', name: 'Оппонент' },
      deck: { id: 'tempo', name: 'Tempo' },
      rank: 2,
      record: '1-1',
    },
    {
      player: { id: 'without-deck', name: 'Без колоды' },
      rank: 3,
      record: '0-1',
    },
  ],
  metagame: [
    {
      deck: { id: 'forge', name: 'Forge' },
      playersCount: 1,
      metaShare: 50,
      bestRank: 1,
    },
    {
      deck: { id: 'tempo', name: 'Tempo' },
      playersCount: 1,
      metaShare: 50,
      bestRank: 2,
    },
  ],
};

describe('TournamentDetailPage', () => {
  it('keeps final standings separate from Swiss records and playoff matches', async () => {
    const tournament = structuredClone(details);
    tournament.tournament.type = 'tournament';
    tournament.tournament.sourceUrl = 'https://melee.gg/Tournament/View/145';
    tournament.tournament.playoffSize = 2;
    tournament.standings[0].swissRank = 2;
    tournament.standings[1].swissRank = 1;
    tournament.playoff = [{ topN: 2, matches: [{ ...tournament.rounds[0].matches[0], scoreText: '1-2-1' }] }];
    vi.mocked(getTournamentDetails).mockResolvedValue(tournament);
    render(<TestProviders initialEntry="/tournaments/145"><Routes><Route element={<TournamentDetailPage />} path="/tournaments/:id" /></Routes></TestProviders>);
    expect(await screen.findByRole('heading', { name: 'Legacy Daily' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Открыть на Melee.gg/ }))
      .toHaveAttribute('href', 'https://melee.gg/Tournament/View/145');
    expect(screen.getByText('Топ-2')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Место в швейцарке/ })).not.toBeInTheDocument();
    expect(screen.getByText('Результат швейцарки')).toBeInTheDocument();
    expect(screen.getByText('2-1-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Плей-офф' }));
    expect(screen.getByRole('heading', { name: 'Финал' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Стол' })).not.toBeInTheDocument();
    expect(screen.queryByText('Счёт: 1-2-1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Швейцарка' }));
    expect(screen.queryByText('Счёт: 1-2-1')).not.toBeInTheDocument();
  });

  it('shows a tournament without playoffs without a playoff tab or invented winner', async () => {
    vi.mocked(getTournamentDetails).mockResolvedValue({
      ...details, tournament: { ...details.tournament, type: 'tournament', playoffSize: null, winner: undefined }, playoff: [],
    });
    render(<TestProviders initialEntry="/tournaments/145"><Routes><Route element={<TournamentDetailPage />} path="/tournaments/:id" /></Routes></TestProviders>);
    expect(await screen.findByRole('heading', { name: 'Legacy Daily' })).toBeInTheDocument();
    expect(screen.getByText('Только швейцарка')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Плей-офф' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Результат победителя' })).not.toBeInTheDocument();
  });

  it('shows honest tournament statistics and removes the duplicate deck tab', async () => {
    vi.mocked(getTournamentDetails).mockResolvedValue(details);

    render(
      <TestProviders initialEntry="/tournaments/145">
        <Routes>
          <Route
            element={<TournamentDetailPage />}
            path="/tournaments/:id"
          />
        </Routes>
      </TestProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Legacy Daily' }))
      .toBeInTheDocument();
    expect(getTournamentDetails).toHaveBeenCalledWith('145', { signal: expect.any(AbortSignal) });
    expect(screen.getByRole('link', { name: /Открыть на Aetherhub/ }))
      .toHaveAttribute(
        'href',
        'https://aetherhub.com/Tourney/RoundTourney/145',
      );
    expect(screen.getByText('1 BYE показано отдельно')).toBeInTheDocument();
    expect(screen.getByText(/Колоды указаны у 2 из 3 участников/)).toBeInTheDocument();
    expect(screen.getByText('Без колоды: 1')).toBeInTheDocument();
    expect(screen.queryByText('Самые популярные колоды')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Список колод' }))
      .not.toBeInTheDocument();

    const winnerSection = screen
      .getByRole('heading', { name: 'Результат победителя' })
      .closest('section');

    expect(winnerSection).not.toBeNull();
    expect(within(winnerSection as HTMLElement).getByText('2-1'))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Раунды и паринги' }));

    expect(screen.getByText('1 матч')).toBeInTheDocument();
    expect(screen.getByText('0 матчей · 1 BYE')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Стол' })).toBeInTheDocument();
    expect(screen.queryByText('Победа')).not.toBeInTheDocument();
  });
});
