import type { DashboardFilters, DeckDetailsResponse, DeckListItem, DecksListQuery, DecksListResponse } from '@/shared/api/types';
import { createEmptyDecksListResponse, throwEmptyScenarioDetailError } from '@/shared/api/mocks/empty';
import { buildTournamentDetails, filterTournaments, getDeckById, getFormatById, hydrateRounds, hydrateStandings, paginate, resolveAppliedFilters, sortTournamentsByDate, uniqueById, wait } from '@/shared/api/mocks/helpers';
import { env } from '@/shared/config/env';

function buildDeckRows(filters: Partial<DashboardFilters>): DeckListItem[] {
  const tournaments = filterTournaments(filters);
  const deckMap = new Map<string, DeckListItem & { tournaments: Set<string> }>();

  tournaments.forEach((tournament) => {
    hydrateStandings(tournament).forEach((standing) => {
      if (!standing.deck) {
        return;
      }

      const current = deckMap.get(standing.deck.id) ?? {
        deck: standing.deck,
        format: getFormatById(tournament.formatId)!,
        tournamentsCount: 0,
        tournaments: new Set<string>(),
        playersCount: 0,
        matchesCount: 0,
        matchWins: 0,
        matchLosses: 0,
        matchDraws: 0,
        matchWinRate: 0,
        bestRank: Number.POSITIVE_INFINITY,
        isSmallSample: true,
      };

      current.tournaments.add(tournament.id);
      current.tournamentsCount = current.tournaments.size;
      current.playersCount += 1;
      current.matchWins += standing.matchWins;
      current.matchLosses += standing.matchLosses;
      current.matchDraws += standing.matchDraws;
      current.matchesCount = current.matchWins + current.matchLosses + current.matchDraws;
      current.matchWinRate = current.matchesCount === 0 ? 0 : (current.matchWins / current.matchesCount) * 100;
      current.bestRank = Math.min(current.bestRank ?? Number.POSITIVE_INFINITY, standing.rank);
      current.isSmallSample = current.matchesCount < 5;

      deckMap.set(standing.deck.id, current);
    });
  });

  return [...deckMap.values()].map((item) => ({
    deck: item.deck,
    format: item.format,
    tournamentsCount: item.tournamentsCount,
    playersCount: item.playersCount,
    matchesCount: item.matchesCount,
    matchWins: item.matchWins,
    matchLosses: item.matchLosses,
    matchDraws: item.matchDraws,
    matchWinRate: item.matchWinRate,
    bestRank: Number.isFinite(item.bestRank ?? Number.POSITIVE_INFINITY) ? item.bestRank : null,
    isSmallSample: item.isSmallSample,
  }));
}

export async function getDecksMock(query: DecksListQuery): Promise<DecksListResponse> {
  if (env.useEmptyMocks) {
    return wait(createEmptyDecksListResponse(query));
  }

  const rows = buildDeckRows(query);
  const sort = query.sort ?? 'playersCount_desc';
  const sortedRows = [...rows].sort((left, right) => {
    switch (sort) {
      case 'matchWinRate_desc':
        return right.matchWinRate - left.matchWinRate || right.matchesCount - left.matchesCount;
      case 'matchesCount_desc':
        return right.matchesCount - left.matchesCount || right.matchWinRate - left.matchWinRate;
      case 'bestRank_asc':
        return (left.bestRank ?? Number.POSITIVE_INFINITY) - (right.bestRank ?? Number.POSITIVE_INFINITY);
      case 'name_asc':
        return left.deck.name.localeCompare(right.deck.name);
      case 'playersCount_desc':
      default:
        return right.playersCount - left.playersCount || right.matchWinRate - left.matchWinRate;
    }
  });

  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const result = paginate(sortedRows, page, limit);

  return wait({
    items: result.items,
    pagination: result.pagination,
    appliedFilters: resolveAppliedFilters(query),
  });
}

