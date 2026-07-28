import type { DeckListItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
} from '@/shared/lib/formatRecord';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<DeckListItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <EntityLink
        colors={row.deck.colors}
        id={row.deck.id}
        name={row.deck.name}
        type="deck"
      />
    ),
    sortValue: (row) => row.deck.name,
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
    header: 'Матчей против соперника',
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
      getRecordSortValue(row.matchWins, row.matchLosses, row.matchDraws),
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
];

type EstablishedDeckResultsProps = {
  items: DeckListItem[];
};

export function EstablishedDeckResults({ items }: EstablishedDeckResultsProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">
            Лучшие результаты на достаточной выборке
          </h2>
          <p className="section-header__description">
            Топ-5 по проценту побед только среди колод с 30+ матчами минимум в
            10 турнирах.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={items}
        emptyMessage="По этим фильтрам пока нет колод с достаточной выборкой."
        getRowKey={(row) => row.deck.id}
      />
    </Card>
  );
}
