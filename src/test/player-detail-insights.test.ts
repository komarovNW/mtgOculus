import { describe, expect, it } from 'vitest';
import type {
  PlayerDetailsResponse,
  PlayerMatchItem,
} from '@/shared/api/types';
import {
  getPlayerDeckMatchups,
  getPlayerDetailInsights,
  getPlayerMonthlyActivity,
  groupPlayerMatchesByTournament,
  isEstablishedPlayerDeck,
} from '@/shared/lib/playerDetailInsights';

function createMatch(
  id: number,
  result: PlayerMatchItem['result'],
  options: {
    month?: string;
    opponentId?: string;
    opponentName?: string;
    deckId?: string;
    deckName?: string;
    formatId?: string;
    formatName?: string;
  } = {},
): PlayerMatchItem {
  return {
    tournament: {
      id: `tournament-${id}`,
      title: `Турнир ${id}`,
      date: `${options.month ?? '2026-01'}-${String((id % 20) + 1).padStart(2, '0')}`,
      format: {
        id: options.formatId ?? 'legacy',
        name: options.formatName ?? 'Legacy',
      },
    },
    roundNumber: id,
    tableNumber: 1,
    playerDeck: {
      id: options.deckId ?? 'tempo',
      name: options.deckName ?? 'Tempo',
    },
    opponent: {
      id: options.opponentId ?? 'opponent',
      name: options.opponentName ?? 'Оппонент',
    },
    opponentDeck: { id: 'other', name: 'Other' },
    playerScore: result === 'win' ? 2 : result === 'draw' ? 1 : 0,
    opponentScore: result === 'loss' ? 2 : result === 'draw' ? 1 : 0,
    scoreText: result === 'win' ? '2-0' : result === 'draw' ? '1-1' : '0-2',
    result,
  };
}

const matches = [
  ...Array.from({ length: 6 }, (_, index) =>
    createMatch(index + 1, 'win', {
      month: index < 3 ? '2026-01' : '2026-02',
      opponentId: index < 4 ? 'frequent' : `other-${index}`,
      opponentName: index < 4 ? 'Частый оппонент' : `Другой ${index}`,
    }),
  ),
  ...Array.from({ length: 4 }, (_, index) =>
    createMatch(index + 10, 'loss', {
      month: '2026-02',
      opponentId: index < 2 ? 'frequent' : `loss-${index}`,
      opponentName: index < 2 ? 'Частый оппонент' : `Соперник ${index}`,
      deckId: index === 3 ? 'control' : 'tempo',
      deckName: index === 3 ? 'Control' : 'Tempo',
    }),
  ),
  createMatch(20, 'draw', {
    month: '2026-02',
    deckId: 'control',
    deckName: 'Control',
  }),
];

const detail: PlayerDetailsResponse = {
  appliedFilters: {},
  player: { id: 'player', name: 'Игрок' },
  summary: {
    tournamentsCount: 11,
    matchesCount: 12,
    playedMatchesCount: 12,
    byesCount: 0,
    matchWins: 7,
    matchLosses: 4,
    matchDraws: 1,
    playedWins: 7,
    matchWinRate: 58.33,
    bestRank: 1,
    averageRank: 4,
    uniqueDecksCount: 2,
    isSmallSample: false,
  },
  tournaments: matches.map((match, index) => ({
    tournament: {
      ...match.tournament,
      type: 'daily',
      city: { id: 'moscow', name: 'Москва' },
      club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
      playersCount: 20,
    },
    deck: match.playerDeck,
    rank: index + 1,
    record: match.result === 'win' ? '1-0' : match.result === 'draw' ? '0-0-1' : '0-1',
    points: match.result === 'win' ? 3 : match.result === 'draw' ? 1 : 0,
  })),
  decks: [
    {
      deck: { id: 'tempo', name: 'Tempo' },
      tournamentsCount: 9,
      matchesCount: 10,
      playedMatchesCount: 10,
      byesCount: 0,
      matchWins: 6,
      matchLosses: 3,
      matchDraws: 1,
      playedWins: 6,
      matchWinRate: 60,
      bestRank: 1,
      isSmallSample: false,
    },
    {
      deck: { id: 'control', name: 'Control' },
      tournamentsCount: 2,
      matchesCount: 2,
      playedMatchesCount: 2,
      byesCount: 0,
      matchWins: 1,
      matchLosses: 1,
      matchDraws: 0,
      playedWins: 1,
      matchWinRate: 50,
      bestRank: 2,
      isSmallSample: true,
    },
  ],
  recentMatches: matches,
};

