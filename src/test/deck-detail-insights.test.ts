import { describe, expect, it } from 'vitest';
import type { DeckDetailsResponse } from '@/shared/api/types';
import {
  getDeckDetailInsights,
  getDeckMonthlyActivity,
  isEstablishedDeckPlayer,
  isEstablishedMatchup,
} from '@/shared/lib/deckDetailInsights';

const baseDetail: DeckDetailsResponse = {
  deck: {
    id: 'deck',
    name: 'Test deck',
    format: { id: 'legacy', name: 'Legacy' },
  },
  appliedFilters: {},
  summary: {
    tournamentsCount: 10,
    playersCount: 3,
    uniquePlayersCount: 2,
    matchesCount: 34,
    matchWins: 20,
    matchLosses: 13,
    matchDraws: 1,
    matchWinRate: 58.82,
    bestRank: 1,
    isSmallSample: true,
  },
  tournamentResults: [
    {
      tournament: {
        id: 'one',
        title: 'January event',
        date: '2026-01-10',
        type: 'daily',
        city: { id: 'moscow', name: 'Москва', country: 'Россия' },
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
        format: { id: 'legacy', name: 'Legacy' },
        playersCount: 20,
      },
      player: { id: 'one', name: 'Первый' },
      rank: 3,
      record: '10-5',
      points: 30,
    },
    {
      tournament: {
        id: 'two',
        title: 'February event',
        date: '2026-02-10',
        type: 'daily',
        city: { id: 'moscow', name: 'Москва', country: 'Россия' },
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
        format: { id: 'legacy', name: 'Legacy' },
        playersCount: 24,
      },
      player: { id: 'two', name: 'Второй' },
      rank: 5,
      record: '10-8-1',
      points: 31,
    },
  ],
  players: [
    {
      player: { id: 'one', name: 'Первый' },
      tournamentsCount: 5,
      matchesCount: 20,
      matchWins: 13,
      matchLosses: 7,
      matchDraws: 0,
      matchWinRate: 65,
      bestRank: 1,
      isSmallSample: true,
    },
    {
      player: { id: 'two', name: 'Второй' },
      tournamentsCount: 4,
      matchesCount: 14,
      matchWins: 7,
      matchLosses: 6,
      matchDraws: 1,
      matchWinRate: 50,
      bestRank: 2,
      isSmallSample: false,
    },
  ],
  matchups: [
    {
      opponentDeck: { id: 'mirror', name: 'Mirror' },
      matchesCount: 12,
      wins: 6,
      losses: 6,
      draws: 0,
      winRate: 50,
      isSmallSample: false,
    },
    {
      opponentDeck: { id: 'good', name: 'Good matchup' },
      matchesCount: 10,
      wins: 8,
      losses: 2,
      draws: 0,
      winRate: 80,
      isSmallSample: true,
    },
    {
      opponentDeck: { id: 'bad', name: 'Bad matchup' },
      matchesCount: 10,
      wins: 3,
      losses: 7,
      draws: 0,
      winRate: 30,
      isSmallSample: false,
    },
    {
      opponentDeck: { id: 'tiny', name: 'Tiny matchup' },
      matchesCount: 2,
      wins: 2,
      losses: 0,
      draws: 0,
      winRate: 100,
      isSmallSample: false,
    },
  ],
};

describe('deck detail insights', () => {
  it('uses explicit sample thresholds instead of backend flags', () => {
    expect(isEstablishedDeckPlayer(baseDetail.players[0])).toBe(true);
    expect(isEstablishedDeckPlayer(baseDetail.players[1])).toBe(false);
    expect(isEstablishedMatchup(baseDetail.matchups[1])).toBe(true);
    expect(isEstablishedMatchup(baseDetail.matchups[3])).toBe(false);
    expect(getDeckDetailInsights(baseDetail).isEstablished).toBe(true);
  });

  it('chooses reliable non-mirror matchups and keeps unknown coverage explicit', () => {
    const insights = getDeckDetailInsights({
      ...baseDetail,
      deck: { ...baseDetail.deck, id: 'mirror' },
    });

    expect(insights.mostCommonMatchup?.opponentDeck.name).toBe('Mirror');
    expect(insights.bestMatchup?.opponentDeck.name).toBe('Good matchup');
    expect(insights.worstMatchup?.opponentDeck.name).toBe('Bad matchup');
    expect(insights.knownMatchupsCount).toBe(34);
    expect(insights.unknownMatchupsCount).toBe(0);
  });

  it('aggregates complete tournament history by month', () => {
    expect(getDeckMonthlyActivity(baseDetail.tournamentResults)).toEqual([
      expect.objectContaining({
        month: '2026-01',
        tournamentsCount: 1,
        participationsCount: 1,
        matchesCount: 15,
        wins: 10,
      }),
      expect.objectContaining({
        month: '2026-02',
        tournamentsCount: 1,
        participationsCount: 1,
        matchesCount: 19,
        wins: 10,
      }),
    ]);

    const insights = getDeckDetailInsights(baseDetail);

    expect(insights.isTournamentHistoryComplete).toBe(true);
    expect(insights.isPlayerHistoryComplete).toBe(true);
    expect(insights.monthlyActivity).toHaveLength(2);
    expect(insights.mostActivePlayer?.player.name).toBe('Первый');
  });

  it('does not present aggregates from an incomplete nested history', () => {
    const insights = getDeckDetailInsights({
      ...baseDetail,
      players: baseDetail.players.slice(0, 1),
      tournamentResults: baseDetail.tournamentResults.slice(0, 1),
    });

    expect(insights.isTournamentHistoryComplete).toBe(false);
    expect(insights.isPlayerHistoryComplete).toBe(false);
    expect(insights.monthlyActivity).toEqual([]);
    expect(insights.mostActivePlayer).toBeNull();
  });

  it('does not call equal matchup results best and worst', () => {
    const insights = getDeckDetailInsights({
      ...baseDetail,
      deck: { ...baseDetail.deck, id: 'mirror' },
      matchups: baseDetail.matchups.map((item) =>
        item.matchesCount >= 10 && item.opponentDeck.id !== 'mirror'
          ? { ...item, winRate: 50 }
          : item,
      ),
    });

    expect(insights.establishedMatchupsCount).toBe(2);
    expect(insights.hasComparableMatchups).toBe(false);
    expect(insights.bestMatchup).toBeNull();
    expect(insights.worstMatchup).toBeNull();
  });
});
