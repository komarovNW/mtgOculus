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
    id: 'players',
    header: TOURNAMENT_PARTICIPATIONS_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: TOURNAMENT_PARTICIPATIONS_HINT,
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
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
    id: 'share',
    header: 'Доля меты',
    align: 'right',
    headerTitle: 'Какую часть поля заняла эта колода по этим фильтрам.',
    defaultSortDirection: 'desc',
    render: (row) => formatPercent(row.metaShare),
    sortValue: (row) => row.metaShare,
  },
  {
    id: 'winrate',
    header: 'Процент побед',
    align: 'right',
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
};

export function DeckMetagameSection({
  items,
  performanceItems,
  limit = 10,
  actionHref,
  actionLabel = 'Смотреть все колоды',
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
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Метагейм по колодам</h2>
          <p className="section-header__description">
            Топ-{limit} колод по популярности: доля поля и результат против всех соперников.
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
        columns={columns}
        data={visibleItems}
        emptyMessage="Пока нет данных о том, какими колодами играли по этим фильтрам."
        getRowKey={(row) => row.deck.id}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
    </Card>
  );
}
