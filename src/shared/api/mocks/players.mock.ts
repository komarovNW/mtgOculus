import type {
  DashboardFilters,
  PlayerDetailsResponse,
  PlayerListItem,
  PlayerMatchItem,
  PlayersListQuery,
  PlayersListResponse,
} from '@/shared/api/types';
import { createEmptyPlayersListResponse, throwEmptyScenarioDetailError } from '@/shared/api/mocks/empty';
import { buildTournamentDetails, filterTournaments, getDeckById, getPlayerById, hydrateRounds, hydrateStandings, paginate, resolveAppliedFilters, sortTournamentsByDate, uniqueById, wait } from '@/shared/api/mocks/helpers';
import { env } from '@/shared/config/env';

function buildPlayerRows(filters: Partial<DashboardFilters>): PlayerListItem[] {
  const tournaments = filterTournaments(filters);
  const standings = tournaments.flatMap(hydrateStandings);
  const playerMap = new Map<string, PlayerListItem & { deckCounts: Map<string, number> }>();

  standings.forEach((standing) => {
    const current = playerMap.get(standing.player.id) ?? {
      player: standing.player,
      tournamentsCount: 0,
      matchesCount: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      matchWinRate: 0,
      bestRank: Number.POSITIVE_INFINITY,
      isSmallSample: true,
      deckCounts: new Map<string, number>(),
    };

    current.tournamentsCount += 1;
    current.matchWins += standing.matchWins;
    current.matchLosses += standing.matchLosses;
    current.matchDraws += standing.matchDraws;
    current.matchesCount = current.matchWins + current.matchLosses + current.matchDraws;
    current.matchWinRate = current.matchesCount === 0 ? 0 : (current.matchWins / current.matchesCount) * 100;
    current.bestRank = Math.min(current.bestRank ?? Number.POSITIVE_INFINITY, standing.rank);
    current.isSmallSample = current.matchesCount < 5;
    if (standing.deck) {
      current.deckCounts.set(standing.deck.id, (current.deckCounts.get(standing.deck.id) ?? 0) + 1);
    }

    playerMap.set(standing.player.id, current);
  });

  return [...playerMap.values()].map((item) => ({
    player: item.player,
    tournamentsCount: item.tournamentsCount,
    matchesCount: item.matchesCount,
    matchWins: item.matchWins,
    matchLosses: item.matchLosses,
    matchDraws: item.matchDraws,
    matchWinRate: item.matchWinRate,
    bestRank: Number.isFinite(item.bestRank ?? Number.POSITIVE_INFINITY) ? item.bestRank : null,
    mostPlayedDeck: [...item.deckCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
      ? getDeckById([...item.deckCounts.entries()].sort((left, right) => right[1] - left[1])[0][0])
      : undefined,
    isSmallSample: item.isSmallSample,
  }));
}

export async function getPlayersMock(query: PlayersListQuery): Promise<PlayersListResponse> {
  if (env.useEmptyMocks) {
    return wait(createEmptyPlayersListResponse(query));
  }

  const rows = buildPlayerRows(query);
  const searchTerm = query.search?.toLowerCase();
  const filteredRows = searchTerm
    ? rows.filter((row) => row.player.name.toLowerCase().includes(searchTerm))
    : rows;

  const sortField = query.sort ?? 'matchWinRate';
  const order = query.order ?? (sortField === 'name' || sortField === 'bestRank' ? 'asc' : 'desc');
  const sortedRows = [...filteredRows].sort((left, right) => {
    const leftValue =
      sortField === 'name'
        ? left.player.name
        : sortField === 'bestRank'
          ? left.bestRank ?? Number.POSITIVE_INFINITY
          : left[sortField];
    const rightValue =
      sortField === 'name'
        ? right.player.name
        : sortField === 'bestRank'
          ? right.bestRank ?? Number.POSITIVE_INFINITY
          : right[sortField];

    if (leftValue < rightValue) {
      return order === 'asc' ? -1 : 1;
    }

    if (leftValue > rightValue) {
      return order === 'asc' ? 1 : -1;
    }

    return left.player.name.localeCompare(right.player.name);
  });

  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const result = paginate(sortedRows, page, limit);

  return wait({
    appliedFilters: resolveAppliedFilters(query),
    pagination: result.pagination,
    items: result.items,
  });
}

export async function getPlayerDetailsMock(id: string, filters: Partial<DashboardFilters>): Promise<PlayerDetailsResponse> {
  if (env.useEmptyMocks) {
    return throwEmptyScenarioDetailError('Игрок');
  }

  const player = getPlayerById(id);
  const tournaments = sortTournamentsByDate(
    filterTournaments(filters).filter((tournament) =>
      hydrateStandings(tournament).some((standing) => standing.player.id === id),
    ),
  );
  const standings = tournaments
    .map((tournament) => ({
      tournament,
      standing: hydrateStandings(tournament).find((item) => item.player.id === id)!,
    }))
    .filter((item) => item.standing);

  const summary = {
    tournamentsCount: standings.length,
    matchesCount: standings.reduce((sum, item) => sum + item.standing.matchWins + item.standing.matchLosses + item.standing.matchDraws, 0),
    matchWins: standings.reduce((sum, item) => sum + item.standing.matchWins, 0),
    matchLosses: standings.reduce((sum, item) => sum + item.standing.matchLosses, 0),
    matchDraws: standings.reduce((sum, item) => sum + item.standing.matchDraws, 0),
    matchWinRate: 0,
    gameWins: standings.reduce((sum, item) => sum + item.standing.matchWins * 2, 0),
    gameLosses: standings.reduce((sum, item) => sum + item.standing.matchLosses, 0),
    gameDraws: 0,
    gameWinRate: 0,
    bestRank: standings.length > 0 ? Math.min(...standings.map((item) => item.standing.rank)) : null,
    averageRank:
      standings.length > 0
        ? standings.reduce((sum, item) => sum + item.standing.rank, 0) / standings.length
        : null,
    uniqueDecksCount: uniqueById(
      standings.flatMap((item) => (item.standing.deck ? [item.standing.deck] : [])),
    ).length,
    isSmallSample: true,
  };

  summary.matchWinRate = summary.matchesCount === 0 ? 0 : (summary.matchWins / summary.matchesCount) * 100;
  summary.gameWinRate =
    summary.gameWins + summary.gameLosses + summary.gameDraws === 0
      ? 0
      : (summary.gameWins / (summary.gameWins + summary.gameLosses + summary.gameDraws)) * 100;
  summary.isSmallSample = summary.matchesCount < 5;

  const tournamentRows = standings.map((item) => ({
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
    deck: item.standing.deck,
    rank: item.standing.rank,
    record: item.standing.record,
    points: item.standing.points,
    omw: item.standing.omw,
    gw: item.standing.gw,
    ogw: item.standing.ogw,
  }));

  const deckMap = new Map<string, PlayerDetailsResponse['decks'][number]>();

  standings.forEach((item) => {
    if (!item.standing.deck) {
      return;
    }

    const current = deckMap.get(item.standing.deck.id) ?? {
      deck: item.standing.deck,
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

    deckMap.set(item.standing.deck.id, current);
  });

  const decks = [...deckMap.values()].map((item) => ({
    ...item,
    bestRank: Number.isFinite(item.bestRank ?? Number.POSITIVE_INFINITY) ? item.bestRank : null,
  }));

  const recentMatches = tournaments.flatMap((tournament) =>
    hydrateRounds(tournament).flatMap((round) =>
      round.matches
        .filter((match) => match.playerA.id === id || match.playerB.id === id)
        .map((match): PlayerMatchItem => {
          const isPlayerA = match.playerA.id === id;
          const playerScore = isPlayerA ? match.playerA.score : match.playerB.score;
          const opponentScore = isPlayerA ? match.playerB.score : match.playerA.score;
          const result: PlayerMatchItem['result'] =
            playerScore === opponentScore ? 'draw' : playerScore > opponentScore ? 'win' : 'loss';

          return {
            tournament: {
              id: tournament.id,
              title: tournament.title,
              date: tournament.date,
              format: buildTournamentDetails(tournament).format,
            },
            roundNumber: round.roundNumber,
            tableNumber: match.tableNumber,
            playerDeck: isPlayerA ? match.playerA.deck : match.playerB.deck,
            opponent: isPlayerA ? { id: match.playerB.id, name: match.playerB.name } : { id: match.playerA.id, name: match.playerA.name },
            opponentDeck: isPlayerA ? match.playerB.deck : match.playerA.deck,
            playerScore,
            opponentScore,
            scoreText: match.scoreText,
            result,
          };
        }),
    ),
  );

  return wait({
    appliedFilters: resolveAppliedFilters(filters),
    player,
    summary,
    tournaments: tournamentRows,
    decks,
    recentMatches,
  });
}
