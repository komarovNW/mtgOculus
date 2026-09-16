export const endpoints = {
  home: '/home',
  tournaments: '/tournaments',
  tournamentById: (id: string) => `/tournaments/${id}`,
  players: '/players',
  playerById: (id: string) => `/players/${id}`,
  decks: '/decks',
  matchups: '/matchups',
  deckById: (id: string) => `/decks/${id}`,
  cities: '/cities',
  clubsByCity: (cityId: string) => `/cities/${cityId}/clubs`,
  formats: '/formats',
  importTournament: '/admin/tournaments/import',
} as const;
