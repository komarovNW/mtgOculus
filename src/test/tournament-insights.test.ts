import { describe, expect, it } from 'vitest';
import type {
  DeckShort,
  TournamentDetailsResponse,
  TournamentMetagameItem,
} from '@/shared/api/types';
import { getTournamentInsights } from '@/shared/lib/tournamentInsights';

const decks: DeckShort[] = Array.from({ length: 10 }, (_, index) => ({
  id: `deck-${index + 1}`,
  name: `Колода ${index + 1}`,
}));

const metagame: TournamentMetagameItem[] = decks.map((deck, index) => ({
  deck,
  playersCount: index === 0 ? 2 : 1,
  metaShare: index === 0 ? 18.18 : 9.09,
  bestRank: index + 1,
}));

const details: TournamentDetailsResponse = {
  tournament: {
    id: 'tournament',
    title: 'Тестовый турнир',
    date: '2026-07-27',
    type: 'daily',
    city: { id: 'moscow', name: 'Москва' },
    club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
    format: { id: 'legacy', name: 'Legacy' },
    playersCount: 11,
    roundsCount: 2,
    matchesCount: 3,
    winner: {
      player: { id: 'winner', name: 'Победитель' },
      deck: decks[0],
    },
  },
  standings: [
    {
      rank: 1,
      player: { id: 'winner', name: 'Победитель' },
      deck: decks[0],
      record: '2-0',
      points: 6,
      matchWins: 2,
      matchLosses: 0,
      matchDraws: 0,
    },
  ],
  rounds: [
    {
      roundNumber: 1,
      matches: [{
        tableNumber: 1,
        playerA: { id: 'opponent', name: 'Оппонент', deck: decks[1], score: 1 },
        playerB: { id: 'winner', name: 'Победитель', deck: decks[0], score: 2 },
        scoreText: '1-2',
        winnerPlayerId: 'winner',
        isBye: false,
      }],
    },
    {
      roundNumber: 2,
      matches: [{
        tableNumber: 1,
        playerA: { id: 'winner', name: 'Победитель', deck: decks[0], score: 2 },
        playerB: { id: 'player_bye', name: 'BYE', score: 0 },
        scoreText: '2-0',
        winnerPlayerId: 'winner',
        isBye: true,
      }],
    },
  ],
  playerDecks: [
    ...decks.map((deck, index) => ({
      player: { id: `player-${index}`, name: `Игрок ${index}` },
      deck,
      rank: index + 1,
      record: '1-1',
    })),
    {
      player: { id: 'without-deck', name: 'Без колоды' },
      rank: 11,
      record: '0-2',
    },
  ],
  metagame,
};

describe('getTournamentInsights', () => {
  it('excludes byes, orients the winner score and groups the metagame tail', () => {
    const result = getTournamentInsights(details);

    expect(result.playedMatchesCount).toBe(1);
    expect(result.reportedPairingsCount).toBe(2);
    expect(result.byeCount).toBe(1);
    expect(result.uniqueDecksCount).toBe(10);
    expect(result.missingDecksCount).toBe(1);
    expect(result.singlePlayerDecksCount).toBe(9);
    expect(result.mostPopularDecks).toHaveLength(1);
    expect(result.winnerPath).toEqual([
      expect.objectContaining({ roundNumber: 1, scoreText: '2-1', isBye: false }),
      expect.objectContaining({ roundNumber: 2, scoreText: 'BYE', isBye: true }),
    ]);
    expect(result.metagameChartData).toHaveLength(8);
    expect(result.metagameChartData.at(-1)).toEqual(
      expect.objectContaining({
        id: 'other',
        name: 'Другие',
        playersCount: 3,
      }),
    );
  });
});
