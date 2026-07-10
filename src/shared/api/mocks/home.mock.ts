import type { DashboardFilters, DeckShort, HomeResponse } from '@/shared/api/types';
import { createEmptyHomeResponse } from '@/shared/api/mocks/empty';
import {
  buildTournamentDetails,
  filterTournaments,
  hydrateRounds,
  hydrateStandings,
  resolveAppliedFilters,
  sortTournamentsByDate,
  uniqueById,
  wait,
} from '@/shared/api/mocks/helpers';
import { env } from '@/shared/config/env';

export async function getHomeMock(filters: Partial<DashboardFilters>): Promise<HomeResponse> {
  if (env.useEmptyMocks) {
    return wait(createEmptyHomeResponse(filters));
  }

  const appliedFilters = resolveAppliedFilters(filters);
  const tournaments = sortTournamentsByDate(filterTournaments(filters));
  const standings = tournaments.flatMap(hydrateStandings);
  const rounds = tournaments.flatMap(hydrateRounds);

  const summary = {
    tournamentsCount: tournaments.length,
    tournamentPlayersCount: standings.length,
    uniquePlayersCount: uniqueById(standings.map((item) => item.player)).length,
    matchesCount: tournaments.reduce(
      (sum, tournament) => sum + tournament.rounds.reduce((roundSum, round) => roundSum + round.matches.length, 0),
      0,
    ),
    uniqueDecksCount: uniqueById(
      standings.flatMap((item) => (item.deck ? [item.deck] : [])),
    ).length,
  };

  const recentTournaments = tournaments.slice(0, 5).map(buildTournamentDetails);

  const deckStats = new Map<
    string,
    {
      deck: DeckShort;
      playersCount: number;
      tournaments: Set<string>;
      wins: number;
      losses: number;
      draws: number;
      bestRank: number;
    }
  >();

  const playerStats = new Map<
    string,
    {
      player: (typeof standings)[number]['player'];
      tournaments: Set<string>;
      wins: number;
      losses: number;
      draws: number;
      bestRank: number;
      decks: Map<string, number>;
    }
  >();

  tournaments.forEach((tournament) => {
    hydrateStandings(tournament).forEach((standing) => {
      if (standing.deck) {
        const deckEntry = deckStats.get(standing.deck.id) ?? {
          deck: standing.deck,
          playersCount: 0,
          tournaments: new Set<string>(),
          wins: 0,
          losses: 0,
          draws: 0,
          bestRank: Number.POSITIVE_INFINITY,
        };

        deckEntry.playersCount += 1;
        deckEntry.tournaments.add(tournament.id);
        deckEntry.wins += standing.matchWins;
        deckEntry.losses += standing.matchLosses;
        deckEntry.draws += standing.matchDraws;
        deckEntry.bestRank = Math.min(deckEntry.bestRank, standing.rank);
        deckStats.set(standing.deck.id, deckEntry);
      }

      const playerEntry = playerStats.get(standing.player.id) ?? {
        player: standing.player,
        tournaments: new Set<string>(),
        wins: 0,
        losses: 0,
        draws: 0,
        bestRank: Number.POSITIVE_INFINITY,
        decks: new Map<string, number>(),
      };

      playerEntry.tournaments.add(tournament.id);
      playerEntry.wins += standing.matchWins;
      playerEntry.losses += standing.matchLosses;
      playerEntry.draws += standing.matchDraws;
      playerEntry.bestRank = Math.min(playerEntry.bestRank, standing.rank);
      if (standing.deck) {
        playerEntry.decks.set(standing.deck.id, (playerEntry.decks.get(standing.deck.id) ?? 0) + 1);
      }
      playerStats.set(standing.player.id, playerEntry);
    });
  });

  const deckMetagame = [...deckStats.values()]
    .map((item) => ({
      deck: item.deck,
      playersCount: item.playersCount,
      tournamentsCount: item.tournaments.size,
      metaShare: summary.tournamentPlayersCount === 0 ? 0 : (item.playersCount / summary.tournamentPlayersCount) * 100,
      bestRank: Number.isFinite(item.bestRank) ? item.bestRank : undefined,
    }))
    .sort((left, right) => right.playersCount - left.playersCount || left.deck.name.localeCompare(right.deck.name))
    .slice(0, 10);

  const deckPerformance = [...deckStats.values()]
    .map((item) => {
      const matchesCount = item.wins + item.losses + item.draws;
      return {
        deck: item.deck,
        matchesCount,
        matchWins: item.wins,
        matchLosses: item.losses,
        matchDraws: item.draws,
        matchWinRate: matchesCount === 0 ? 0 : (item.wins / matchesCount) * 100,
        bestRank: Number.isFinite(item.bestRank) ? item.bestRank : null,
        isSmallSample: matchesCount < 5,
      };
    })
    .sort((left, right) => right.matchWinRate - left.matchWinRate || right.matchesCount - left.matchesCount);

  const topPlayers = [...playerStats.values()]
    .map((item) => {
      const matchesCount = item.wins + item.losses + item.draws;
      const mostPlayedDeckId = [...item.decks.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];

      return {
        player: item.player,
        tournamentsCount: item.tournaments.size,
        matchesCount,
        matchWins: item.wins,
        matchLosses: item.losses,
        matchDraws: item.draws,
        matchWinRate: matchesCount === 0 ? 0 : (item.wins / matchesCount) * 100,
        bestRank: Number.isFinite(item.bestRank) ? item.bestRank : null,
        mostPlayedDeck: mostPlayedDeckId ? deckPerformance.find((entry) => entry.deck.id === mostPlayedDeckId)?.deck : undefined,
        isSmallSample: matchesCount < 5,
      };
    })
    .sort((left, right) => right.matchWinRate - left.matchWinRate || right.matchesCount - left.matchesCount)
    .slice(0, 10);

  const matchupStats = new Map<
    string,
    {
      deckA: DeckShort;
      deckB: DeckShort;
      matchesCount: number;
      deckAWins: number;
      deckBWins: number;
      draws: number;
    }
  >();

  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (!match.playerA.deck || !match.playerB.deck) {
        return;
      }

      const entries = [match.playerA.deck, match.playerB.deck].sort((left, right) => left.id.localeCompare(right.id));
      const [deckA, deckB] = entries;
      const key = `${deckA.id}::${deckB.id}`;
      const current = matchupStats.get(key) ?? {
        deckA,
        deckB,
        matchesCount: 0,
        deckAWins: 0,
        deckBWins: 0,
        draws: 0,
      };

      current.matchesCount += 1;

      const winningDeckId = match.winnerPlayerId
        ? match.playerA.id === match.winnerPlayerId
          ? match.playerA.deck.id
          : match.playerB.deck.id
        : undefined;

      if (!winningDeckId) {
        current.draws += 1;
      } else if (winningDeckId === current.deckA.id) {
        current.deckAWins += 1;
      } else {
        current.deckBWins += 1;
      }

      matchupStats.set(key, current);
    });
  });

  const popularMatchups = [...matchupStats.values()]
    .map((item) => ({
      ...item,
      deckAWinRate: item.matchesCount === 0 ? 0 : (item.deckAWins / item.matchesCount) * 100,
      isSmallSample: item.matchesCount < 5,
    }))
    .sort((left, right) => right.matchesCount - left.matchesCount || right.deckAWinRate - left.deckAWinRate)
    .slice(0, 10);

  return wait({
    appliedFilters,
    summary,
    recentTournaments,
    deckMetagame,
    deckPerformance,
    topPlayers,
    popularMatchups,
  });
}
