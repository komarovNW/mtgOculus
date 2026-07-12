import type {
  AppliedFilters,
  City,
  Club,
  CreateTournamentResponse,
  DeckDetailsResponse,
  DeckListItem,
  DeckMatchupItem,
  DeckPlayerItem,
  DeckShort,
  DeckSummary,
  DecksListResponse,
  Format,
  HomeResponse,
  Pagination,
  PlayerDeckItem,
  PlayerDetailsResponse,
  PlayerListItem,
  PlayerMatchItem,
  PlayerShort,
  PlayerSummary,
  PlayerTournamentItem,
  PlayersListResponse,
  PopularMatchupItem,
  TopPlayerItem,
  TournamentDeckResultItem,
  TournamentDetailsResponse,
  TournamentListItem,
  TournamentListResponse,
  TournamentMatchPlayer,
  TournamentMetagameItem,
  TournamentPlayerDeckItem,
  TournamentRound,
  TournamentRoundMatch,
  TournamentStandingItem,
  TournamentType,
  RecentTournamentItem,
  DeckMetagameItem,
  DeckPerformanceItem,
  HomeSummary,
} from '@/shared/api/types';

type BackendNamedRef = {
  id: string;
  name: string;
};

type BackendCity = BackendNamedRef & {
  country?: string | null;
};

type BackendClub = BackendNamedRef & {
  cityId?: string | null;
};

type BackendFormat = BackendNamedRef;

type BackendAppliedFilters = {
  city?: BackendCity | null;
  club?: BackendClub | null;
  format?: BackendFormat | null;
  tournamentType?: TournamentType | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

type BackendPlayer = {
  id: number;
  name: string;
};

type BackendDeck = {
  id: number;
  name: string;
  archetype?: string | null;
  colors?: string[] | null;
};

type BackendWinner = {
  player?: BackendPlayer | null;
  deck?: BackendDeck | null;
} | null;

type BackendTournamentListItem = {
  id: number;
  title: string;
  date: string;
  type: TournamentType;
  city?: BackendCity | null;
  club?: BackendClub | null;
  format?: BackendFormat | null;
  playersCount: number;
  roundsCount: number;
  matchesCount: number;
  winner?: BackendWinner;
};

type BackendTournamentShort = {
  id: number;
  title: string;
  date: string;
  type: TournamentType;
  city?: BackendCity | null;
  club?: BackendClub | null;
  format?: BackendFormat | null;
  playersCount: number;
};

type BackendPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  appliedFilters?: BackendAppliedFilters | null;
};

type BackendTournamentStandingItem = {
  rank: number;
  player: BackendPlayer;
  deck?: BackendDeck | null;
  record: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omw?: number | null;
  gw?: number | null;
  ogw?: number | null;
};

type BackendRoundMatch = {
  tableNumber: number;
  playerA: {
    id: number;
    name: string;
    deck?: BackendDeck | null;
    score: number;
  };
  playerB: {
    id: number;
    name: string;
    deck?: BackendDeck | null;
    score: number;
  } | null;
  scoreText: string;
  winnerPlayerId?: number | null;
  isBye?: boolean;
};

type BackendTournamentDetailsResponse = {
  appliedFilters?: BackendAppliedFilters | null;
  tournament: BackendTournamentListItem;
  standings: BackendTournamentStandingItem[];
  rounds: Array<{
    roundNumber: number;
    matches: BackendRoundMatch[];
  }>;
  playerDecks: Array<{
    player: BackendPlayer;
    deck?: BackendDeck | null;
    rank?: number | null;
    record?: string | null;
  }>;
  metagame: Array<{
    deck: BackendDeck;
    playersCount: number;
    metaShare: number;
    bestRank: number;
  }>;
};

type BackendPlayersListItem = {
  player: BackendPlayer;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  mostPlayedDeck?: BackendDeck | null;
  isSmallSample: boolean;
};