export async function getDeckDetailsMock(id: string, filters: Partial<DashboardFilters>): Promise<DeckDetailsResponse> {
  if (env.useEmptyMocks) {
    return throwEmptyScenarioDetailError('Колода');
  }

  const deck = getDeckById(id);
  const tournaments = sortTournamentsByDate(
    filterTournaments(filters).filter((tournament) =>
      hydrateStandings(tournament).some((standing) => standing.deck?.id === id),
    ),
  );

  const deckStandings = tournaments.flatMap((tournament) =>
    hydrateStandings(tournament)
      .filter((standing) => standing.deck?.id === id)
      .map((standing) => ({ tournament, standing })),
  );

  const summary = {
    tournamentsCount: uniqueById(deckStandings.map((item) => ({ id: item.tournament.id }))).length,
    playersCount: deckStandings.length,
    uniquePlayersCount: uniqueById(deckStandings.map((item) => item.standing.player)).length,
    matchesCount: deckStandings.reduce((sum, item) => sum + item.standing.matchWins + item.standing.matchLosses + item.standing.matchDraws, 0),
    matchWins: deckStandings.reduce((sum, item) => sum + item.standing.matchWins, 0),
    matchLosses: deckStandings.reduce((sum, item) => sum + item.standing.matchLosses, 0),
    matchDraws: deckStandings.reduce((sum, item) => sum + item.standing.matchDraws, 0),
    matchWinRate: 0,
    bestRank: deckStandings.length > 0 ? Math.min(...deckStandings.map((item) => item.standing.rank)) : null,
    isSmallSample: true,
  };

  summary.matchWinRate = summary.matchesCount === 0 ? 0 : (summary.matchWins / summary.matchesCount) * 100;
  summary.isSmallSample = summary.matchesCount < 5;

  const tournamentResults = deckStandings.map((item) => ({
    tournament: {
      id: item.tournament.id,
      title: item.tournament.title,
      date: item.tournament.date,
      type: item.tournament.type,
      city: buildTournamentDetails(item.tournament).city,
      club: buildTournamentDetails(item.tournament).club,
      format: buildTournamentDetails(item.tournament).format,
      playersCount: item.tournament.standings.length,
    },
    player: item.standing.player,
    rank: item.standing.rank,
    record: item.standing.record,
    points: item.standing.points,
  }));

  const playerMap = new Map<string, DeckDetailsResponse['players'][number]>();

  deckStandings.forEach((item) => {
    const current = playerMap.get(item.standing.player.id) ?? {
      player: item.standing.player,
      tournamentsCount: 0,
      matchesCount: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      matchWinRate: 0,
      bestRank: Number.POSITIVE_INFINITY,
      isSmallSample: true,
    };

    current.tournamentsCount += 1;
    current.matchWins += item.standing.matchWins;
    current.matchLosses += item.standing.matchLosses;
    current.matchDraws += item.standing.matchDraws;
    current.matchesCount = current.matchWins + current.matchLosses + current.matchDraws;
    current.matchWinRate = current.matchesCount === 0 ? 0 : (current.matchWins / current.matchesCount) * 100;
    current.bestRank = Math.min(current.bestRank ?? Number.POSITIVE_INFINITY, item.standing.rank);
    current.isSmallSample = current.matchesCount < 5;

    playerMap.set(item.standing.player.id, current);
  });

  const players = [...playerMap.values()].map((item) => ({
    ...item,
    bestRank: Number.isFinite(item.bestRank ?? Number.POSITIVE_INFINITY) ? item.bestRank : null,
  }));

  const matchupMap = new Map<string, DeckDetailsResponse['matchups'][number]>();

  tournaments.forEach((tournament) => {
    hydrateRounds(tournament).forEach((round) => {
      round.matches.forEach((match) => {
        const isPlayerADeck = match.playerA.deck?.id === id;
        const isPlayerBDeck = match.playerB.deck?.id === id;

        if (!isPlayerADeck && !isPlayerBDeck) {
          return;
        }

        const opponentDeck = isPlayerADeck ? match.playerB.deck : match.playerA.deck;
        if (!opponentDeck) {
          return;
        }
        const current = matchupMap.get(opponentDeck.id) ?? {
          opponentDeck,
          matchesCount: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          isSmallSample: true,
        };

        current.matchesCount += 1;

        const playerScore = isPlayerADeck ? match.playerA.score : match.playerB.score;
        const opponentScore = isPlayerADeck ? match.playerB.score : match.playerA.score;

        if (playerScore > opponentScore) {
          current.wins += 1;
        } else if (playerScore < opponentScore) {
          current.losses += 1;
        } else {
          current.draws += 1;
        }

        current.winRate = current.matchesCount === 0 ? 0 : (current.wins / current.matchesCount) * 100;
        current.isSmallSample = current.matchesCount < 5;

        matchupMap.set(opponentDeck.id, current);
      });
    });
  });

  return wait({
    deck: {
      ...deck,
      format: tournamentResults[0]?.tournament.format ?? getFormatById(deck.formatId)!,
    },
    appliedFilters: resolveAppliedFilters(filters),
    summary,
    tournamentResults,
    players,
    matchups: [...matchupMap.values()].sort((left, right) => right.matchesCount - left.matchesCount),
  });
}
