import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getPlayerDetails } from '@/entities/player/api';
import type { PlayerDeckItem, PlayerMatchItem, PlayerTournamentItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  SMALL_SAMPLE_HINT,
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
import { EmptyState } from '@/shared/ui/EmptyState';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
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
    id: 'rank',
    header: 'Место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.rank,
    sortValue: (row) => row.rank,
  },
  {
    id: 'players',
    header: 'Игроков',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.tournament.playersCount,
    sortValue: (row) => row.tournament.playersCount,
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

const matchColumns: TableColumn<PlayerMatchItem>[] = [
  {
    id: 'round',
    header: 'Раунд',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.roundNumber,
    sortValue: (row) => row.roundNumber,
  },
  {
    id: 'table',
    header: 'Стол',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.tableNumber,
    sortValue: (row) => row.tableNumber,
  },
  {
    id: 'playerDeck',
    header: 'Колода',
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
    sortValue: (row) => row.opponent.name,
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
    sortValue: (row) => {
      if (row.result === 'win') {
        return 3;
      }

      if (row.result === 'draw') {
        return 2;
      }

      return 1;
    },
    render: (row) => (
      <span className={`match-outcome match-outcome--${row.result}`}>
        {row.result === 'win' ? 'Победа' : row.result === 'loss' ? 'Поражение' : 'Ничья'}
      </span>
    ),
  },
  {
    id: 'score',
    header: 'Счёт',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: 'Сначала счёт игрока на этой странице, потом счёт оппонента. Например, 2-1 значит, что игрок выиграл матч.',
    render: (row) => <div className="table__score-cell">{formatRecord(row.playerScore, row.opponentScore)}</div>,
    sortValue: (row) => getRecordSortValue(row.playerScore, row.opponentScore),
  },
];

type PlayerMatchesGroup = {
  tournament: PlayerMatchItem['tournament'];
  items: PlayerMatchItem[];
};

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

function groupMatchesByTournament(matches: PlayerMatchItem[]) {
  const groups = new Map<string, PlayerMatchesGroup>();

  matches.forEach((match) => {
    const current = groups.get(match.tournament.id);

    if (current) {
      current.items.push(match);
      return;
    }

    groups.set(match.tournament.id, {
      tournament: match.tournament,
      items: [match],
    });
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort((left, right) => {
        if (left.roundNumber !== right.roundNumber) {
          return left.roundNumber - right.roundNumber;
        }

        return left.tableNumber - right.tableNumber;
      }),
    }))
    .sort((left, right) => {
      if (left.tournament.date !== right.tournament.date) {
        return right.tournament.date.localeCompare(left.tournament.date);
      }

      return left.tournament.title.localeCompare(right.tournament.title, 'ru', {
        sensitivity: 'base',
      });
    });
}

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
    return <LoadingState description="Собираем статистику по игроку." />;
  }

  if (playerQuery.isError || !playerQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(playerQuery.error, 'Не получилось открыть страницу игрока. Попробуйте обновить её и зайти ещё раз.')}
        onRetry={() => {
          void playerQuery.refetch();
        }}
        title="Не удалось открыть страницу игрока"
      />
    );
  }

  const { player, summary } = playerQuery.data;
  const matchGroups = groupMatchesByTournament(playerQuery.data.recentMatches ?? []);
  const favoriteDeck =
    [...playerQuery.data.decks].sort(
      (left, right) =>
        right.tournamentsCount - left.tournamentsCount ||
        right.matchesCount - left.matchesCount ||
        left.deck.name.localeCompare(right.deck.name, 'en', { sensitivity: 'base' }),
    )[0]?.deck ?? null;

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          ...getAppliedFilterLabels(playerQuery.data.appliedFilters).map((label) => <Badge key={label}>{label}</Badge>),
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
        ]}
        description="Все результаты игрока по этим фильтрам: турниры, колоды и матчи."
        eyebrow="Игрок"
        title={player.name}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <SummaryCards
        description="Коротко о результатах игрока по этим фильтрам."
        title="Общая статистика"
        items={[
          { title: 'Турниров', value: summary.tournamentsCount },
          { title: 'Матчей', value: summary.matchesCount },
          {
            title: MATCH_RECORD_LABEL,
            titleHint: MATCH_RECORD_HINT,
            value: formatRecord(summary.matchWins, summary.matchLosses, summary.matchDraws),
          },
          { title: WIN_RATE_LABEL, titleHint: WIN_RATE_HINT, value: formatPercent(summary.matchWinRate) },
          { title: 'Лучшее место', value: summary.bestRank ?? '—' },
          {
            title: 'Любимая колода',
            value: favoriteDeck?.name ?? '—',
            valueSize: 'compact',
            subtitle: `Разных колод по этим фильтрам: ${summary.uniqueDecksCount}`,
          },
        ]}
      />

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'tournaments', label: 'Турниры' },
          { id: 'decks', label: 'Колоды' },
          { id: 'matches', label: 'Последние матчи' },
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
            emptyMessage="С этими фильтрами пока нет турниров этого игрока."
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
            emptyMessage="С этими фильтрами пока не видно, какими колодами играл этот игрок."
            getRowKey={(row) => row.deck.id}
          />
        </Card>
      ) : null}

      {activeTab === 'matches' ? (
        <div className="page-stack">
          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Последние матчи</h2>
                <p className="section-header__description">Матчи сгруппированы по турнирам, чтобы историю игрока было легче читать.</p>
              </div>
            </div>
            {matchGroups.length === 0 ? (
              <EmptyState description="С этими фильтрами пока нет матчей этого игрока." />
            ) : null}
          </Card>

          {matchGroups.map((group) => (
            <Card key={group.tournament.id}>
              <div className="section-header">
                <div>
                  <h3 className="section-header__title">
                    <EntityLink
                      id={group.tournament.id}
                      name={group.tournament.title}
                      type="tournament"
                    />
                  </h3>
                  <p className="section-header__description">
                    {formatDate(group.tournament.date)} · {group.tournament.format.name} · {group.items.length}{' '}
                    {getMatchesWord(group.items.length)}
                  </p>
                </div>
              </div>
              <Table
                columns={matchColumns}
                data={group.items}
                emptyMessage="Пока нет матчей по этому турниру."
                getRowKey={(row) => `${row.tournament.id}-${row.roundNumber}-${row.tableNumber}`}
              />
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