type BackendPlayersListResponse = BackendPaginated<BackendPlayersListItem>;

type BackendPlayerDetailsResponse = {
  appliedFilters?: BackendAppliedFilters | null;
  player: BackendPlayer;
  summary: {
    tournamentsCount: number;
    matchesCount: number;
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    matchWinRate: number;
    gameWins?: number | null;
    gameLosses?: number | null;
    gameDraws?: number | null;
    gameWinRate?: number | null;
    bestRank?: number | null;
    averageRank?: number | null;
    uniqueDecksCount: number;
    isSmallSample: boolean;
  };
  tournaments: Array<{
    tournament: BackendTournamentShort;
    deck?: BackendDeck | null;
    rank: number;
    record: string;
    points: number;
    omw?: number | null;
    gw?: number | null;
    ogw?: number | null;
  }>;
  decks: Array<{
    deck: BackendDeck;
    tournamentsCount: number;
    matchesCount: number;
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    matchWinRate: number;
    bestRank?: number | null;
    isSmallSample: boolean;
  }>;
  recentMatches: Array<{
    tournament: {
      id: number;
      title: string;
      date: string;
      format?: BackendFormat | null;
    };
    roundNumber: number;
    tableNumber: number;
    playerDeck?: BackendDeck | null;
    opponent: BackendPlayer;
    opponentDeck?: BackendDeck | null;
    playerScore: number;
    opponentScore: number;
    scoreText: string;
    result: 'win' | 'loss' | 'draw';
  }>;
};

