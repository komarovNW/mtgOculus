import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getPlayerDetails } from '@/entities/player/api';
import type {
  DashboardFilters,
  PlayerDeckItem,
  PlayerMatchItem,
  PlayerTournamentItem,
} from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
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
import {
  PLAYER_DETAIL_MIN_MATCHES,
  PLAYER_DETAIL_SAMPLE_HINT,
  getPlayerDetailInsights,
  getPlayerDeckMatchups,
  getPlayerMatchKind,
  getPlayerScopedMatches,
  groupPlayerMatchesByTournament,
  isEstablishedPlayerDeck,
  sortPlayerMatches,
  type PlayerDeckMatchup,
} from '@/shared/lib/playerDetailInsights';
import {
  getPlayerOpponentList,
  OPPONENT_WIN_RATE_MIN_MATCHES,
  type PlayerOpponentStat,
} from '@/shared/lib/playerStats';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { PlayerHistoryChart } from '@/widgets/player-history/PlayerHistoryChart';
import { RelationshipHighlights } from '@/widgets/relationship-highlights/RelationshipHighlights';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

function getTournamentColumns(
  tournamentType: DashboardFilters['tournamentType'],
): TableColumn<PlayerTournamentItem>[] {
  const eventLabel = tournamentType === 'daily'
    ? 'Дейлик'
    : tournamentType === 'tournament'
      ? 'Турнир'
      : 'Дейлик / турнир';

  return [
  {
    id: 'date',
    header: 'Дата',
    align: 'center',
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
        name={row.tournament.title.endsWith(` ${formatDate(row.tournament.date)}`)
          ? row.tournament.title.slice(0, -formatDate(row.tournament.date).length).trim()
          : row.tournament.title}
        type="tournament"
      />
    ),
  },
  {
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck?.name,
    render: (row) =>
      row.deck ? (
        <EntityLink
          colors={row.deck.colors}
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
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

function getDeckColumns(
  tournamentType: DashboardFilters['tournamentType'],
): TableColumn<PlayerDeckItem>[] {
  const eventsLabel = tournamentType === 'daily'
    ? 'Дейликов'
    : tournamentType === 'tournament'
      ? 'Турниров'
      : 'Дейлики / турниры';

  return [
  {
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          colors={row.deck.colors}
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
        {!isEstablishedPlayerDeck(row) ? (
          <Badge
            title={PLAYER_DETAIL_SAMPLE_HINT}
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
    render: (row) =>
      formatRecord(row.playedWins, row.matchLosses, row.matchDraws),
    sortValue: (row) =>
      getRecordSortValue(
        row.playedWins,
        row.matchLosses,
        row.matchDraws,
      ),
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

const deckMatchupColumns: TableColumn<PlayerDeckMatchup>[] = [
  {
    id: 'opponentDeck',
    header: 'Колода соперника',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          colors={row.opponentDeck.colors}
          id={row.opponentDeck.id}
          name={row.opponentDeck.name}
          type="deck"
        />
        {row.matchesCount < PLAYER_DETAIL_MIN_MATCHES ? (
          <Badge variant="warning" title={`Для сравнения нужно минимум ${PLAYER_DETAIL_MIN_MATCHES} матчей.`}>
            Мало данных
          </Badge>
        ) : null}
      </div>
    ),
    sortValue: (row) => row.opponentDeck.name,
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
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.wins, row.losses, row.draws),
    sortValue: (row) => getRecordSortValue(row.wins, row.losses, row.draws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'center',
    headerTitle: 'Процент побед этого игрока выбранной колодой против указанной колоды соперника.',
    render: (row) => formatPercent(row.winRate),
    sortValue: (row) => row.winRate,
  },
];

const PLAYER_MATCH_GROUP_PAGE_SIZE = 10;

type PlayerDeckSort = 'matches' | 'winrate';

const playerDeckSortOptions = [
  { value: 'matches', label: 'По числу матчей' },
  { value: 'winrate', label: 'По проценту побед' },
];

const opponentColumns: TableColumn<PlayerOpponentStat>[] = [
  {
    id: 'opponent',
    header: 'Оппонент',
    sortValue: (row) => row.opponent.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.opponent.id}
          name={row.opponent.name}
          type="player"
        />
        {row.matchesCount < OPPONENT_WIN_RATE_MIN_MATCHES ? (
          <Badge
            title={`Для сравнения с оппонентом нужно минимум ${OPPONENT_WIN_RATE_MIN_MATCHES} матчей.`}
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
    header: 'Встреч',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'center',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) =>
      formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'center',
    headerTitle:
      'Процент побед этого игрока во встречах с указанным оппонентом. Малое число матчей отмечено отдельно.',
    render: (row) => formatPercent(row.matchWinRate),
  },
];

const matchColumns: TableColumn<PlayerMatchItem>[] = [
  {
    id: 'round',
    header: 'Раунд',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.roundNumber,
    sortValue: (row) => row.roundNumber,
  },
  {
    id: 'playerDeck',
    header: 'Колода игрока',
    sortValue: (row) => row.playerDeck?.name,
    render: (row) =>
      row.playerDeck ? (
        <EntityLink
          colors={row.playerDeck.colors}
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
    sortValue: (row) =>
      row.opponent?.name ??
      (getPlayerMatchKind(row) === 'bye' ? 'BYE' : 'Не указан'),
    render: (row) => {
      const kind = getPlayerMatchKind(row);

      return kind === 'bye' ? (
        <Badge title="В этом раунде у игрока не было оппонента. BYE считается победой, но это не сыгранный матч.">
          BYE
        </Badge>
      ) : kind === 'unknown' || !row.opponent ? (
        <Badge variant="warning">Не указан</Badge>
      ) : (
        <EntityLink
          id={row.opponent.id}
          name={row.opponent.name}
          type="player"
        />
      );
    },
  },
  {
    id: 'opponentDeck',
    header: 'Колода оппонента',
    sortValue: (row) => row.opponentDeck?.name,
    render: (row) =>
      row.opponentDeck ? (
        <EntityLink
          colors={row.opponentDeck.colors}
          id={row.opponentDeck.id}
          name={row.opponentDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  {
    id: 'result',
    header: 'Результат',
    align: 'center',
    headerTitle: 'Результат матча именно для игрока на этой странице.',
    sortValue: (row) =>
      row.result === 'win' ? 3 : row.result === 'draw' ? 2 : 1,
    render: (row) =>
      getPlayerMatchKind(row) === 'unknown' ? (
        <Badge variant="warning">Не учитывается</Badge>
      ) : (
        <span className={`match-outcome match-outcome--${row.result}`}>
          {row.result === 'win'
            ? 'Победа'
            : row.result === 'loss'
              ? 'Поражение'
              : 'Ничья'}
        </span>
      ),
  },
  {
    id: 'score',
    header: 'Счёт',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle:
      'Сначала счёт игрока на этой странице, потом счёт оппонента.',
    render: (row) =>
      getPlayerMatchKind(row) === 'unknown' ? (
        '—'
      ) : (
        <div className="table__score-cell">
          {getPlayerMatchKind(row) === 'bye'
            ? 'BYE'
            : formatRecord(row.playerScore, row.opponentScore)}
        </div>
      ),
    sortValue: (row) =>
      getRecordSortValue(row.playerScore, row.opponentScore),
  },
];

const dailyMatchColumns = matchColumns.filter(
  (column) => column.id !== 'playerDeck',
);

function getMatchGroupPlayerDeck(matches: PlayerMatchItem[]) {
  return matches.find((match) => match.playerDeck)?.playerDeck;
}

export function PlayerDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [deckSort, setDeckSort] = useState<PlayerDeckSort>('matches');
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [visibleTournamentsCount, setVisibleTournamentsCount] =
    useState(LIST_PAGE_SIZE);
  const [visibleDecksCount, setVisibleDecksCount] = useState(LIST_PAGE_SIZE);
  const [visibleOpponentsCount, setVisibleOpponentsCount] =
    useState(LIST_PAGE_SIZE);
  const [visibleMatchGroupsCount, setVisibleMatchGroupsCount] = useState(
    PLAYER_MATCH_GROUP_PAGE_SIZE,
  );
  const { filters, apiFilters, setFilters, resetFilters } =
    useDashboardFilters();
  const playerQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['player-detail', id, apiFilters],
    queryFn: ({ signal }) => getPlayerDetails(id, apiFilters, { signal }),
  });
  const filterKey = JSON.stringify(apiFilters);

  useEffect(() => {
    setVisibleTournamentsCount(LIST_PAGE_SIZE);
    setVisibleDecksCount(LIST_PAGE_SIZE);
    setVisibleOpponentsCount(LIST_PAGE_SIZE);
    setVisibleMatchGroupsCount(PLAYER_MATCH_GROUP_PAGE_SIZE);
    setExpandedDeckId(null);
  }, [filterKey, id]);

  if (playerQuery.isLoading) {
    return <LoadingState description="Собираем статистику по игроку." />;
  }

  if (playerQuery.isError || !playerQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(
          playerQuery.error,
          'Не получилось открыть страницу игрока. Попробуйте обновить её и зайти ещё раз.',
        )}
        onRetry={() => {
          void playerQuery.refetch();
        }}
        title="Не удалось открыть страницу игрока"
      />
    );
  }

  const { player, summary } = playerQuery.data;
  const insights = getPlayerDetailInsights(playerQuery.data);
  const record = insights.realMatchRecord;
  const sortedTournaments = [...playerQuery.data.tournaments].sort(
    (left, right) =>
      right.tournament.date.localeCompare(left.tournament.date) ||
      right.tournament.id.localeCompare(left.tournament.id),
  );
  const sortedDecks = [...playerQuery.data.decks].sort(
    (left, right) =>
      (deckSort === 'winrate'
        ? right.matchWinRate - left.matchWinRate ||
          right.matchesCount - left.matchesCount
        : right.matchesCount - left.matchesCount ||
          right.matchWinRate - left.matchWinRate) ||
      right.tournamentsCount - left.tournamentsCount ||
      left.deck.name.localeCompare(right.deck.name, 'ru'),
  );
  const sortedMatches = sortPlayerMatches(
    getPlayerScopedMatches(playerQuery.data),
  );
  const opponents = getPlayerOpponentList(sortedMatches);
  const matchGroups = groupPlayerMatchesByTournament(sortedMatches);
  const visibleTournaments = sortedTournaments.slice(
    0,
    visibleTournamentsCount,
  );
  const visibleDecks = sortedDecks.slice(0, visibleDecksCount);
  const visibleOpponents = opponents.slice(0, visibleOpponentsCount);
  const visibleMatchGroups = matchGroups.slice(
    0,
    visibleMatchGroupsCount,
  );
  const tournamentColumns = getTournamentColumns(filters.tournamentType);
  const deckColumns = getDeckColumns(filters.tournamentType);
  const eventLabels = filters.tournamentType === 'daily'
    ? {
        plural: 'Дейлики',
        genitive: 'дейликов',
        singularGenitive: 'дейлика',
      }
    : filters.tournamentType === 'tournament'
      ? {
          plural: 'Турниры',
          genitive: 'турниров',
          singularGenitive: 'турнира',
        }
      : {
          plural: 'Дейлики и турниры',
          genitive: 'дейликов и турниров',
          singularGenitive: 'дейлика или турнира',
        };
  const deckTableColumns: TableColumn<PlayerDeckItem>[] = [
    ...deckColumns,
    {
      id: 'matchups',
      header: 'Матчапы',
      align: 'center',
      render: (row) => {
        const expanded = expandedDeckId === row.deck.id;
        return (
          <Button
            aria-controls={`player-deck-matchups-${row.deck.id}`}
            aria-expanded={expanded}
            className="player-deck-matchups-button"
            onClick={() => setExpandedDeckId(expanded ? null : row.deck.id)}
            type="button"
            variant={expanded ? 'secondary' : 'ghost'}
          >
            {expanded ? 'Скрыть' : 'Показать'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          ...getAppliedFilterLabels(playerQuery.data.appliedFilters).map(
            (label) => <Badge key={label}>{label}</Badge>,
          ),
          ...(!insights.isEstablished
            ? [
                <Badge
                  key="small-sample"
                  title={PLAYER_DETAIL_SAMPLE_HINT}
                  variant="warning"
                >
                  Мало данных
                </Badge>,
              ]
            : []),
        ]}
        description="Результаты, колоды, оппоненты и история матчей."
        eyebrow="Игрок"
        title={player.name}
      />

      <FiltersPanel
        collapsible
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {id === '64' ? (
        <div className="recent-tournaments__empty-callout">
          ВИТАЛЯ ДОДЕЛАЙ ТУРНИРЫ.
        </div>
      ) : null}

      <SummaryCards
        className="player-summary"
        description="В результат входят только сыгранные матчи. BYE и записи без результата показаны отдельно."
        title="Общая статистика"
        items={[
          {
            title: eventLabels.genitive[0].toUpperCase() + eventLabels.genitive.slice(1),
            value: summary.tournamentsCount,
          },
          ...(summary.undefeatedTopsCount !== null && summary.undefeatedTopsCount !== undefined
            ? [{
                title: 'Топов без поражений',
                value: summary.undefeatedTopsCount,
                subtitle: 'Все раунды сыграны и выиграны',
              }]
            : []),
          {
            title: 'Сыграно матчей',
            value: record?.matchesCount ?? '—',
            subtitle:
              [
                record.byesCount > 0
                  ? `Ещё ${record.byesCount} BYE показано отдельно`
                  : '',
                insights.excludedMatchesCount > 0
                  ? `${insights.excludedMatchesCount} без результата`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ') || undefined,
          },
          {
            title: MATCH_RECORD_LABEL,
            titleHint: MATCH_RECORD_HINT,
            value: record
              ? formatRecord(record.wins, record.losses, record.draws)
              : '—',
          },
          {
            title: WIN_RATE_LABEL,
            titleHint: WIN_RATE_HINT,
            value: record ? formatPercent(record.winRate) : '—',
            subtitle: insights.isEstablished ? undefined : 'Матчей пока мало',
          },
        ]}
      />

      <RelationshipHighlights
        title="Главное о колодах"
        items={[
          ...(insights.favoriteDeck ? [{
            label: 'Любимая колода',
            entity: insights.favoriteDeck.deck,
            entityType: 'deck' as const,
            detail: `Участий: ${insights.favoriteDeck.tournamentsCount} · Матчей: ${insights.favoriteDeck.playedMatchesCount}`,
          }] : []),
          ...(insights.bestEstablishedDeck ? [{
            label: 'Лучший процент побед',
            entity: insights.bestEstablishedDeck.deck,
            entityType: 'deck' as const,
            detail: `${formatPercent(insights.bestEstablishedDeck.matchWinRate)} · Матчей: ${insights.bestEstablishedDeck.playedMatchesCount}`,
          }] : []),
        ]}
      />

      <PlayerHistoryChart
        eventsLabel={eventLabels.genitive}
        isComplete={insights.isMatchHistoryComplete}
        items={insights.monthlyActivity}
      />

      <Tabs
        activeId={activeTab}
        items={[
          {
            id: 'tournaments',
            label: `${eventLabels.plural} (${playerQuery.data.tournaments.length})`,
          },
          {
            id: 'decks',
            label: `Колоды (${playerQuery.data.decks.length})`,
          },
          {
            id: 'opponents',
            label: `Оппоненты (${opponents.length})`,
          },
          {
            id: 'matches',
            label: `История (${sortedMatches.length})`,
          },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'tournaments' ? (
        <Card className="player-tournaments-card">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">{eventLabels.plural} игрока</h2>
              <p className="section-header__description">
                Место показано вместе с числом участников {eventLabels.singularGenitive}.
              </p>
            </div>
          </div>
          <Table
            columns={tournamentColumns}
            data={visibleTournaments}
            isPartial={visibleTournaments.length < sortedTournaments.length}
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            emptyMessage={`С этими фильтрами пока нет ${eventLabels.genitive} этого игрока.`}
            getRowKey={(row) => row.tournament.id}
            layout="fixed"
            minWidth={760}
          />
          <LoadMorePagination
            hasMore={
              visibleTournaments.length <
              playerQuery.data.tournaments.length
            }
            isLoading={false}
            loadedCount={visibleTournaments.length}
            onLoadMore={() =>
              setVisibleTournamentsCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={playerQuery.data.tournaments.length}
          />
        </Card>
      ) : null}

      {activeTab === 'decks' ? (
        <Card className="player-decks-card">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Колоды игрока</h2>
            </div>
          </div>
          <div className="player-decks-toolbar toolbar-grid">
            <Select
              label="Сортировка колод"
              onChange={(event) => {
                setDeckSort(event.target.value as PlayerDeckSort);
                setVisibleDecksCount(LIST_PAGE_SIZE);
                setExpandedDeckId(null);
              }}
              options={playerDeckSortOptions}
              value={deckSort}
            />
          </div>
          <Table
            key={deckSort}
            columns={deckTableColumns}
            data={visibleDecks}
            isPartial={visibleDecks.length < sortedDecks.length}
            defaultSort={{
              columnId: deckSort === 'winrate' ? 'winrate' : 'matches',
              direction: 'desc',
            }}
            emptyMessage="С этими фильтрами пока не видно, какими колодами играл этот игрок."
            getRowKey={(row) => row.deck.id}
            getRowClassName={(row) => expandedDeckId === row.deck.id ? 'player-deck-row--expanded' : undefined}
            layout="fixed"
            renderAfterRow={(row) => {
              if (expandedDeckId !== row.deck.id) {
                return null;
              }

              const matchups = getPlayerDeckMatchups(sortedMatches, row.deck.id);

              return (
                <tr className="player-deck-matchups-row">
                  <td colSpan={deckTableColumns.length} id={`player-deck-matchups-${row.deck.id}`}>
                    <div className="player-deck-matchups">
                      <div className="section-header">
                        <div>
                          <h3 className="section-header__title">Матчапы на {row.deck.name}</h3>
                          <p className="section-header__description">
                            Результат показан с позиции игрока. В таблицу входят только матчи с известной колодой соперника.
                            {!insights.isMatchHistoryComplete
                              ? ' Часть истории матчей недоступна.'
                              : ''}
                          </p>
                        </div>
                        {!insights.isMatchHistoryComplete ? <Badge variant="warning">Неполная история</Badge> : null}
                      </div>
                      <Table
                        columns={deckMatchupColumns}
                        data={matchups}
                        defaultSort={{ columnId: 'matches', direction: 'desc' }}
                        emptyMessage="Для этой колоды пока нет матчей с известной колодой соперника."
                        getRowKey={(matchup) => matchup.opponentDeck.id}
                        minWidth={640}
                      />
                    </div>
                  </td>
                </tr>
              );
            }}
            minWidth={880}
          />
          <LoadMorePagination
            hasMore={visibleDecks.length < playerQuery.data.decks.length}
            isLoading={false}
            loadedCount={visibleDecks.length}
            onLoadMore={() =>
              setVisibleDecksCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={playerQuery.data.decks.length}
          />
        </Card>
      ) : null}

      {activeTab === 'opponents' ? (
        <Card>
          <div className="section-header">
            <div>
              <div className="entity-cell">
                <h2 className="section-header__title">Личные встречи</h2>
                {!insights.isMatchHistoryComplete ? (
                  <Badge
                    title="Часть истории матчей недоступна."
                    variant="warning"
                  >
                    Неполная история
                  </Badge>
                ) : null}
              </div>
              <p className="section-header__description">
                Сначала идут самые частые соперники. Процент побед учитывает
                только сыгранные матчи.
                {!insights.isMatchHistoryComplete
                  ? ` Доступно ${record.matchesCount} из ${summary.matchesCount} результатов.`
                  : ''}
              </p>
            </div>
          </div>
          <Table
            columns={opponentColumns}
            data={visibleOpponents}
            isPartial={visibleOpponents.length < opponents.length}
            defaultSort={{ columnId: 'matches', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет матчей с известными оппонентами."
            getRowKey={(row) => row.opponent.id}
            minWidth={680}
          />
          <LoadMorePagination
            hasMore={visibleOpponents.length < opponents.length}
            isLoading={false}
            loadedCount={visibleOpponents.length}
            onLoadMore={() =>
              setVisibleOpponentsCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={opponents.length}
          />
        </Card>
      ) : null}

      {activeTab === 'matches' ? (
        <div className="page-stack">
          {visibleMatchGroups.length === 0 ? (
            <EmptyState description="С этими фильтрами пока нет матчей этого игрока." />
          ) : null}

          {visibleMatchGroups.map((group) => {
            const isDaily = group.tournament.type === 'daily';
            const playerDeck = getMatchGroupPlayerDeck(group.matches);

            return (
              <Card
                className="player-match-group"
                key={group.tournament.id}
              >
                <div className="section-header">
                  <div>
                    <div className="entity-cell">
                      <h3 className="section-header__title">
                        <EntityLink
                          id={group.tournament.id}
                          name={group.tournament.title}
                          type="tournament"
                        />
                      </h3>
                      <Badge>
                        {isDaily
                          ? 'Дейлик'
                          : group.tournament.type === 'tournament'
                            ? 'Турнир'
                            : 'Событие'}
                      </Badge>
                    </div>
                    <p className="section-header__description">
                      {formatDate(group.tournament.date)} ·{' '}
                      {group.tournament.club?.name
                        ? `${group.tournament.club.name} · `
                        : ''}
                      {group.tournament.format.name}
                      {isDaily ? (
                        <>
                          {' · Колода: '}
                          {playerDeck ? (
                            <EntityLink
                              colors={playerDeck.colors}
                              id={playerDeck.id}
                              name={playerDeck.name}
                              type="deck"
                            />
                          ) : (
                            '—'
                          )}
                        </>
                      ) : null}
                      {' · '}
                      {group.record.matchesCount} учтённых результатов
                      {group.record.byesCount > 0
                        ? `, включая ${group.record.byesCount} BYE`
                        : ''}
                      {group.record.unknownResultsCount > 0
                        ? ` · без результата: ${group.record.unknownResultsCount}`
                        : ''}
                      {' · '}результат{' '}
                      {formatRecord(
                        group.record.wins,
                        group.record.losses,
                        group.record.draws,
                      )}
                    </p>
                  </div>
                </div>
                <Table
                  columns={isDaily ? dailyMatchColumns : matchColumns}
                  data={group.matches}
                  defaultSort={{ columnId: 'round', direction: 'asc' }}
                  emptyMessage="В этом событии нет матчей с известными оппонентами."
                  getRowKey={(row) =>
                    `${row.tournament.id}-${row.roundNumber}-${row.tableNumber}-${row.opponent?.id ?? getPlayerMatchKind(row)}`
                  }
                  minWidth={isDaily ? 720 : 880}
                />
              </Card>
            );
          })}

          {matchGroups.length > 0 ? (
            <div
              aria-live="polite"
              className="load-more-pagination"
            >
              <span className="load-more-pagination__status">
                Показано {eventLabels.genitive} {visibleMatchGroups.length} из{' '}
                {matchGroups.length}
              </span>
              {visibleMatchGroups.length < matchGroups.length ? (
                <Button
                  onClick={() =>
                    setVisibleMatchGroupsCount(
                      (count) => count + PLAYER_MATCH_GROUP_PAGE_SIZE,
                    )
                  }
                  type="button"
                  variant="ghost"
                >
                  Показать ещё{' '}
                  {Math.min(
                    PLAYER_MATCH_GROUP_PAGE_SIZE,
                    matchGroups.length - visibleMatchGroups.length,
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
