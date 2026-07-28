import { describe, expect, it } from 'vitest';
import {
  mapTournamentDetailsResponse,
  type BackendTournamentDetailsResponse,
} from '@/shared/api/backend-mappers';

describe('mapTournamentDetailsResponse', () => {
  it('does not infer BYE from a missing opponent and uses the canonical participant deck', () => {
    const response: BackendTournamentDetailsResponse = {
      tournament: {
        id: 1,
        title: 'Турнир',
        date: '2026-07-27',
        type: 'daily',
        city: { id: 'moscow', name: 'Москва' },
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
        format: { id: 'legacy', name: 'Legacy' },
        playersCount: 1,
        roundsCount: 1,
        matchesCount: 1,
        aetherhubUrl: 'https://aetherhub.com/Tourney/RoundTourney/1',
        winner: {
          player: { id: 10, name: 'Игрок' },
          deck: { id: 20, name: 'Каноническая колода' },
        },
      },
      standings: [{
        rank: 1,
        player: { id: 10, name: 'Игрок' },
        deck: { id: 20, name: 'Каноническая колода' },
        record: '1-0',
        points: 3,
        matchWins: 1,
        matchLosses: 0,
        matchDraws: 0,
      }],
      playerDecks: [{
        player: { id: 10, name: 'Игрок' },
        deck: { id: 20, name: 'Каноническая колода' },
        rank: 1,
        record: '1-0',
      }],
      rounds: [{
        roundNumber: 1,
        matches: [{
          tableNumber: 1,
          playerA: {
            id: 10,
            name: 'Игрок',
            deck: { id: 999, name: 'Старое название' },
            score: 2,
          },
          playerB: null,
          scoreText: '2-0',
          winnerPlayerId: 10,
          isBye: false,
        }],
      }],
      metagame: [{
        deck: { id: 20, name: 'Каноническая колода' },
        playersCount: 1,
        metaShare: 100,
        bestRank: 1,
      }],
    };

    const result = mapTournamentDetailsResponse(response);
    const match = result.rounds[0].matches[0];

    expect(match.isBye).toBe(false);
    expect(match.kind).toBe('unknown');
    expect(result.tournament.aetherhubUrl)
      .toBe('https://aetherhub.com/Tourney/RoundTourney/1');
    expect(match.playerB.id).toBe('player_unknown');
    expect(match.playerA.deck).toEqual(
      expect.objectContaining({
        id: '20',
        name: 'Каноническая колода',
      }),
    );
  });
});