type BackendDeckListItem = {
  deck: BackendDeck;
  format?: BackendFormat | null;
  tournamentsCount: number;
  playersCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

type BackendDecksListResponse = BackendPaginated<BackendDeckListItem>;

type BackendDeckDetailsResponse = {
  appliedFilters?: BackendAppliedFilters | null;
  deck: BackendDeck & {
    format: BackendFormat;
  };
  summary: {
    tournamentsCount: number;
    playersCount: number;
    uniquePlayersCount: number;
    matchesCount: number;
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    matchWinRate: number;
    bestRank?: number | null;
    isSmallSample: boolean;
  };
  tournamentResults: Array<{
    tournament: BackendTournamentShort;
    player: BackendPlayer;
    rank: number;
    record: string;
    points: number;
  }>;
  players: Array<{
    player: BackendPlayer;
    tournamentsCount: number;
    matchesCount: number;
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    matchWinRate: number;
    bestRank?: number | null;
    isSmallSample: boolean;
  }>;
  matchups: Array<{
    opponentDeck?: BackendDeck | null;
    matchesCount: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    isSmallSample: boolean;
  }>;
};

type BackendHomeResponse = {
  appliedFilters?: BackendAppliedFilters | null;
  summary: HomeSummary;
  recentTournaments: Array<{
    id: number;
    title: string;
    date: string;
    type: TournamentType;
    city?: BackendCity | null;
    club?: BackendClub | null;
    format?: BackendFormat | null;
    playersCount: number;
    roundsCount: number;
    winner?: BackendWinner;
  }>;
  deckMetagame: Array<{
    deck: BackendDeck;
    playersCount: number;
    tournamentsCount: number;
    metaShare: number;
    bestRank?: number | null;
  }>;
  deckPerformance: Array<{
    deck: BackendDeck;
    matchesCount: number;
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    matchWinRate: number;
    bestRank?: number | null;
    isSmallSample: boolean;
  }>;
  topPlayers: BackendPlayersListItem[];
  popularMatchups: Array<{
    deckA: BackendDeck;
    deckB: BackendDeck;
    matchesCount: number;
    deckAWins: number;
    deckBWins: number;
    draws: number;
    deckAWinRate: number;
    isSmallSample: boolean;
  }>;
};

type BackendImportIssue = {
  code: string;
  message: string;
  source?: string;
};

type BackendCreateTournamentSuccess = {
  success: true;
  tournament: BackendTournamentListItem;
  warnings?: BackendImportIssue[];
};

const UNKNOWN_CITY_NAME = 'Неизвестный город';
const UNKNOWN_CLUB_NAME = 'Неизвестный клуб';
const UNKNOWN_FORMAT_NAME = 'Неизвестный формат';
const UNKNOWN_DECK_NAME = 'Колода не указана';
const BYE_PLAYER_ID = 'player_bye';

function mapCity(raw?: BackendCity | null, fallbackId = ''): City {
  return {
    id: raw?.id ?? fallbackId,
    name: raw?.name ?? (fallbackId || UNKNOWN_CITY_NAME),
    country: raw?.country || undefined,
  };
}

function mapClub(raw?: BackendClub | null, fallbackCityId = '', fallbackId = ''): Club {
  return {
    id: raw?.id ?? fallbackId,
    name: raw?.name ?? (fallbackId || UNKNOWN_CLUB_NAME),
    cityId: raw?.cityId ?? fallbackCityId,
  };
}

function mapFormat(raw?: BackendFormat | null, fallbackId = ''): Format {
  return {
    id: raw?.id ?? fallbackId,
    name: raw?.name ?? (fallbackId || UNKNOWN_FORMAT_NAME),
  };
}

function mapPlayerShort(raw?: BackendPlayer | null): PlayerShort | undefined {
  if (!raw) {
    return undefined;
  }

  return {
    id: String(raw.id),
    name: raw.name,
  };
}

function mapDeckShort(raw?: BackendDeck | null): DeckShort | undefined {
  if (!raw) {
    return undefined;
  }

  return {
    id: String(raw.id),
    name: raw.name,
    archetype: raw.archetype ?? null,
    colors: raw.colors ?? null,
  };
}

function mapDeckOrFallback(raw?: BackendDeck | null, fallbackName = UNKNOWN_DECK_NAME): DeckShort {
  return (
    mapDeckShort(raw) ?? {
      id: '',
      name: fallbackName,
      archetype: null,
      colors: null,
    }
  );
}

function mapWinner(raw?: BackendWinner): { player: PlayerShort; deck?: DeckShort | null } | undefined {
  const player = mapPlayerShort(raw?.player ?? null);

  if (!player) {
    return undefined;
  }

  return {
    player,
    deck: mapDeckShort(raw?.deck ?? null),
  };
}

function mapTournamentListItem(raw: BackendTournamentListItem): TournamentListItem {
  return {
    id: String(raw.id),
    title: raw.title,
    date: raw.date,
    type: raw.type,
    city: mapCity(raw.city),
    club: mapClub(raw.club, raw.city?.id ?? ''),
    format: mapFormat(raw.format),
    playersCount: raw.playersCount,
    roundsCount: raw.roundsCount,
    matchesCount: raw.matchesCount,
    winner: mapWinner(raw.winner),
  };
}

function mapTournamentShort(raw: BackendTournamentShort) {
  return {
    id: String(raw.id),
    title: raw.title,
    date: raw.date,
    type: raw.type,
    city: mapCity(raw.city),
    club: mapClub(raw.club, raw.city?.id ?? ''),
    format: mapFormat(raw.format),
    playersCount: raw.playersCount,
  };
}

function mapTournamentMatchPlayer(raw: BackendRoundMatch['playerA']): TournamentMatchPlayer {
  return {
    id: String(raw.id),
    name: raw.name,
    deck: mapDeckShort(raw.deck ?? null),
    score: raw.score,
  };
}

function mapAppliedFilters(raw?: BackendAppliedFilters | null): AppliedFilters {
  return {
    city: raw?.city ? mapCity(raw.city) : null,
    club: raw?.club ? mapClub(raw.club, raw.city?.id ?? '') : null,
    format: raw?.format ? mapFormat(raw.format) : null,
    tournamentType: raw?.tournamentType ?? null,
    dateFrom: raw?.dateFrom ?? null,
    dateTo: raw?.dateTo ?? null,
  };
}

function mapTournamentRoundMatch(raw: BackendRoundMatch): TournamentRoundMatch {
  return {
    tableNumber: raw.tableNumber,
    playerA: mapTournamentMatchPlayer(raw.playerA),
    playerB: raw.playerB
      ? mapTournamentMatchPlayer(raw.playerB)
      : {
          id: BYE_PLAYER_ID,
          name: 'BYE',
          deck: undefined,
          score: 0,
        },
    scoreText: raw.scoreText,
    winnerPlayerId: raw.winnerPlayerId ? String(raw.winnerPlayerId) : undefined,
  };
}

function mapPagination(raw: BackendPaginated<unknown>, page: number, pageSize: number): Pagination {
  const totalPages = raw.count > 0 ? Math.ceil(raw.count / pageSize) : 1;

  return {
    page,
    limit: pageSize,
    total: raw.count,
    totalPages,
    hasMore: Boolean(raw.next),
  };
}

export function mapHomeResponse(raw: BackendHomeResponse, appliedFilters: AppliedFilters): HomeResponse {
  return {
    appliedFilters,
    summary: raw.summary,
    recentTournaments: raw.recentTournaments.map<RecentTournamentItem>((item) => ({
      id: String(item.id),
      title: item.title,
      date: item.date,
      type: item.type,
      city: mapCity(item.city),
      club: mapClub(item.club, item.city?.id ?? ''),
      format: mapFormat(item.format),
      playersCount: item.playersCount,
      roundsCount: item.roundsCount,
      winner: mapWinner(item.winner),
    })),
    deckMetagame: raw.deckMetagame.map<DeckMetagameItem>((item) => ({
      deck: mapDeckOrFallback(item.deck),
      playersCount: item.playersCount,
      tournamentsCount: item.tournamentsCount,
      metaShare: item.metaShare,
      bestRank: item.bestRank ?? undefined,
    })),
    deckPerformance: raw.deckPerformance.map<DeckPerformanceItem>((item) => ({
      deck: mapDeckOrFallback(item.deck),
      matchesCount: item.matchesCount,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      matchWinRate: item.matchWinRate,
      bestRank: item.bestRank ?? null,
      isSmallSample: item.isSmallSample,
    })),
    topPlayers: raw.topPlayers.map<TopPlayerItem>((item) => ({
      player: mapPlayerShort(item.player)!,
      tournamentsCount: item.tournamentsCount,
      matchesCount: item.matchesCount,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      matchWinRate: item.matchWinRate,
      bestRank: item.bestRank ?? null,
      mostPlayedDeck: mapDeckShort(item.mostPlayedDeck ?? null),
      isSmallSample: item.isSmallSample,
    })),
    popularMatchups: raw.popularMatchups.map<PopularMatchupItem>((item) => ({
      deckA: mapDeckOrFallback(item.deckA),
      deckB: mapDeckOrFallback(item.deckB),
      matchesCount: item.matchesCount,
      deckAWins: item.deckAWins,
      deckBWins: item.deckBWins,
      draws: item.draws,
      deckAWinRate: item.deckAWinRate,
      isSmallSample: item.isSmallSample,
    })),
  };
}

export function mapTournamentListResponse(
  raw: BackendPaginated<BackendTournamentListItem>,
  appliedFilters: AppliedFilters,
  page: number,
  pageSize: number,
): TournamentListResponse {
  return {
    items: raw.results.map(mapTournamentListItem),
    pagination: mapPagination(raw, page, pageSize),
    appliedFilters,
  };
}

export function mapTournamentDetailsResponse(raw: BackendTournamentDetailsResponse): TournamentDetailsResponse {
  return {
    tournament: mapTournamentListItem(raw.tournament),
    standings: raw.standings.map<TournamentStandingItem>((item) => ({
      rank: item.rank,
      player: mapPlayerShort(item.player)!,
      deck: mapDeckShort(item.deck ?? null),
      record: item.record,
      points: item.points,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      omw: item.omw ?? undefined,
      gw: item.gw ?? undefined,
      ogw: item.ogw ?? undefined,
    })),
    rounds: raw.rounds.map<TournamentRound>((round) => ({
      roundNumber: round.roundNumber,
      matches: round.matches.map(mapTournamentRoundMatch),
    })),
    playerDecks: raw.playerDecks.map<TournamentPlayerDeckItem>((item) => ({
      player: mapPlayerShort(item.player)!,
      deck: mapDeckShort(item.deck ?? null),
      rank: item.rank ?? undefined,
      record: item.record ?? undefined,
    })),
    metagame: raw.metagame.map<TournamentMetagameItem>((item) => ({
      deck: mapDeckOrFallback(item.deck),
      playersCount: item.playersCount,
      metaShare: item.metaShare,
      bestRank: item.bestRank,
    })),
  };
}

export function mapPlayersListResponse(
  raw: BackendPlayersListResponse,
  appliedFilters: AppliedFilters,
  page: number,
  pageSize: number,
): PlayersListResponse {
  return {
    appliedFilters,
    pagination: mapPagination(raw, page, pageSize),
    items: raw.results.map<PlayerListItem>((item) => ({
      player: mapPlayerShort(item.player)!,
      tournamentsCount: item.tournamentsCount,
      matchesCount: item.matchesCount,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      matchWinRate: item.matchWinRate,
      bestRank: item.bestRank ?? null,
      mostPlayedDeck: mapDeckShort(item.mostPlayedDeck ?? null),
      isSmallSample: item.isSmallSample,
    })),
  };
}

export function mapPlayerDetailsResponse(
  raw: BackendPlayerDetailsResponse,
  appliedFilters: AppliedFilters,
): PlayerDetailsResponse {
  return {
    appliedFilters,
    player: mapPlayerShort(raw.player)!,
    summary: {
      tournamentsCount: raw.summary.tournamentsCount,
      matchesCount: raw.summary.matchesCount,
      matchWins: raw.summary.matchWins,
      matchLosses: raw.summary.matchLosses,
      matchDraws: raw.summary.matchDraws,
      matchWinRate: raw.summary.matchWinRate,
      gameWins: raw.summary.gameWins ?? undefined,
      gameLosses: raw.summary.gameLosses ?? undefined,
      gameDraws: raw.summary.gameDraws ?? undefined,
      gameWinRate: raw.summary.gameWinRate ?? undefined,
      bestRank: raw.summary.bestRank ?? null,
      averageRank: raw.summary.averageRank ?? null,
      uniqueDecksCount: raw.summary.uniqueDecksCount,
      isSmallSample: raw.summary.isSmallSample,
    } satisfies PlayerSummary,
    tournaments: raw.tournaments.map<PlayerTournamentItem>((item) => ({
      tournament: mapTournamentShort(item.tournament),
      deck: mapDeckShort(item.deck ?? null),
      rank: item.rank,
      record: item.record,
      points: item.points,
      omw: item.omw ?? undefined,
      gw: item.gw ?? undefined,
      ogw: item.ogw ?? undefined,
    })),
    decks: raw.decks.map<PlayerDeckItem>((item) => ({
      deck: mapDeckOrFallback(item.deck),
      tournamentsCount: item.tournamentsCount,
      matchesCount: item.matchesCount,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      matchWinRate: item.matchWinRate,
      bestRank: item.bestRank ?? null,
      isSmallSample: item.isSmallSample,
    })),
    recentMatches: raw.recentMatches.map<PlayerMatchItem>((item) => ({
      tournament: {
        id: String(item.tournament.id),
        title: item.tournament.title,
        date: item.tournament.date,
        format: mapFormat(item.tournament.format),
      },
      roundNumber: item.roundNumber,
      tableNumber: item.tableNumber,
      playerDeck: mapDeckShort(item.playerDeck ?? null),
      opponent: mapPlayerShort(item.opponent)!,
      opponentDeck: mapDeckShort(item.opponentDeck ?? null),
      playerScore: item.playerScore,
      opponentScore: item.opponentScore,
      scoreText: item.scoreText,
      result: item.result,
    })),
  };
}

export function mapDecksListResponse(
  raw: BackendDecksListResponse,
  appliedFilters: AppliedFilters,
  page: number,
  pageSize: number,
): DecksListResponse {
  return {
    items: raw.results.map<DeckListItem>((item) => ({
      deck: mapDeckOrFallback(item.deck),
      format: mapFormat(item.format),
      tournamentsCount: item.tournamentsCount,
      playersCount: item.playersCount,
      matchesCount: item.matchesCount,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      matchWinRate: item.matchWinRate,
      bestRank: item.bestRank ?? null,
      isSmallSample: item.isSmallSample,
    })),
    pagination: mapPagination(raw, page, pageSize),
    appliedFilters,
  };
}

export function mapDeckDetailsResponse(
  raw: BackendDeckDetailsResponse,
  appliedFilters: AppliedFilters,
): DeckDetailsResponse {
  return {
    deck: {
      ...mapDeckOrFallback(raw.deck),
      format: mapFormat(raw.deck.format),
    },
    appliedFilters,
    summary: {
      tournamentsCount: raw.summary.tournamentsCount,
      playersCount: raw.summary.playersCount,
      uniquePlayersCount: raw.summary.uniquePlayersCount,
      matchesCount: raw.summary.matchesCount,
      matchWins: raw.summary.matchWins,
      matchLosses: raw.summary.matchLosses,
      matchDraws: raw.summary.matchDraws,
      matchWinRate: raw.summary.matchWinRate,
      bestRank: raw.summary.bestRank ?? null,
      isSmallSample: raw.summary.isSmallSample,
    } satisfies DeckSummary,
    tournamentResults: raw.tournamentResults.map<TournamentDeckResultItem>((item) => ({
      tournament: mapTournamentShort(item.tournament),
      player: mapPlayerShort(item.player)!,
      rank: item.rank,
      record: item.record,
      points: item.points,
    })),
    players: raw.players.map<DeckPlayerItem>((item) => ({
      player: mapPlayerShort(item.player)!,
      tournamentsCount: item.tournamentsCount,
      matchesCount: item.matchesCount,
      matchWins: item.matchWins,
      matchLosses: item.matchLosses,
      matchDraws: item.matchDraws,
      matchWinRate: item.matchWinRate,
      bestRank: item.bestRank ?? null,
      isSmallSample: item.isSmallSample,
    })),
    matchups: raw.matchups.map<DeckMatchupItem>((item) => ({
      opponentDeck: mapDeckOrFallback(item.opponentDeck, UNKNOWN_DECK_NAME),
      matchesCount: item.matchesCount,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate: item.winRate,
      isSmallSample: item.isSmallSample,
    })),
  };
}

export { mapAppliedFilters };

export function mapCreateTournamentResponse(raw: BackendCreateTournamentSuccess): CreateTournamentResponse {
  return {
    success: true,
    tournamentId: String(raw.tournament.id),
    message: `Турнир «${raw.tournament.title}» загружен.`,
    warnings: raw.warnings?.map((warning) => warning.message),
  };
}

export type {
  BackendAppliedFilters,
  BackendCity,
  BackendClub,
  BackendCreateTournamentSuccess,
  BackendDeck,
  BackendDeckDetailsResponse,
  BackendDecksListResponse,
  BackendFormat,
  BackendHomeResponse,
  BackendPaginated,
  BackendPlayer,
  BackendPlayerDetailsResponse,
  BackendPlayersListResponse,
  BackendTournamentDetailsResponse,
  BackendTournamentListItem,
  BackendImportIssue,
};
