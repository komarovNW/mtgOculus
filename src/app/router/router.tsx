import { createBrowserRouter } from 'react-router-dom';
import { HomeRedirect } from '@/app/router/HomeRedirect';
import { AppLayout } from '@/widgets/app-layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/pages/home/HomePage')).HomePage }),
      },
      {
        path: 'home',
        element: <HomeRedirect />,
      },
      {
        path: 'dailies',
        lazy: async () => ({ Component: (await import('@/pages/dailies/DailiesPage')).DailiesPage }),
      },
      {
        path: 'digest',
        lazy: async () => ({ Component: (await import('@/pages/digest/DigestPage')).DigestPage }),
      },
      {
        path: 'changelog',
        lazy: async () => ({ Component: (await import('@/pages/changelog/ChangelogPage')).ChangelogPage }),
      },
      {
        path: 'admin/tournaments/create',
        lazy: async () => ({ Component: (await import('@/pages/create-tournament/CreateTournamentPage')).CreateTournamentPage }),
      },
      {
        path: 'tournaments',
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/tournaments/TournamentsPage')).TournamentsPage }),
          },
          {
            path: ':id',
            lazy: async () => ({ Component: (await import('@/pages/tournament-detail/TournamentDetailPage')).TournamentDetailPage }),
          },
        ],
      },
      {
        path: 'players',
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/players/PlayersPage')).PlayersPage }),
          },
          {
            path: ':id',
            lazy: async () => ({ Component: (await import('@/pages/player-detail/PlayerDetailPage')).PlayerDetailPage }),
          },
        ],
      },
      {
        path: 'decks',
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/decks/DecksPage')).DecksPage }),
          },
          {
            path: ':id',
            lazy: async () => ({ Component: (await import('@/pages/deck-detail/DeckDetailPage')).DeckDetailPage }),
          },
        ],
      },
      {
        path: 'matchups',
        lazy: async () => ({ Component: (await import('@/pages/matchups/MatchupsPage')).MatchupsPage }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/not-found/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
]);
