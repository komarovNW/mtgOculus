import { createBrowserRouter } from 'react-router-dom';
import { HomeRedirect } from '@/app/router/HomeRedirect';
import { AppLayout } from '@/widgets/app-layout/AppLayout';
import { ChangelogPage } from '@/pages/changelog/ChangelogPage';
import { CreateTournamentPage } from '@/pages/create-tournament/CreateTournamentPage';
import { DailiesPage } from '@/pages/dailies/DailiesPage';
import { DeckDetailPage } from '@/pages/deck-detail/DeckDetailPage';
import { DecksPage } from '@/pages/decks/DecksPage';
import { DigestPage } from '@/pages/digest/DigestPage';
import { HomePage } from '@/pages/home/HomePage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';
import { PlayerDetailPage } from '@/pages/player-detail/PlayerDetailPage';
import { PlayersPage } from '@/pages/players/PlayersPage';
import { TournamentDetailPage } from '@/pages/tournament-detail/TournamentDetailPage';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'home',
        element: <HomeRedirect />,
      },
      {
        path: 'dailies',
        element: <DailiesPage />,
      },
      {
        path: 'digest',
        element: <DigestPage />,
      },
      {
        path: 'changelog',
        element: <ChangelogPage />,
      },
      {
        path: 'admin/tournaments/create',
        element: <CreateTournamentPage />,
      },
      {
        path: 'tournaments',
        children: [
          {
            index: true,
            element: <TournamentsPage />,
          },
          {
            path: ':id',
            element: <TournamentDetailPage />,
          },
        ],
      },
      {
        path: 'players',
        children: [
          {
            index: true,
            element: <PlayersPage />,
          },
          {
            path: ':id',
            element: <PlayerDetailPage />,
          },
        ],
      },
      {
        path: 'decks',
        children: [
          {
            index: true,
            element: <DecksPage />,
          },
          {
            path: ':id',
            element: <DeckDetailPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
