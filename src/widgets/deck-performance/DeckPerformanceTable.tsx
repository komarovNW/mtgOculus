import { Link, useLocation } from 'react-router-dom';
import type { DeckPerformanceItem } from '@/shared/api/types';
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

const columns: TableColumn<DeckPerformanceItem>[] = [
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
    id: 'best',
    header: 'Лучшее место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.bestRank ?? '—',
    sortValue: (row) => row.bestRank,
  },
];

type DeckPerformanceTableProps = {
  items: DeckPerformanceItem[];
  limit?: number;
  actionHref?: string;
  actionLabel?: string;
};

export function DeckPerformanceTable({
  items,
  limit,
  actionHref,
  actionLabel = 'Смотреть все колоды',
}: DeckPerformanceTableProps) {
  const location = useLocation();
  const visibleItems = limit ? items.slice(0, limit) : items;

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Как выступают колоды</h2>
          <p className="section-header__description">
            {limit
              ? 'Сверху показываем колоды, которые лучше всего держат процент побед и уже успели набрать матчи.'
              : 'Сравниваем колоды по проценту побед, результату матчей и лучшим результатам.'}
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
      <Table
        columns={columns}
        data={visibleItems}
        emptyMessage="Когда по этим фильтрам появятся матчи, здесь будет видно, как выступают колоды."
        getRowKey={(row) => row.deck.id}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
    </Card>
  );
}