describe('player detail insights', () => {
  it('uses the backend summary while reporting incomplete match details separately', () => {
    const insights = getPlayerDetailInsights(detail);

    expect(insights.isMatchHistoryComplete).toBe(false);
    expect(insights.realMatchRecord).toEqual({
      matchesCount: 12,
      playedMatchesCount: 12,
      byesCount: 0,
      unknownResultsCount: 1,
      wins: 7,
      losses: 4,
      draws: 1,
      winRate: 58.33,
    });
    expect(insights.excludedMatchesCount).toBe(1);
  });

  it('selects the favorite and best established decks from backend rows', () => {
    const insights = getPlayerDetailInsights(detail);

    expect(insights.favoriteDeck?.deck.name).toBe('Tempo');
    expect(insights.bestEstablishedDeck?.deck.name).toBe('Tempo');
  });

  it('groups a player deck by known opposing decks from the player perspective', () => {
    const matchups = getPlayerDeckMatchups(matches, 'tempo');

    expect(matchups).toHaveLength(1);
    expect(matchups[0]).toMatchObject({
      opponentDeck: { id: 'other', name: 'Other' },
      matchesCount: 9,
      wins: 6,
      losses: 3,
      draws: 0,
      winRate: 66.66666666666666,
    });
  });

  it('aggregates activity by month without technical wins', () => {
    const activity = getPlayerMonthlyActivity(matches);

    expect(activity).toHaveLength(2);
    expect(activity[0]).toEqual(
      expect.objectContaining({
        month: '2026-01',
        tournamentsCount: 3,
        matchesCount: 3,
        wins: 3,
      }),
    );
    expect(activity[1]?.matchesCount).toBe(8);
  });

  it('groups matches by whole tournaments and keeps newest events first', () => {
    const grouped = groupPlayerMatchesByTournament([
      createMatch(1, 'win', { month: '2026-01' }),
      createMatch(2, 'loss', { month: '2026-02' }),
    ]);

    expect(grouped.map((item) => item.tournament.id)).toEqual([
      'tournament-2',
      'tournament-1',
    ]);
    expect(grouped[0]?.record).toEqual({
      matchesCount: 1,
      playedMatchesCount: 1,
      byesCount: 0,
      unknownResultsCount: 0,
      wins: 0,
      losses: 1,
      draws: 0,
      winRate: 0,
    });
  });

  it('keeps backend totals while deriving unavailable breakdowns from known history', () => {
    const insights = getPlayerDetailInsights({
      ...detail,
      recentMatches: matches.slice(0, 5),
    });

    expect(insights.isMatchHistoryComplete).toBe(false);
    expect(insights.realMatchRecord?.matchesCount).toBe(12);
    expect(insights.monthlyActivity).not.toEqual([]);
  });

  it('ignores matches from events outside the player participation list', () => {
    const extraMatch = createMatch(999, 'win');
    const insights = getPlayerDetailInsights({
      ...detail,
      recentMatches: [...matches, extraMatch],
    });

    expect(insights.isMatchHistoryComplete).toBe(false);
    expect(insights.realMatchRecord?.matchesCount).toBe(12);
    expect(insights.realMatchRecord?.wins).toBe(7);
  });

  it('does not infer results when a whole event is absent from match history', () => {
    const missingTournament = {
      ...detail.tournaments[0],
      tournament: {
        ...detail.tournaments[0]!.tournament,
        id: 'missing-tournament',
      },
      record: '3-1',
    };
    const insights = getPlayerDetailInsights({
      ...detail,
      summary: {
        ...detail.summary,
        tournamentsCount: 12,
        matchesCount: 16,
        playedMatchesCount: 16,
        matchWins: 10,
        matchLosses: 5,
        playedWins: 10,
        matchWinRate: 62.5,
      },
      tournaments: [...detail.tournaments, missingTournament],
      decks: detail.decks.map((item, index) =>
        index === 0
          ? {
              ...item,
              matchesCount: item.matchesCount + 4,
              matchWins: item.matchWins + 3,
              matchLosses: item.matchLosses + 1,
            }
          : item,
      ),
    });

    expect(insights.isMatchHistoryComplete).toBe(false);
    expect(insights.realMatchRecord).toEqual({
      matchesCount: 16,
      playedMatchesCount: 16,
      byesCount: 0,
      unknownResultsCount: 5,
      wins: 10,
      losses: 5,
      draws: 1,
      winRate: 62.5,
    });
    expect(insights.excludedMatchesCount).toBe(5);
  });

  it('does not turn a missing round into a BYE victory', () => {
    const first = { ...matches[0], result: 'loss' as const, roundNumber: 1 };
    const third = { ...first, roundNumber: 3 };
    const incompleteDetail: PlayerDetailsResponse = {
      ...detail,
      summary: {
        ...detail.summary,
        tournamentsCount: 1,
        matchesCount: 3,
        playedMatchesCount: 3,
        byesCount: 0,
        matchWins: 0,
        playedWins: 0,
        matchLosses: 3,
        matchDraws: 0,
        matchWinRate: 0,
      },
      tournaments: [{ ...detail.tournaments[0], record: '0-3-0' }],
      recentMatches: [first, third],
    };

    const insights = getPlayerDetailInsights(incompleteDetail);
    expect(insights.realMatchRecord).toMatchObject({ matchesCount: 3, wins: 0, losses: 3, byesCount: 0 });
    expect(insights.isMatchHistoryComplete).toBe(false);
    expect(insights.excludedMatchesCount).toBe(1);
    expect(insights.monthlyActivity[0]).toMatchObject({ matchesCount: 2, byesCount: 0 });
  });

  it('uses the backend sample flag for each player deck', () => {
    expect(
      isEstablishedPlayerDeck({
        ...detail.decks[0],
        matchesCount: 20,
        tournamentsCount: 5,
        isSmallSample: false,
      }),
    ).toBe(true);
    expect(isEstablishedPlayerDeck(detail.decks[0])).toBe(true);
    expect(isEstablishedPlayerDeck(detail.decks[1])).toBe(false);
  });
});
