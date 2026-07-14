export type TournamentType = 'daily' | 'tournament';

export type QueryValue = string | number | boolean | undefined | null;

export type ApiErrorDetail = {
  field?: string;
  message: string;
  source?: string;
};

export type City = {
  id: string;
  name: string;
  country?: string;
};

export type Club = {
  id: string;
  name: string;
  cityId: string;
};

export type Format = {
  id: string;
  name: string;
};

export type PlayerShort = {
  id: string;
  name: string;
};

export type DeckShort = {
  id: string;
  name: string;
  archetype?: string | null;
  colors?: string[] | null;
};

export type AppliedFilters = {
  city?: City | null;
  club?: Club | null;
  format?: Format | null;
  tournamentType?: TournamentType | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type DashboardFilters = {
  cityId: string;
  clubId: string;
  formatId: string;
  tournamentType: '' | TournamentType;
  dateFrom: string;
  dateTo: string;
};

export type HomeSummary = {
  tournamentsCount: number;
  tournamentPlayersCount: number;
  uniquePlayersCount: number;
  matchesCount: number;
  uniqueDecksCount: number;
};

export type RecentTournamentItem = {
  id: string;
  title: string;
  date: string;
  type: TournamentType;
  city: City;
  club: Club;
  format: Format;
  playersCount: number;
  roundsCount: number;
  winner?: {
    player: PlayerShort;
    deck?: DeckShort | null;
  };
};

export type DeckMetagameItem = {
  deck: DeckShort;
  playersCount: number;
  tournamentsCount: number;
  metaShare: number;
  bestRank?: number;
};

export type DeckPerformanceItem = {
  deck: DeckShort;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

export type TopPlayerItem = {
  player: PlayerShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  mostPlayedDeck?: DeckShort;
  isSmallSample: boolean;
};

export type PopularMatchupItem = {
  deckA: DeckShort;
  deckB: DeckShort;
  matchesCount: number;
  deckAWins: number;
  deckBWins: number;
  draws: number;
  deckAWinRate: number;
  isSmallSample: boolean;
};

export type HomeResponse = {
  appliedFilters: AppliedFilters;
  summary: HomeSummary;
  recentTournaments: RecentTournamentItem[];
  deckMetagame: DeckMetagameItem[];
  deckPerformance: DeckPerformanceItem[];
  topPlayers: TopPlayerItem[];
  popularMatchups: PopularMatchupItem[];
};

export type TournamentListQuery = Partial<DashboardFilters> & {
  page?: number;
  limit?: number;
};

export type TournamentListItem = {
  id: string;
  title: string;
  date: string;
  type: TournamentType;
  city: City;
  club: Club;
  format: Format;
  playersCount: number;
  roundsCount: number;
  matchesCount: number;
  winner?: {
    player: PlayerShort;
    deck?: DeckShort | null;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasMore?: boolean;
};

export type TournamentListResponse = {
  items: TournamentListItem[];
  pagination: Pagination;
  appliedFilters: AppliedFilters;
};

export type TournamentDetails = TournamentListItem;

export type TournamentStandingItem = {
  rank: number;
  player: PlayerShort;
  deck?: DeckShort;
  record: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omw?: number;
  gw?: number;
  ogw?: number;
};

export type TournamentMatchPlayer = {
  id: string;
  name: string;
  deck?: DeckShort;
  score: number;
};

export type TournamentRoundMatch = {
  tableNumber: number;
  playerA: TournamentMatchPlayer;
  playerB: TournamentMatchPlayer;
  scoreText: string;
  winnerPlayerId?: string;
};

export type TournamentRound = {
  roundNumber: number;
  matches: TournamentRoundMatch[];
};

export type TournamentPlayerDeckItem = {
  player: PlayerShort;
  deck?: DeckShort;
  rank?: number;
  record?: string;
};

export type TournamentMetagameItem = {
  deck: DeckShort;
  playersCount: number;
  metaShare: number;
  bestRank: number;
};

export type TournamentDetailsResponse = {
  tournament: TournamentDetails;
  standings: TournamentStandingItem[];
  rounds: TournamentRound[];
  playerDecks: TournamentPlayerDeckItem[];
  metagame: TournamentMetagameItem[];
};

export type PlayersListQuery = Partial<DashboardFilters> & {
  search?: string;
  sort?: 'matchWinRate' | 'matchesCount' | 'tournamentsCount' | 'bestRank' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PlayerListItem = {
  player: PlayerShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  mostPlayedDeck?: DeckShort;
  isSmallSample: boolean;
};

export type PlayersListResponse = {
  appliedFilters: AppliedFilters;
  pagination: Pagination;
  items: PlayerListItem[];
};

export type PlayerSummary = {
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  gameWins?: number;
  gameLosses?: number;
  gameDraws?: number;
  gameWinRate?: number;
  bestRank?: number | null;
  averageRank?: number | null;
  uniqueDecksCount: number;
  isSmallSample: boolean;
};

export type PlayerTournamentItem = {
  tournament: {
    id: string;
    title: string;
    date: string;
    type: TournamentType;
    city: City;
    club: Club;
    format: Format;
    playersCount: number;
  };
  deck?: DeckShort;
  rank: number;
  record: string;
  points: number;
  omw?: number;
  gw?: number;
  ogw?: number;
};

export type PlayerDeckItem = {
  deck: DeckShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

export type PlayerMatchItem = {
  tournament: {
    id: string;
    title: string;
    date: string;
    format: Format;
  };
  roundNumber: number;
  tableNumber: number;
  playerDeck?: DeckShort;
  opponent: PlayerShort;
  opponentDeck?: DeckShort;
  playerScore: number;
  opponentScore: number;
  scoreText: string;
  result: 'win' | 'loss' | 'draw';
};

export type PlayerDetailsResponse = {
  appliedFilters: AppliedFilters;
  player: PlayerShort;
  summary: PlayerSummary;
  tournaments: PlayerTournamentItem[];
  decks: PlayerDeckItem[];
  recentMatches?: PlayerMatchItem[];
};

export type DecksListQuery = Partial<DashboardFilters> & {
  page?: number;
  limit?: number;
  sort?: string;
};

export type DeckListItem = {
  deck: DeckShort;
  format: Format;
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

export type DecksListResponse = {
  items: DeckListItem[];
  pagination: Pagination;
  appliedFilters: AppliedFilters;
};

export type DeckSummary = {
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

export type TournamentDeckResultItem = {
  tournament: {
    id: string;
    title: string;
    date: string;
    type: TournamentType;
    city: City;
    club: Club;
    format: Format;
    playersCount: number;
  };
  player: PlayerShort;
  rank: number;
  record: string;
  points: number;
};

export type DeckPlayerItem = {
  player: PlayerShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

export type DeckMatchupItem = {
  opponentDeck: DeckShort;
  matchesCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  isSmallSample: boolean;
};

export type DeckDetailsResponse = {
  deck: DeckShort & {
    format: Format;
  };
  appliedFilters: AppliedFilters;
  summary: DeckSummary;
  tournamentResults: TournamentDeckResultItem[];
  players: DeckPlayerItem[];
  matchups: DeckMatchupItem[];
};

export type CitiesResponse = {
  items: City[];
};

export type ClubsResponse = {
  items: Club[];
};

export type FormatsResponse = {
  items: Format[];
};

export type CreateTournamentPayload = {
  date: string;
  cityId: string;
  clubId: string;
  tournamentType: TournamentType;
  formatId: string;
  aetherhubUrl: string;
  playerDecksText: string;
};

export type CreateTournamentResponse = {
  success: true;
  tournamentId: string;
  message: string;
  warnings?: string[];
};
