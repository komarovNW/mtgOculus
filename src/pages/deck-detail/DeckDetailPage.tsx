import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getDeckDetails } from '@/entities/deck/api';
import type { DeckMatchupItem, DeckPlayerItem, TournamentDeckResultItem } from '@/shared/api/types';
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

const tournamentColumns: TableColumn<TournamentDeckResultItem>[] = [
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
    id: 'player',
    header: 'Игрок',
    render: (row) => (
      <EntityLink
        id={row.player.id}
        name={row.player.name}
        type="player"
      />
    ),
  },
  { id: 'rank', header: 'Место', align: 'right', render: (row) => row.rank },
  { id: 'record', header: 'Record', align: 'right', render: (row) => row.record },
  { id: 'points', header: 'Очки', align: 'right', render: (row) => row.points },
];

const playerColumns: TableColumn<DeckPlayerItem>[] = [
  {
    id: 'player',
    header: 'Игрок',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
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

const matchupColumns: TableColumn<DeckMatchupItem>[] = [
  {
    id: 'opponent',
    header: 'Против колоды',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.opponentDeck.id}
          name={row.opponentDeck.name}
          type="deck"
        />
        {row.isSmallSample ? <Badge variant="warning">Малая выборка</Badge> : null}
      </div>
    ),
  },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  { id: 'record', header: 'Record', align: 'right', render: (row) => formatRecord(row.wins, row.losses, row.draws) },
  { id: 'winrate', header: 'Winrate', align: 'right', render: (row) => formatPercent(row.winRate) },
];

export function DeckDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('results');
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const deckQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['deck-detail', id, apiFilters],
    queryFn: () => getDeckDetails(id, apiFilters),
  });

  if (deckQuery.isLoading) {
    return <LoadingState description="Загружаем статистику колоды и связанные результаты." />;
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(deckQuery.error, 'Не удалось открыть страницу колоды.')}
        onRetry={() => {
          void deckQuery.refetch();
        }}
        title="Колода недоступна"
      />
    );
  }

  const { deck, summary } = deckQuery.data;

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="format">{deck.format.name}</Badge>,
          ...(deck.colors?.length ? [<Badge key="colors">{deck.colors.join(' / ')}</Badge>] : []),
          ...getAppliedFilterLabels(deckQuery.data.appliedFilters).map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description={deck.archetype ? `Архетип: ${deck.archetype}` : 'Страница колоды'}
        eyebrow="Детали колоды"
        title={deck.name}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <SummaryCards
        items={[
          { title: 'Турниров', value: summary.tournamentsCount },
          { title: 'Игроко-участий', value: summary.playersCount },
          { title: 'Уникальных игроков', value: summary.uniquePlayersCount },
          { title: 'Матчей', value: summary.matchesCount },
          { title: 'Record', value: formatRecord(summary.matchWins, summary.matchLosses, summary.matchDraws) },
          { title: 'Winrate', value: formatPercent(summary.matchWinRate) },
          { title: 'Лучшее место', value: summary.bestRank ?? '—' },
        ]}
      />

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'results', label: 'Результаты' },
          { id: 'players', label: 'Игроки' },
          { id: 'matchups', label: 'Матчапы' },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'results' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Результаты по турнирам</h2>
            </div>
          </div>
          <Table
            columns={tournamentColumns}
            data={deckQuery.data.tournamentResults}
            emptyMessage="По выбранным фильтрам у этой колоды пока нет результатов."
            getRowKey={(row) => `${row.tournament.id}-${row.player.id}`}
          />
        </Card>
      ) : null}

      {activeTab === 'players' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Игроки на колоде</h2>
            </div>
          </div>
          <Table
            columns={playerColumns}
            data={deckQuery.data.players}
            emptyMessage="Игроки по этой колоде не найдены."
            getRowKey={(row) => row.player.id}
          />
        </Card>
      ) : null}

      {activeTab === 'matchups' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Матчапы колоды</h2>
            </div>
          </div>
          <Table
            columns={matchupColumns}
            data={deckQuery.data.matchups}
            emptyMessage="Матчапы по этой колоде пока не собраны."
            getRowKey={(row) => row.opponentDeck.id}
          />
        </Card>
      ) : null}
    </div>
  );
}

