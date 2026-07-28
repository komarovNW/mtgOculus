import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getPlayerDetails } from '@/entities/player/api';
import type {
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
  PLAYER_DETAIL_MIN_TOURNAMENTS,
  PLAYER_DETAIL_SAMPLE_HINT,
  getPlayerDetailInsights,
  getPlayerMatchKind,
  getPlayerScopedMatches,
  groupPlayerMatchesByTournament,
  isEstablishedPlayerDeck,
  sortPlayerMatches,
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
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

const tournamentColumns: TableColumn<PlayerTournamentItem>[] = [
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
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => row.record,
    sortValue: (row) => getRecordSortValueFromString(row.record),
  },
  {
    id: 'finish',
    header: 'Итог',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => `${row.rank} из ${row.tournament.playersCount}`,
    sortValue: (row) => row.rank / Math.max(1, row.tournament.playersCount),
  },
];

const deckColumns: TableColumn<PlayerDeckItem>[] = [
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
    render: (row) =>
      formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
    sortValue: (row) =>
      getRecordSortValue(
        row.matchWins,
        row.matchLosses,
        row.matchDraws,
      ),
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
];

const PLAYER_MATCH_GROUP_PAGE_SIZE = 10;

type PlayerDeckSort = 'matches' | 'winrate';

const playerDeckSortOptions = [
  { value: 'matches', label: 'По числу матчей' },
  { value: 'winrate', label: 'По винрейту' },
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
            title={`Для устойчивого сравнения с оппонентом нужно минимум ${OPPONENT_WIN_RATE_MIN_MATCHES} матчей.`}
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
    header: 'Встреч',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'right',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) =>
      formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'right',
    headerTitle:
      'Процент побед именно этого игрока во встречах с указанным оппонентом. Маленькая выборка помечена отдельно.',
    render: (row) => formatPercent(row.matchWinRate),
  },
];

