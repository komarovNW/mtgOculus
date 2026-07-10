import { AppError } from '@/shared/api/client';
import {
  cities,
  clubs,
  decks,
  formats,
  players,
  tournaments,
  type FixtureTournament,
} from '@/shared/api/mocks/fixtures';
import type {
  AppliedFilters,
  Club,
  DashboardFilters,
  DeckShort,
  Format,
  Pagination,
  PlayerShort,
  TournamentDetails,
  TournamentRound,
  TournamentRoundMatch,
} from '@/shared/api/types';

export function wait<T>(value: T, ms = 240) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export function getCityById(id: string) {
  return cities.find((item) => item.id === id);
}

export function getClubById(id: string) {
  return clubs.find((item) => item.id === id);
}

export function getFormatById(id: string) {
  return formats.find((item) => item.id === id);
}

export function getPlayerById(id: string): PlayerShort {
  const player = players.find((item) => item.id === id);

  if (!player) {
    throw new AppError({
      status: 404,
      code: 'PLAYER_NOT_FOUND',
      message: 'Игрок не найден.',
    });
  }

  return player;
}

export function getDeckById(id: string): DeckShort & { formatId: string } {
  const deck = decks.find((item) => item.id === id);

  if (!deck) {
    throw new AppError({
      status: 404,
      code: 'DECK_NOT_FOUND',
      message: 'Колода не найдена.',
    });
  }

  return deck;
}

export function ensureValidFilters(filters: Partial<DashboardFilters>) {
  if (filters.cityId && !getCityById(filters.cityId)) {
    throw new AppError({
      status: 400,
      code: 'CITY_NOT_FOUND',
      message: 'Город не найден.',
    });
  }

  if (filters.formatId && !getFormatById(filters.formatId)) {
    throw new AppError({
      status: 400,
      code: 'FORMAT_NOT_FOUND',
      message: 'Формат не найден.',
    });
  }

  if (filters.clubId) {
    const club = getClubById(filters.clubId);

    if (!club) {
      throw new AppError({
        status: 400,
        code: 'CLUB_NOT_FOUND',
        message: 'Клуб не найден.',
      });
    }

    if (filters.cityId && club.cityId !== filters.cityId) {
      throw new AppError({
        status: 400,
        code: 'CLUB_NOT_FOUND_IN_CITY',
        message: 'Клуб не найден в выбранном городе.',
      });
    }
  }

  if (filters.tournamentType && !['daily', 'tournament'].includes(filters.tournamentType)) {
    throw new AppError({
      status: 400,
      code: 'INVALID_TOURNAMENT_TYPE',
      message: 'Некорректный тип турнира.',
    });
  }

  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    throw new AppError({
      status: 400,
      code: 'INVALID_DATE_RANGE',
      message: 'Некорректный период фильтрации.',
    });
  }
}

export function resolveAppliedFilters(filters: Partial<DashboardFilters>): AppliedFilters {
  ensureValidFilters(filters);

  return {
    city: filters.cityId ? getCityById(filters.cityId) ?? null : null,
    club: filters.clubId ? getClubById(filters.clubId) ?? null : null,
    format: filters.formatId ? getFormatById(filters.formatId) ?? null : null,
    tournamentType: filters.tournamentType || null,
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  };
}

export function filterTournaments(filters: Partial<DashboardFilters>) {
  ensureValidFilters(filters);

  return tournaments.filter((tournament) => {
    if (filters.cityId && tournament.cityId !== filters.cityId) {
      return false;
    }

    if (filters.clubId && tournament.clubId !== filters.clubId) {
      return false;
    }

    if (filters.formatId && tournament.formatId !== filters.formatId) {
      return false;
    }

    if (filters.tournamentType && tournament.type !== filters.tournamentType) {
      return false;
    }

    if (filters.dateFrom && tournament.date < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && tournament.date > filters.dateTo) {
      return false;
    }

    return true;
  });
}

export function sortTournamentsByDate(items: FixtureTournament[]) {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

export function buildTournamentDetails(tournament: FixtureTournament): TournamentDetails {
  const city = getCityById(tournament.cityId)!;
  const club = getClubById(tournament.clubId)!;
  const format = getFormatById(tournament.formatId)!;
  const winnerStanding = [...tournament.standings].sort((a, b) => a.rank - b.rank)[0];

  return {
    id: tournament.id,
    title: tournament.title,
    date: tournament.date,
    type: tournament.type,
    city,
    club,
    format,
    playersCount: tournament.standings.length,
    roundsCount: tournament.rounds.length,
    matchesCount: tournament.rounds.reduce((sum, round) => sum + round.matches.length, 0),
    winner: winnerStanding
      && winnerStanding.deck?.id
      ? {
          player: getPlayerById(winnerStanding.player.id),
          deck: getDeckById(winnerStanding.deck.id),
        }
      : undefined,
  };
}

export function hydrateStandings(tournament: FixtureTournament) {
  return tournament.standings.map((standing) => ({
    ...standing,
    player: getPlayerById(standing.player.id),
    deck: standing.deck?.id ? getDeckById(standing.deck.id) : undefined,
  }));
}

export function hydrateRounds(tournament: FixtureTournament): TournamentRound[] {
  return tournament.rounds.map((round) => ({
    roundNumber: round.roundNumber,
    matches: round.matches.map(
      (match): TournamentRoundMatch => ({
        tableNumber: match.tableNumber,
        playerA: {
          id: match.playerAId,
          name: getPlayerById(match.playerAId).name,
          deck: match.playerADeckId ? getDeckById(match.playerADeckId) : undefined,
          score: match.playerAScore,
        },
        playerB: {
          id: match.playerBId,
          name: getPlayerById(match.playerBId).name,
          deck: match.playerBDeckId ? getDeckById(match.playerBDeckId) : undefined,
          score: match.playerBScore,
        },
        scoreText: `${match.playerAScore}-${match.playerBScore}`,
        winnerPlayerId: match.winnerPlayerId,
      }),
    ),
  }));
}

export function getTournamentById(id: string) {
  const tournament = tournaments.find((item) => item.id === id);

  if (!tournament) {
    throw new AppError({
      status: 404,
      code: 'TOURNAMENT_NOT_FOUND',
      message: 'Турнир не найден.',
    });
  }

  return tournament;
}

export function paginate<T>(items: T[], page = 1, limit = 50) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedItems = items.slice(start, start + limit);

  const pagination: Pagination = {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };

  return {
    items: paginatedItems,
    pagination,
  };
}

export function getStandingByPlayer(
  tournament: FixtureTournament,
  playerId: string,
) {
  return hydrateStandings(tournament).find((standing) => standing.player.id === playerId);
}

export function getStandingsDeck(tournament: FixtureTournament, playerId: string) {
  return hydrateStandings(tournament).find((standing) => standing.player.id === playerId)?.deck;
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function getClubOptionsByCity(cityId: string): Club[] {
  return clubs.filter((club) => club.cityId === cityId);
}

export function getFormatForDeck(deckId: string): Format {
  const deck = getDeckById(deckId);
  return getFormatById(deck.formatId)!;
}
