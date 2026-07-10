import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getPlayerDetails } from '@/entities/player/api';
import type { PlayerDeckItem, PlayerMatchItem, PlayerTournamentItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

const tournamentColumns: TableColumn<PlayerTournamentItem>[] = [
  { id: 'date', header: 'Дата', render: (row) => formatDate(row.tournament.date) },
  {
    id: 'tournament',
    header: 'Турнир',
    render: (row) => (
      <EntityLink
        id={row.tournament.id}
        name={row.tournament.title}
        type="tournament"
      />
    ),
  },
  {
    id: 'deck',
    header: 'Колода',
    render: (row) =>
      row.deck ? (
        <EntityLink
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  { id: 'rank', header: 'Место', align: 'right', render: (row) => row.rank },
  { id: 'players', header: 'Игроков', align: 'right', render: (row) => row.tournament.playersCount },
  { id: 'record', header: 'Record', align: 'right', render: (row) => row.record },
  { id: 'points', header: 'Очки', align: 'right', render: (row) => row.points },
];

const deckColumns: TableColumn<PlayerDeckItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
        {row.isSmallSample ? <Badge variant="warning">Малая выборка</Badge> : null}
      </div>
    ),
  },
  { id: 'tournaments', header: 'Турниров', align: 'right', render: (row) => row.tournamentsCount },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  { id: 'record', header: 'Record', align: 'right', render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws) },
  { id: 'winrate', header: 'Winrate', align: 'right', render: (row) => formatPercent(row.matchWinRate) },
  { id: 'best', header: 'Лучшее место', align: 'right', render: (row) => row.bestRank ?? '—' },
];

const matchColumns: TableColumn<PlayerMatchItem>[] = [
  { id: 'date', header: 'Дата', render: (row) => formatDate(row.tournament.date) },
  {
    id: 'tournament',
    header: 'Турнир',
    render: (row) => (
      <EntityLink
        id={row.tournament.id}
        name={row.tournament.title}
        type="tournament"
      />
    ),
  },
  { id: 'round', header: 'Раунд', align: 'right', render: (row) => row.roundNumber },
  {
    id: 'playerDeck',
    header: 'Колода игрока',
    render: (row) =>
      row.playerDeck ? (
        <EntityLink
          id={row.playerDeck.id}
          name={row.playerDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  {
    id: 'opponent',
    header: 'Оппонент',
    render: (row) => (
      <EntityLink
        id={row.opponent.id}
        name={row.opponent.name}
        type="player"
      />
    ),
  },
  {
    id: 'opponentDeck',
    header: 'Колода оппонента',
    render: (row) =>
      row.opponentDeck ? (
        <EntityLink
          id={row.opponentDeck.id}
          name={row.opponentDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  { id: 'score', header: 'Счёт', align: 'right', render: (row) => row.scoreText },
];

export function PlayerDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('tournaments');
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const playerQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['player-detail', id, apiFilters],
    queryFn: () => getPlayerDetails(id, apiFilters),
  });

  if (playerQuery.isLoading) {
    return <LoadingState description="Загружаем сводку игрока и связанные турниры." />;
  }

  if (playerQuery.isError || !playerQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(playerQuery.error, 'Не удалось открыть страницу игрока.')}
        onRetry={() => {
          void playerQuery.refetch();
        }}
        title="Игрок недоступен"
      />
    );
  }

  const { player, summary } = playerQuery.data;

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(playerQuery.data.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Агрегированная статистика по выбранному срезу турниров."
        eyebrow="Детали игрока"
        title={player.name}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <SummaryCards
        items={[
          { title: 'Турниров', value: summary.tournamentsCount },
          { title: 'Матчей', value: summary.matchesCount },
          { title: 'Record', value: formatRecord(summary.matchWins, summary.matchLosses, summary.matchDraws) },
          { title: 'Match Winrate', value: formatPercent(summary.matchWinRate) },
          { title: 'Game Winrate', value: formatPercent(summary.gameWinRate) },
          { title: 'Лучшее место', value: summary.bestRank ?? '—' },
          { title: 'Колоды', value: summary.uniqueDecksCount },
        ]}
      />

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'tournaments', label: 'Турниры' },
          { id: 'decks', label: 'Колоды' },
          { id: 'matches', label: 'Матчи' },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'tournaments' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Турниры игрока</h2>
            </div>
          </div>
          <Table
            columns={tournamentColumns}
            data={playerQuery.data.tournaments}
            emptyMessage="У игрока нет турниров по выбранным фильтрам."
            getRowKey={(row) => row.tournament.id}
          />
        </Card>
      ) : null}

      {activeTab === 'decks' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Колоды игрока</h2>
            </div>
          </div>
          <Table
            columns={deckColumns}
            data={playerQuery.data.decks}
            emptyMessage="Колоды по текущему срезу не найдены."
            getRowKey={(row) => row.deck.id}
          />
        </Card>
      ) : null}

      {activeTab === 'matches' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Последние матчи</h2>
            </div>
          </div>
          <Table
            columns={matchColumns}
            data={playerQuery.data.recentMatches ?? []}
            emptyMessage="История матчей пока недоступна."
            getRowKey={(row) => `${row.tournament.id}-${row.roundNumber}-${row.tableNumber}`}
          />
        </Card>
      ) : null}
    </div>
  );
}
