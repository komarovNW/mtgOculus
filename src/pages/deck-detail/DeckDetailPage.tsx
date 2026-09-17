import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getDeckDetails } from '@/entities/deck/api';
import type { DashboardFilters, DeckMatchupItem, DeckPlayerItem, TournamentDeckResultItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import {
  getDeckDetailInsights,
  isEstablishedDeckPlayer,
  isEstablishedMatchup,
} from '@/shared/lib/deckDetailInsights';
import {
  ESTABLISHED_DECK_SAMPLE_HINT,
} from '@/shared/lib/establishedDecks';
import { ESTABLISHED_PLAYER_SAMPLE_HINT } from '@/shared/lib/establishedPlayers';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
  getRecordSortValueFromString,
} from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { LoadingState } from '@/shared/ui/LoadingState';
import { ManaPips } from '@/shared/ui/ManaPips';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';
import { DeckHistoryChart } from '@/widgets/deck-history/DeckHistoryChart';
import { RelationshipHighlights } from '@/widgets/relationship-highlights/RelationshipHighlights';

function getTournamentColumns(
  tournamentType: DashboardFilters['tournamentType'],
): TableColumn<TournamentDeckResultItem>[] {
  const eventLabel = tournamentType === 'daily'
    ? 'Дейлик'
    : tournamentType === 'tournament'
      ? 'Турнир'
      : 'Событие';

  return [
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.tournament.date),
    sortValue: (row) => row.tournament.date,
  },
  {
    id: 'tournament',
    header: eventLabel,
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
    id: 'record',
    header: 'Результат',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => row.record,
    sortValue: (row) => getRecordSortValueFromString(row.record),
  },
  {
    id: 'finish',
    header: 'Итог',
    align: 'center',
    defaultSortDirection: 'asc',
    render: (row) => `${row.rank} из ${row.tournament.playersCount}`,
    sortValue: (row) => row.rank / Math.max(1, row.tournament.playersCount),
  },
  ];
}

