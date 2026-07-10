export const endpoints = {
  home: '/home',
  tournaments: '/tournaments',
  tournamentById: (id: string) => `/tournaments/${id}`,
  players: '/players',
  playerById: (id: string) => `/players/${id}`,
  decks: '/decks',
  deckById: (id: string) => `/decks/${id}`,
  cities: '/cities',
  clubsByCity: (cityId: string) => `/cities/${cityId}/clubs`,
  formats: '/formats',
  importTournament: '/admin/tournaments/import',
} as const;

