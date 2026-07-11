import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import type { TopPlayerItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  SMALL_SAMPLE_HINT,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
} from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

type RankedTopPlayerItem = TopPlayerItem & {
  homeRank: number;
};

const columns: TableColumn<RankedTopPlayerItem>[] = [
  {
    id: 'rank',
    header: '#',
    align: 'center',
    defaultSortDirection: 'asc',
    render: (row) => <span className={`table__rank ${row.homeRank <= 3 ? 'table__rank--top' : ''}`}>{row.homeRank}</span>,
    sortValue: (row) => row.homeRank,
  },
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
    headerTitle: WIN_RATE_HINT,
    defaultSortDirection: 'desc',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.matchWinRate)}
        tone="success"
        title={`Процент побед: ${formatPercent(row.matchWinRate)}`}
        value={row.matchWinRate}
      />
    ),
    sortValue: (row) => row.matchWinRate,
  },
  {
    id: 'bestRank',
    header: 'Лучший результат',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.bestRank ?? '—',
    sortValue: (row) => row.bestRank,
  },
  {
    id: 'deck',
    header: 'Любимая колода',
    sortValue: (row) => row.mostPlayedDeck?.name,
    render: (row) =>
      row.mostPlayedDeck ? (
        <EntityLink
          colors={row.mostPlayedDeck.colors}
          id={row.mostPlayedDeck.id}
          name={row.mostPlayedDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

const compactColumns: TableColumn<RankedTopPlayerItem>[] = [
  {
    id: 'rank',
    header: '#',
    align: 'center',
    defaultSortDirection: 'asc',
    render: (row) => <span className={`table__rank ${row.homeRank <= 3 ? 'table__rank--top' : ''}`}>{row.homeRank}</span>,
    sortValue: (row) => row.homeRank,
  },
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
    id: 'matches',
    header: 'Матчей',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    headerTitle: WIN_RATE_HINT,
    defaultSortDirection: 'desc',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.matchWinRate)}
        tone="success"
        title={`Процент побед: ${formatPercent(row.matchWinRate)}`}
        value={row.matchWinRate}
      />
    ),
    sortValue: (row) => row.matchWinRate,
  },
  {
    id: 'bestRank',
    header: 'Лучшее место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.bestRank ?? '—',
    sortValue: (row) => row.bestRank,
  },
  {
    id: 'deck',
    header: 'Любимая колода',
    sortValue: (row) => row.mostPlayedDeck?.name,
    render: (row) =>
      row.mostPlayedDeck ? (
        <EntityLink
          colors={row.mostPlayedDeck.colors}
          id={row.mostPlayedDeck.id}
          name={row.mostPlayedDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

type TopPlayersTableProps = {
  items: TopPlayerItem[];
  limit?: number;
  showSpotlight?: boolean;
  actionHref?: string;
  actionLabel?: string;
};

export function TopPlayersTable({
  items,
  limit,
  showSpotlight = false,
  actionHref,
  actionLabel = 'Смотреть всех игроков',
}: TopPlayersTableProps) {
  const location = useLocation();
  const rankedItems = items.map((item, index) => ({
    ...item,
    homeRank: index + 1,
  }));
  const visibleItems = limit ? rankedItems.slice(0, limit) : rankedItems;
  const spotlightItems = showSpotlight ? visibleItems.slice(0, 3) : [];
  const tableItems = showSpotlight ? visibleItems.slice(3) : visibleItems;

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Игроки с лучшими результатами</h2>
          <p className="section-header__description">
            {showSpotlight
              ? 'Сверху выделили три самых заметных результата, а ниже оставили короткий список для сравнения.'
              : 'Смотрим, кто чаще всего доходит до верхних мест и хорошо держит процент побед.'}
          </p>
        </div>
        {actionHref ? (
          <Link
            className="button button--ghost section-link"
            to={{
              pathname: actionHref,
              search: location.search,
            }}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {spotlightItems.length ? (
        <div className="spotlight-grid">
          {spotlightItems.map((item, index) => (
            <article
              key={item.player.id}
              className={cn('spotlight-card', index === 0 && 'spotlight-card--lead')}
            >
              <div className="spotlight-card__header">
                <span className="table__rank table__rank--top">{item.homeRank}</span>
                {item.isSmallSample ? (
                  <Badge
                    title={SMALL_SAMPLE_HINT}
                    variant="warning"
                  >
                    Малая выборка
                  </Badge>
                ) : null}
              </div>

              <div className="spotlight-card__title">
                <EntityLink
                  id={item.player.id}
                  name={item.player.name}
                  type="player"
                />
              </div>

              <div className="spotlight-card__subtitle">
                {item.tournamentsCount} турниров · {item.matchesCount} матчей
              </div>

              <div className="spotlight-card__stats">
                <div className="spotlight-card__stat">
                  <span>Процент побед</span>
                  <strong>{formatPercent(item.matchWinRate)}</strong>
                </div>
                <div className="spotlight-card__stat">
                  <span>{MATCH_RECORD_LABEL}</span>
                  <strong>{formatRecord(item.matchWins, item.matchLosses, item.matchDraws)}</strong>
                </div>
                <div className="spotlight-card__stat">
                  <span>Лучшее место</span>
                  <strong>{item.bestRank ?? '—'}</strong>
                </div>
              </div>

              <div className="spotlight-card__deck">
                <span className="muted-text">Любимая колода:</span>{' '}
                {item.mostPlayedDeck ? (
                  <EntityLink
                    colors={item.mostPlayedDeck.colors}
                    id={item.mostPlayedDeck.id}
                    name={item.mostPlayedDeck.name}
                    type="deck"
                  />
                ) : (
                  '—'
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tableItems.length ? (
        <Table
          columns={showSpotlight ? compactColumns : columns}
          data={tableItems}
          emptyMessage="Игроки по этим фильтрам ещё не загружены."
          getRowKey={(row) => row.player.id}
          getRowClassName={(row) => (row.homeRank <= 3 ? 'table__row--top' : undefined)}
        />
      ) : !spotlightItems.length ? (
        <Table
          columns={columns}
          data={visibleItems}
          emptyMessage="Игроки по этим фильтрам ещё не загружены."
          getRowKey={(row) => row.player.id}
          getRowClassName={(row) => (row.homeRank <= 3 ? 'table__row--top' : undefined)}
        />
      ) : null}
    </Card>
  );
}
