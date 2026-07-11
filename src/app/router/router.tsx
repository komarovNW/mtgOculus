import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequirePermission } from '@/app/router/RequirePermission';
import { AppLayout } from '@/widgets/app-layout/AppLayout';
import { CreateTournamentPage } from '@/pages/create-tournament/CreateTournamentPage';
import { DeckDetailPage } from '@/pages/deck-detail/DeckDetailPage';
import { DecksPage } from '@/pages/decks/DecksPage';
import { HomePage } from '@/pages/home/HomePage';
import { LoginPage } from '@/pages/login/LoginPage';
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
        element: <Navigate to="/" replace />,
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
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'admin',
        element: <RequirePermission permission="tournament:create" />,
        children: [
          {
            path: 'tournaments/create',
            element: <CreateTournamentPage />,
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