const matchColumns: TableColumn<PlayerMatchItem>[] = [
  {
    id: 'round',
    header: 'Раунд',
    align: 'right',
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

function getMatchesWord(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'матч';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'матча';
  }

  return 'матчей';
}

export function PlayerDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [deckSort, setDeckSort] = useState<PlayerDeckSort>('matches');
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
    queryFn: () => getPlayerDetails(id, apiFilters),
  });
  const careerQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['player-detail-career', id],
    queryFn: () => getPlayerDetails(id, {}),
  });
  const filterKey = JSON.stringify(apiFilters);

  useEffect(() => {
    setVisibleTournamentsCount(LIST_PAGE_SIZE);
    setVisibleDecksCount(LIST_PAGE_SIZE);
    setVisibleOpponentsCount(LIST_PAGE_SIZE);
    setVisibleMatchGroupsCount(PLAYER_MATCH_GROUP_PAGE_SIZE);
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
  const insights = getPlayerDetailInsights(
    playerQuery.data,
    careerQuery.data,
  );
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
  const favoriteDeck = insights.favoriteDeck;
  const favoriteFormat = insights.favoriteFormat;
  const mostFrequentOpponent = insights.mostFrequentOpponent;

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
                  Малая выборка
                </Badge>,
              ]
            : []),
        ]}
        description="Турниры, колоды, оппоненты и матчи игрока по выбранным фильтрам."
        eyebrow="Игрок"
        title={player.name}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <SummaryCards
        description="Учитываем сыгранные матчи и подтверждённые BYE. Записи без понятного типа или оппонента показываем в истории, но исключаем из расчётов."
        title="Общая статистика"
        items={[
          { title: 'Турниров', value: summary.tournamentsCount },
          {
            title: 'Первых мест',
            value: insights.tournamentWinsCount ?? '—',
            subtitle: 'Сколько раз игрок занимал топ-1',
          },
          {
            title: 'Результатов учтено',
            value: record?.matchesCount ?? '—',
            subtitle:
              [
                record.byesCount > 0
                  ? `Включая ${record.byesCount} BYE`
                  : '',
                insights.excludedMatchesCount > 0
                  ? `${insights.excludedMatchesCount} неизвестных исключено`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ') || 'Все результаты сыграны против оппонента',
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
            subtitle: insights.isEstablished
              ? 'Достаточно данных для личной статистики'
              : `Нужно ${PLAYER_DETAIL_MIN_MATCHES} матчей в ${PLAYER_DETAIL_MIN_TOURNAMENTS} событиях`,
          },
          {
            title: 'Разных колод',
            value: summary.uniqueDecksCount,
          },
        ]}
      />

      <Card className="insights-card">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Профиль игрока</h2>
            <p className="section-header__description">
              Что игрок выбирает и с кем чаще всего встречается.
            </p>
          </div>
        </div>

        <div className="insights-grid">
          <div className="insights-summary">
            <div className="insights-summary__value">
              {record?.matchesCount ?? '—'}
            </div>
            <div className="insights-summary__title">
              результатов учтено в личной статистике
            </div>
            <p className="insights-summary__description">
              {insights.firstTournament && insights.latestTournament ? (
                <>
                  В доступной статистике с{' '}
                  {formatDate(insights.firstTournament.tournament.date)} по{' '}
                  {formatDate(insights.latestTournament.tournament.date)}.
                </>
              ) : (
                'Период выступлений пока нельзя определить по полной истории.'
              )}
            </p>
          </div>

          <div className="insights-list">
            <article className="insight-item">
              <div className="insight-item__title">Любимая колода</div>
              <div className="insight-item__body">
                {favoriteDeck ? (
                  <>
                    <EntityLink
                      colors={favoriteDeck.deck.colors}
                      id={favoriteDeck.deck.id}
                      name={favoriteDeck.deck.name}
                      type="deck"
                    />
                    — {favoriteDeck.matchesCount} матчей в{' '}
                    {favoriteDeck.tournamentsCount} турнирах
                    {insights.favoriteDeckShare !== null
                      ? `, ${formatPercent(insights.favoriteDeckShare)} всех учтённых матчей`
                      : ''}
                    .
                  </>
                ) : (
                  'Нет матчей с известной колодой.'
                )}
              </div>
            </article>

            <article className="insight-item">
              <div className="insight-item__title">
                Любимый формат за всю историю
              </div>
              <div className="insight-item__body">
                {careerQuery.isLoading
                  ? 'Собираем статистику без фильтра формата…'
                  : favoriteFormat
                    ? `${favoriteFormat.format.name} — ${favoriteFormat.matchesCount} ${getMatchesWord(
                        favoriteFormat.matchesCount,
                      )} в ${favoriteFormat.tournamentsCount} турнирах.`
                    : 'Нет матчей с известным форматом.'}
              </div>
            </article>

            <article className="insight-item">
              <div className="insight-item__title">Самый частый оппонент</div>
              <div className="insight-item__body">
                {mostFrequentOpponent ? (
                  <>
                    {!insights.isMatchHistoryComplete
                      ? 'По доступной истории: '
                      : null}
                    <EntityLink
                      id={mostFrequentOpponent.opponent.id}
                      name={mostFrequentOpponent.opponent.name}
                      type="player"
                    />
                    — {mostFrequentOpponent.matchesCount}{' '}
                    {getMatchesWord(mostFrequentOpponent.matchesCount)} (
                    {formatRecord(
                      mostFrequentOpponent.matchWins,
                      mostFrequentOpponent.matchLosses,
                      mostFrequentOpponent.matchDraws,
                    )}
                    ).
                  </>
                ) : (
                  'Нет матчей с известными оппонентами.'
                )}
              </div>
            </article>
          </div>
        </div>
      </Card>

      <PlayerHistoryChart items={insights.monthlyActivity} />

      <Tabs
        activeId={activeTab}
        items={[
          {
            id: 'tournaments',
            label: `Турниры (${playerQuery.data.tournaments.length})`,
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
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Турниры игрока</h2>
              <p className="section-header__description">
                Итог показываем вместе с размером поля. Очки убраны: результат
                матчей уже передаёт полезную часть этой информации.
              </p>
            </div>
          </div>
          <Table
            columns={tournamentColumns}
            data={visibleTournaments}
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет турниров этого игрока."
            getRowKey={(row) => row.tournament.id}
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
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Колоды игрока</h2>
              <p className="section-header__description">
                По умолчанию первыми идут наиболее сыгранные колоды. Можно
                переключить порядок на винрейт; результаты меньше чем за 5
                матчей в 2 событиях помечаем как малую выборку.
              </p>
            </div>
          </div>
          <div className="toolbar-grid">
            <Select
              label="Сортировка колод"
              onChange={(event) => {
                setDeckSort(event.target.value as PlayerDeckSort);
                setVisibleDecksCount(LIST_PAGE_SIZE);
              }}
              options={playerDeckSortOptions}
              value={deckSort}
            />
          </div>
          <Table
            key={deckSort}
            columns={deckColumns}
            data={visibleDecks}
            defaultSort={{
              columnId: deckSort === 'winrate' ? 'winrate' : 'matches',
              direction: 'desc',
            }}
            emptyMessage="С этими фильтрами пока не видно, какими колодами играл этот игрок."
            getRowKey={(row) => row.deck.id}
            minWidth={760}
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
                    title="Backend вернул не все результаты игрока по текущим фильтрам."
                    variant="warning"
                  >
                    Неполная история
                  </Badge>
                ) : null}
              </div>
              <p className="section-header__description">
                Соперники отсортированы по количеству встреч. Винрейт считаем
                только по реальным матчам: BYE и записи без известного
                оппонента исключены.
                {!insights.isMatchHistoryComplete
                  ? ` Сейчас доступно ${record.matchesCount} из ${summary.matchesCount} учтённых результатов, поэтому показатели отражают только доступную историю.`
                  : ''}
              </p>
            </div>
          </div>
          <Table
            columns={opponentColumns}
            data={visibleOpponents}
            defaultSort={{ columnId: 'matches', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет матчей с известными оппонентами."
            getRowKey={(row) => row.opponent.id}
            minWidth={980}
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
          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">История матчей</h2>
                <p className="section-header__description">
                  Матчи разделены по дейликам и турнирам. Новые события идут
                  первыми, а дозагрузка показывает событие целиком. BYE
                  показываем отдельной строкой и считаем победой без сыгранного
                  матча; неизвестные записи в статистику не включаем.
                </p>
              </div>
            </div>
          </Card>

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
                        ? ` · ${group.record.unknownResultsCount} неизвестных исключено`
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
                Показано событий {visibleMatchGroups.length} из{' '}
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
