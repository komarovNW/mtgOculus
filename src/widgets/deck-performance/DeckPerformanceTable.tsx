import type { DeckPerformanceItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<DeckPerformanceItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
        {row.isSmallSample ? (
          <Badge
            title="Слишком мало матчей для устойчивой оценки winrate."
            variant="warning"
          >
            Малая выборка
          </Badge>
        ) : null}
      </div>
    ),
  },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  {
    id: 'record',
    header: 'Record',
    align: 'right',
    render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: 'Winrate',
    headerTitle: 'Процент выигранных матчей в текущем срезе.',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.matchWinRate)}
        title={`Winrate: ${formatPercent(row.matchWinRate)}`}
        value={row.matchWinRate}
      />
    ),
  },
  { id: 'best', header: 'Лучшее место', align: 'right', render: (row) => row.bestRank ?? '—' },
];

type DeckPerformanceTableProps = {
  items: DeckPerformanceItem[];
};

export function DeckPerformanceTable({ items }: DeckPerformanceTableProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Результативность колод</h2>
          <p className="section-header__description">
            Колоды, которые не только часто встречаются, но и стабильно выигрывают матчи.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={items}
        emptyMessage="По выбранным фильтрам нет статистики по колодам."
        getRowKey={(row) => row.deck.id}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
    </Card>
  );
}
