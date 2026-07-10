import type { DashboardFilters, DeckShort, TournamentDetailsResponse, TournamentListResponse } from '@/shared/api/types';
import { createEmptyTournamentListResponse, throwEmptyScenarioDetailError } from '@/shared/api/mocks/empty';
import { buildTournamentDetails, filterTournaments, getTournamentById, hydrateRounds, hydrateStandings, paginate, sortTournamentsByDate, resolveAppliedFilters, wait } from '@/shared/api/mocks/helpers';
import { env } from '@/shared/config/env';

export async function getTournamentsMock(filters: Partial<DashboardFilters> & { page?: number; limit?: number }): Promise<TournamentListResponse> {
  if (env.useEmptyMocks) {
    return wait(createEmptyTournamentListResponse(filters));
  }

  const tournaments = sortTournamentsByDate(filterTournaments(filters));
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const result = paginate(tournaments.map(buildTournamentDetails), page, limit);

  return wait({
    items: result.items,
    pagination: result.pagination,
    appliedFilters: resolveAppliedFilters(filters),
  });
}

export async function getTournamentDetailsMock(id: string): Promise<TournamentDetailsResponse> {
  if (env.useEmptyMocks) {
    return throwEmptyScenarioDetailError('Турнир');
  }

  const tournament = getTournamentById(id);
  const standings = hydrateStandings(tournament).sort((left, right) => left.rank - right.rank);
  const playerDecks = standings.map((standing) => ({
    player: standing.player,
    deck: standing.deck,
    rank: standing.rank,
    record: standing.record,
  }));
  const metagameMap = new Map<string, { deck: DeckShort; playersCount: number; bestRank: number }>();

  standings.forEach((standing) => {
    if (!standing.deck) {
      return;
    }

    const current = metagameMap.get(standing.deck.id) ?? {
      deck: standing.deck,
      playersCount: 0,
      bestRank: Number.POSITIVE_INFINITY,
    };

    current.playersCount += 1;
    current.bestRank = Math.min(current.bestRank, standing.rank);
    metagameMap.set(standing.deck.id, current);
  });

  const metagame = [...metagameMap.values()]
    .map((item) => ({
      deck: item.deck,
      playersCount: item.playersCount,
      metaShare: (item.playersCount / standings.length) * 100,
      bestRank: item.bestRank,
    }))
    .sort((left, right) => right.playersCount - left.playersCount || left.bestRank - right.bestRank);

  return wait({
    tournament: buildTournamentDetails(tournament),
    standings,
    rounds: hydrateRounds(tournament),
    playerDecks,
    metagame,
  });
}
