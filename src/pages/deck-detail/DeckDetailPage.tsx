import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getDeckDetails } from '@/entities/deck/api';
import type { DeckMatchupItem, DeckPlayerItem, TournamentDeckResultItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  SMALL_SAMPLE_HINT,
  TOURNAMENT_PARTICIPATIONS_HINT,
  TOURNAMENT_PARTICIPATIONS_LABEL,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
  getRecordSortValueFromString,
} from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { ManaPips } from '@/shared/ui/ManaPips';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

const tournamentColumns: TableColumn<TournamentDeckResultItem>[] = [
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.tournament.date),
    sortValue: (row) => row.tournament.date,
  },
  {
    id: 'tournament',
    header: 'Турнир',
    sortValue: (row) => row.tournament.title,
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
    sortValue: (row) => row.player.name,
    render: (row) => (
      <EntityLink
        id={row.player.id}
        name={row.player.name}
        type="player"
      />
    ),
  },
  {
    id: 'rank',
    header: 'Место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.rank,
    sortValue: (row) => row.rank,
  },
  {
    id: 'record',
    header: 'Результат',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => row.record,
    sortValue: (row) => getRecordSortValueFromString(row.record),
  },
  {
    id: 'points',
    header: 'Очки',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.points,
    sortValue: (row) => row.points,
  },
];

const playerColumns: TableColumn<DeckPlayerItem>[] = [
  {
    id: 'player',
    header: 'Игрок',
    sortValue: (row) => row.player.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
        />
        {row.isSmallSample ? (
          <Badge
            title={SMALL_SAMPLE_HINT}
            variant="warning"
          >
            Малая выборка
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: 'tournaments',
    header: 'Турниров',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.tournamentsCount,
    sortValue: (row) => row.tournamentsCount,
  },
  {
    id: 'matches',
    header: 'Матчей',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
    sortValue: (row) => getRecordSortValue(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: WIN_RATE_HINT,
    render: (row) => formatPercent(row.matchWinRate),
    sortValue: (row) => row.matchWinRate,
  },
  {
    id: 'best',
    header: 'Лучшее место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.bestRank ?? '—',
    sortValue: (row) => row.bestRank,
  },
];

const matchupColumns: TableColumn<DeckMatchupItem>[] = [
  {
    id: 'opponent',
    header: 'Против колоды',
    sortValue: (row) => row.opponentDeck.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          colors={row.opponentDeck.colors}
          id={row.opponentDeck.id}
          name={row.opponentDeck.name}
          type="deck"
        />
        {row.isSmallSample ? (
          <Badge
            title={SMALL_SAMPLE_HINT}
            variant="warning"
          >
            Малая выборка
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: 'matches',
    header: 'Матчей',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.wins, row.losses, row.draws),
    sortValue: (row) => getRecordSortValue(row.wins, row.losses, row.draws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: WIN_RATE_HINT,
    render: (row) => formatPercent(row.winRate),
    sortValue: (row) => row.winRate,
  },
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
    return <LoadingState description="Загружаем статистику колоды." />;
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(deckQuery.error, 'Попробуйте обновить страницу или открыть колоду ещё раз.')}
        onRetry={() => {
          void deckQuery.refetch();
        }}
        title="Не удалось открыть страницу колоды"
      />
    );
  }

  const { deck, summary } = deckQuery.data;

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="format">{deck.format.name}</Badge>,
          ...(deck.colors?.length ? [<ManaPips key="colors" colors={deck.colors} />] : []),
          ...(summary.isSmallSample
            ? [
                <Badge
                  key="small-sample"
                  title={SMALL_SAMPLE_HINT}
                  variant="warning"
                >
                  Малая выборка
                </Badge>,
              ]
            : []),
          ...getAppliedFilterLabels(deckQuery.data.appliedFilters).map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description={
          deck.archetype
            ? `Здесь видно, как колода выступала в турнирах и против каких архетипов играла. Архетип: ${deck.archetype}.`
            : 'Здесь видно, как колода выступала в турнирах и против каких архетипов играла.'
        }
        eyebrow="Колода"
        title={deck.name}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <SummaryCards
        description="Короткая сводка по этой колоде на текущем срезе."
        title="Общая статистика колоды"
        items={[
          { title: 'Турниров', value: summary.tournamentsCount },
          {
            title: TOURNAMENT_PARTICIPATIONS_LABEL,
            titleHint: TOURNAMENT_PARTICIPATIONS_HINT,
            value: summary.playersCount,
            subtitle: `Разных игроков: ${summary.uniquePlayersCount}`,
          },
          { title: 'Матчей', value: summary.matchesCount },
          {
            title: MATCH_RECORD_LABEL,
            titleHint: MATCH_RECORD_HINT,
            value: formatRecord(summary.matchWins, summary.matchLosses, summary.matchDraws),
          },
          { title: WIN_RATE_LABEL, titleHint: WIN_RATE_HINT, value: formatPercent(summary.matchWinRate) },
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
            emptyMessage="Результаты этой колоды по выбранным фильтрам ещё не загружены."
            getRowKey={(row) => `${row.tournament.id}-${row.player.id}`}
          />
        </Card>
      ) : null}

      {activeTab === 'players' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Кто играл этой колодой</h2>
              <p className="section-header__description">Игроки, которые чаще всего приносили эту колоду на турниры.</p>
            </div>
          </div>
          <Table
            columns={playerColumns}
            data={deckQuery.data.players}
            emptyMessage="Пока не видно, кто играл этой колодой по выбранным фильтрам."
            getRowKey={(row) => row.player.id}
          />
        </Card>
      ) : null}

      {activeTab === 'matchups' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Матчапы колоды</h2>
              <p className="section-header__description">Смотрим, против каких колод эта колода встречалась чаще всего и как шли матчи.</p>
            </div>
          </div>
          <Table
            columns={matchupColumns}
            data={deckQuery.data.matchups}
            emptyMessage="Матчапы этой колоды по выбранным фильтрам ещё не собраны."
            getRowKey={(row) => row.opponentDeck.id}
          />
        </Card>
      ) : null}
    </div>
  );
}
