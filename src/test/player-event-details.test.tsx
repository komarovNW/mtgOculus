import { tournamentPreviews } from '@/dev/tournament-preview/fixtures';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { getTournamentDetails } from '@/entities/tournament/api';
import { PlayerEventDetails } from '@/widgets/player-tournament-matches/PlayerEventDetails';
import { TestProviders } from './test-utils';

vi.mock('@/entities/tournament/api', () => ({ getTournamentDetails: vi.fn() }));

it('loads final and Swiss places and shows playoff matches from the tournament detail', async () => {
  vi.mocked(getTournamentDetails).mockResolvedValue({
    tournament: { ...tournamentPreviews[0].details.tournament, id: '1', title: 'Championship', playoffSize: 8 },
    standings: [{ ...tournamentPreviews[0].details.standings[0], rank: 1, swissRank: 4, player: { id: '7', name: 'Игрок' } }],
    rounds: [], playerDecks: [], metagame: [],
    playoff: [{ topN: 2, matches: [{ tableNumber: 1, isBye: false,
      playerA: { id: '7', name: 'Игрок', score: 2 }, playerB: { id: '8', name: 'Соперник', score: 1 },
      winnerPlayerId: '7', scoreText: '2-1-1', kind: 'played' }] }],
  });
  render(<TestProviders><PlayerEventDetails tournamentId="1" playerId="7" /></TestProviders>);
  expect(await screen.findByText(/Итоговое место: 1/)).toHaveTextContent('Место после швейцарки: 4');
  expect(screen.getByText('Финал')).toBeInTheDocument();
  expect(screen.getByText('2-1-1')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Соперник' })).toHaveAttribute('href', '/players/8');
});
