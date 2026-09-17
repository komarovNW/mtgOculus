import { Link, useLocation } from 'react-router-dom';
import { getDashboardFilterSearch } from '@/shared/lib/filters';
import type { DeckMetagameItem, DeckPerformanceItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { TOURNAMENT_PARTICIPATIONS_HINT, TOURNAMENT_PARTICIPATIONS_LABEL } from '@/shared/lib/formatRecord';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { EntityLink } from '@/shared/ui/EntityLink';
import { Table, type TableColumn } from '@/shared/ui/Table';

type DeckMetagameRow = DeckMetagameItem & {
  performance?: DeckPerformanceItem;
};

const columns: TableColumn<DeckMetagameRow>[] = [
  {
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck.name,
    render: (row) => (
      <EntityLink
        colors={row.deck.colors}
        id={row.deck.id}
        name={row.deck.name}
        type="deck"
      />
    ),
  },
  {
    id: 'format',
    header: 'Формат',
    render: (row) => row.format ? <Badge>{row.format.name}</Badge> : '—',
    sortValue: (row) => row.format?.name,
  },
  {
    id: 'players',
    header: TOURNAMENT_PARTICIPATIONS_LABEL,
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: TOURNAMENT_PARTICIPATIONS_HINT,
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
  },
  {
    id: 'tournaments',
    header: 'Турниров',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.tournamentsCount,
    sortValue: (row) => row.tournamentsCount,
  },
  {
    id: 'share',
    header: 'Популярность',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => formatPercent(row.metaShare),
    sortValue: (row) => row.metaShare,
  },
  {
    id: 'winrate',
    header: 'Процент побед',
    align: 'center',
    headerTitle: 'Общий процент побед этой колоды против всех соперников по выбранным фильтрам.',
    defaultSortDirection: 'desc',
    render: (row) => row.performance ? (
      <div className="stacked-cell stacked-cell--compact stacked-cell--end">
        <span>{formatPercent(row.performance.matchWinRate)}</span>
        {row.performance.isSmallSample ? (
          <Badge variant="warning">Мало данных</Badge>
        ) : null}
      </div>
    ) : '—',
    sortValue: (row) => row.performance?.matchWinRate,
  },
];

type DeckMetagameSectionProps = {
  items: DeckMetagameItem[];
  performanceItems: DeckPerformanceItem[];
  limit?: number;
  actionHref?: string;
  actionLabel?: string;
  showFormat?: boolean;
};

export function DeckMetagameSection({
  items,
  performanceItems,
  limit = 10,
  actionHref,
  actionLabel = 'Смотреть все колоды',
  showFormat = false,
}: DeckMetagameSectionProps) {
  const location = useLocation();
  const dashboardFilterSearch = getDashboardFilterSearch(location.search);
  const performanceByDeckId = new Map(
    performanceItems.map((item) => [item.deck.id, item]),
  );
  const visibleItems: DeckMetagameRow[] = items.slice(0, limit).map((item) => ({
    ...item,
    performance: performanceByDeckId.get(item.deck.id),
  }));
  const visibleColumns = showFormat
    ? columns
    : columns.filter((column) => column.id !== 'format');
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Метагейм по колодам</h2>
          <p className="section-header__description">
            Топ-{limit} популярных колод и их процент побед.
          </p>
        </div>
        {actionHref ? (
          <Link
            className="button button--ghost section-link"
            to={{
              pathname: actionHref,
              search: dashboardFilterSearch,
            }}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      <Table
        columns={visibleColumns}
        data={visibleItems}
        emptyMessage="Пока нет данных о том, какими колодами играли по этим фильтрам."
        getRowKey={(row) => row.deck.id}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
    </Card>
  );
}