function getPlayerColumns(
  tournamentType: DashboardFilters['tournamentType'],
): TableColumn<DeckPlayerItem>[] {
  const eventsLabel = tournamentType === 'daily'
    ? 'Дейликов'
    : tournamentType === 'tournament'
      ? 'Турниров'
      : 'Событий';

  return [
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
        {!isEstablishedDeckPlayer(row) ? (
          <Badge
            title={ESTABLISHED_PLAYER_SAMPLE_HINT}
            variant="warning"
          >
            Мало данных
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: 'tournaments',
    header: eventsLabel,
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.tournamentsCount,
    sortValue: (row) => row.tournamentsCount,
  },
  {
    id: 'matches',
    header: 'Матчей',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.playedMatchesCount,
    sortValue: (row) => row.playedMatchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
    sortValue: (row) => getRecordSortValue(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: WIN_RATE_HINT,
    render: (row) => formatPercent(row.matchWinRate),
    sortValue: (row) => row.matchWinRate,
  },
  ];
}

function getMatchupColumns(
  deckId: string,
): TableColumn<DeckMatchupItem>[] {
  return [
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
          {row.opponentDeck.id === deckId ? <Badge>Зеркало</Badge> : null}
          {!isEstablishedMatchup(row) ? (
            <Badge
              title="Матчей пока мало, поэтому результат может заметно измениться."
              variant="warning"
            >
              Мало данных
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: 'matches',
      header: 'Матчей',
      align: 'center',
      defaultSortDirection: 'desc',
      render: (row) => row.matchesCount,
      sortValue: (row) => row.matchesCount,
    },
    {
      id: 'record',
      header: MATCH_RECORD_LABEL,
      align: 'center',
      defaultSortDirection: 'desc',
      headerTitle: MATCH_RECORD_HINT,
      render: (row) => formatRecord(row.wins, row.losses, row.draws),
      sortValue: (row) => getRecordSortValue(row.wins, row.losses, row.draws),
    },
    {
      id: 'winrate',
      header: WIN_RATE_LABEL,
      align: 'center',
      defaultSortDirection: 'desc',
      headerTitle: WIN_RATE_HINT,
      render: (row) => formatPercent(row.winRate),
      sortValue: (row) => row.winRate,
    },
  ];
}

export function DeckDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('matchups');
  const [visibleResultsCount, setVisibleResultsCount] = useState(LIST_PAGE_SIZE);
  const [visiblePlayersCount, setVisiblePlayersCount] = useState(LIST_PAGE_SIZE);
  const [visibleMatchupsCount, setVisibleMatchupsCount] = useState(LIST_PAGE_SIZE);
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const detailFilters = {
    ...apiFilters,
    formatId: undefined,
  };
  const deckQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['deck-detail', id, detailFilters],
    queryFn: ({ signal }) => getDeckDetails(id, detailFilters, { signal }),
  });
  const filterKey = JSON.stringify(detailFilters);

  useEffect(() => {
    setVisibleResultsCount(LIST_PAGE_SIZE);
    setVisiblePlayersCount(LIST_PAGE_SIZE);
    setVisibleMatchupsCount(LIST_PAGE_SIZE);
  }, [filterKey, id]);

  if (deckQuery.isLoading) {
    return <LoadingState description="Собираем статистику по колоде." />;
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(deckQuery.error, 'Не получилось открыть страницу колоды. Попробуйте обновить её и зайти ещё раз.')}
        onRetry={() => {
          void deckQuery.refetch();
        }}
        title="Не удалось открыть колоду"
      />
    );
  }

  const { deck, summary } = deckQuery.data;
  const insights = getDeckDetailInsights(deckQuery.data);
  const matchupComparisonMessage =
    insights.establishedMatchupsCount < 2
      ? 'Для сравнения нужны хотя бы два незеркальных матчапа с достаточным числом матчей.'
      : 'У сравниваемых матчапов одинаковый процент побед.';
  const matchupColumns = getMatchupColumns(deck.id);
  const tournamentColumns = getTournamentColumns(filters.tournamentType);
  const playerColumns = getPlayerColumns(filters.tournamentType);
  const sortedTournamentResults = [...deckQuery.data.tournamentResults].sort(
    (left, right) =>
      right.tournament.date.localeCompare(left.tournament.date) ||
      right.tournament.id.localeCompare(left.tournament.id),
  );
  const sortedPlayers = [...deckQuery.data.players].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      right.tournamentsCount - left.tournamentsCount ||
      left.player.name.localeCompare(right.player.name, 'ru'),
  );
  const sortedMatchups = deckQuery.data.matchups
    .filter(
      (item) =>
        item.hasKnownOpponentDeck !== false && Boolean(item.opponentDeck.id),
    )
    .sort(
      (left, right) =>
        right.matchesCount - left.matchesCount ||
        left.opponentDeck.name.localeCompare(right.opponentDeck.name, 'ru'),
    );
  const visibleTournamentResults = sortedTournamentResults.slice(
    0,
    visibleResultsCount,
  );
  const visiblePlayers = sortedPlayers.slice(0, visiblePlayersCount);
  const visibleMatchups = sortedMatchups.slice(0, visibleMatchupsCount);
  const matchupExclusions = [
    insights.unknownOpponentDeckCount > 0
      ? `${insights.unknownOpponentDeckCount} без указанной колоды соперника`
      : '',
    insights.byesCount > 0 ? `${insights.byesCount} BYE` : '',
    insights.unknownResultsCount > 0
      ? `${insights.unknownResultsCount} с неизвестным результатом`
      : '',
  ].filter(Boolean);
  const eventsLabel = filters.tournamentType === 'daily'
    ? 'Дейлики'
    : filters.tournamentType === 'tournament'
      ? 'Турниры'
      : 'События';
  const eventsLabelLower = eventsLabel.toLocaleLowerCase('ru-RU');
  const participationsLabel = filters.tournamentType === 'daily'
    ? 'Участий в дейликах'
    : filters.tournamentType === 'tournament'
      ? 'Участий в турнирах'
      : 'Участий в событиях';
  const participationsHint = filters.tournamentType === 'daily'
    ? 'Сколько раз этой колодой играли на дейликах.'
    : filters.tournamentType === 'tournament'
      ? 'Сколько раз этой колодой играли на турнирах.'
      : 'Сколько раз этой колодой играли на дейликах и турнирах.';

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="format">{deck.format.name}</Badge>,
          ...(deck.archetype ? [<Badge key="archetype">{deck.archetype}</Badge>] : []),
          ...(deck.colors?.length ? [<ManaPips key="colors" colors={deck.colors} />] : []),
          ...(!insights.isEstablished
            ? [
                <Badge
                  key="small-sample"
                  title={ESTABLISHED_DECK_SAMPLE_HINT}
                  variant="warning"
                >
                  Мало данных
                </Badge>,
              ]
            : []),
          ...getAppliedFilterLabels(deckQuery.data.appliedFilters)
            .filter((label) => label !== deck.format.name)
            .map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description="Результаты, игроки и матчапы колоды."
        eyebrow="Колода"
        title={deck.name}
      />

      <FiltersPanel
        collapsible
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        showFormat={false}
      />

      <SummaryCards
        className="deck-summary"
        title="Результаты"
        items={[
          {
            title: participationsLabel,
            titleHint: participationsHint,
            value: summary.playersCount,
            subtitle: `Разных игроков: ${summary.uniquePlayersCount}`,
          },
          {
            title: 'Сыграно матчей',
            value: insights.playedMatchesCount,
            subtitle:
              insights.byesCount > 0
                ? `${insights.byesCount} BYE не влияет на статистику колоды`
                : undefined,
          },
          {
            title: MATCH_RECORD_LABEL,
            titleHint: MATCH_RECORD_HINT,
            value: formatRecord(summary.matchWins, summary.matchLosses, summary.matchDraws),
          },
          {
            title: WIN_RATE_LABEL,
            titleHint: WIN_RATE_HINT,
            value: formatPercent(summary.matchWinRate),
            subtitle: insights.isEstablished
              ? 'Данных достаточно для сравнения'
              : 'Матчей пока мало',
          },
          ...(summary.metaShare !== null && summary.metaShare !== undefined
            ? [{
                title: 'Доля метагейма',
                titleHint:
                  'Доля всех участий колод в выбранном срезе, которая приходится на эту колоду.',
                value: formatPercent(summary.metaShare),
                subtitle: 'Среди всех участий колод',
              }]
            : []),
        ]}
      />

      <RelationshipHighlights
        title="Главное об игроках"
        items={[
          ...(insights.mostActivePlayer ? [{
            label: 'Чаще всего играл',
            entity: insights.mostActivePlayer.player,
            entityType: 'player' as const,
            detail: `Участий: ${insights.mostActivePlayer.tournamentsCount} · Матчей: ${insights.mostActivePlayer.playedMatchesCount}`,
          }] : []),
          ...(insights.bestEstablishedPlayer ? [{
            label: 'Лучший процент побед',
            entity: insights.bestEstablishedPlayer.player,
            entityType: 'player' as const,
            detail: `${formatPercent(insights.bestEstablishedPlayer.matchWinRate)} · Матчей: ${insights.bestEstablishedPlayer.playedMatchesCount}`,
          }] : []),
        ]}
      />

      <Card className="insights-card">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Сильные и слабые матчапы</h2>
          </div>
        </div>

        {insights.bestMatchup && insights.worstMatchup ? (
          <div className="deck-matchup-highlights insights-list">
            <article className="insight-item">
              <div className="insight-item__title">Лучший матчап</div>
              <div className="insight-item__body">
                <EntityLink
                  colors={insights.bestMatchup.opponentDeck.colors}
                  id={insights.bestMatchup.opponentDeck.id}
                  name={insights.bestMatchup.opponentDeck.name}
                  type="deck"
                />
                {' — '}{formatPercent(insights.bestMatchup.winRate)} за{' '}
                {insights.bestMatchup.matchesCount} матчей (
                {formatRecord(
                  insights.bestMatchup.wins,
                  insights.bestMatchup.losses,
                  insights.bestMatchup.draws,
                )}
                ).
              </div>
            </article>

            <article className="insight-item">
              <div className="insight-item__title">Худший матчап</div>
              <div className="insight-item__body">
                <EntityLink
                  colors={insights.worstMatchup.opponentDeck.colors}
                  id={insights.worstMatchup.opponentDeck.id}
                  name={insights.worstMatchup.opponentDeck.name}
                  type="deck"
                />
                {' — '}{formatPercent(insights.worstMatchup.winRate)} за{' '}
                {insights.worstMatchup.matchesCount} матчей (
                {formatRecord(
                  insights.worstMatchup.wins,
                  insights.worstMatchup.losses,
                  insights.worstMatchup.draws,
                )}
                ).
              </div>
            </article>
          </div>
        ) : (
          <p className="section-header__description">{matchupComparisonMessage}</p>
        )}

        {insights.unknownOpponentDeckCount > 0 ||
        insights.byesCount > 0 ||
        insights.unknownResultsCount > 0 ? (
          <p className="section-header__description">
            Колода оппонента определена в {insights.knownMatchupsCount} из{' '}
            {insights.playedMatchesCount} матчей. Не вошли в сравнение:{' '}
            {matchupExclusions.join(', ')}.
          </p>
        ) : null}
      </Card>

      <DeckHistoryChart
        eventsLabel={eventsLabel}
        isComplete={insights.isTournamentHistoryComplete}
        items={insights.monthlyActivity}
      />

      <Tabs
        activeId={activeTab}
        items={[
          {
            id: 'matchups',
            label: `Матчапы (${sortedMatchups.length})`,
          },
          {
            id: 'results',
            label: `${eventsLabel} (${deckQuery.data.tournamentResults.length})`,
          },
          { id: 'players', label: `Игроки (${deckQuery.data.players.length})` },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'results' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Результаты по {eventsLabelLower}</h2>
            </div>
          </div>
          <Table
            columns={tournamentColumns}
            data={visibleTournamentResults}
            isPartial={visibleTournamentResults.length < sortedTournamentResults.length}
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет результатов этой колоды."
            getRowKey={(row) => `${row.tournament.id}-${row.player.id}`}
            minWidth={760}
          />
          <LoadMorePagination
            hasMore={
              visibleTournamentResults.length <
              deckQuery.data.tournamentResults.length
            }
            isLoading={false}
            loadedCount={visibleTournamentResults.length}
            onLoadMore={() =>
              setVisibleResultsCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={deckQuery.data.tournamentResults.length}
          />
        </Card>
      ) : null}

      {activeTab === 'players' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Кто играл этой колодой</h2>
                <p className="section-header__description">
                  Сначала идут игроки, которые провели больше матчей этой колодой.
                  Результаты с малым числом матчей отмечены отдельно.
                </p>
              </div>
            </div>
          <Table
            columns={playerColumns}
            data={visiblePlayers}
            isPartial={visiblePlayers.length < sortedPlayers.length}
            defaultSort={{ columnId: 'matches', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока не видно, кто играл этой колодой."
            getRowKey={(row) => row.player.id}
            minWidth={760}
          />
          <LoadMorePagination
            hasMore={visiblePlayers.length < deckQuery.data.players.length}
            isLoading={false}
            loadedCount={visiblePlayers.length}
            onLoadMore={() =>
              setVisiblePlayersCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={deckQuery.data.players.length}
          />
        </Card>
      ) : null}

      {activeTab === 'matchups' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Матчапы колоды</h2>
                <p className="section-header__description">
                  Сначала идут самые частые соперники. Результаты с малым числом
                  матчей отмечены отдельно.
                </p>
              </div>
            </div>
          <Table
            columns={matchupColumns}
            data={visibleMatchups}
            isPartial={visibleMatchups.length < sortedMatchups.length}
            defaultSort={{ columnId: 'matches', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет матчапов этой колоды."
            getRowKey={(row) => row.opponentDeck.id}
            minWidth={720}
          />
          <LoadMorePagination
            hasMore={visibleMatchups.length < sortedMatchups.length}
            isLoading={false}
            loadedCount={visibleMatchups.length}
            onLoadMore={() =>
              setVisibleMatchupsCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={sortedMatchups.length}
          />
        </Card>
      ) : null}
    </div>
  );
}
