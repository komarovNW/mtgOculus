import type { PopularMatchupItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { SplitBar } from '@/shared/ui/SplitBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<PopularMatchupItem>[] = [
  {
    id: 'matchup',
    header: 'Матчап',
    render: (row) => (
      <div className="matchup-cell">
        <EntityLink
          id={row.deckA.id}
          name={row.deckA.name}
          type="deck"
        />
        <span>vs</span>
        <EntityLink
          id={row.deckB.id}
          name={row.deckB.name}
          type="deck"
        />
        {row.isSmallSample ? (
          <Badge
            title="Матчей пока мало, распределение может быть нестабильным."
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
    header: `${'Победы A/B'}`,
    align: 'right',
    render: (row) => formatRecord(row.deckAWins, row.deckBWins, row.draws),
  },
  {
    id: 'distribution',
    header: 'Распределение',
    headerTitle: 'Распределение побед между колодой A и B с учётом ничьих.',
    render: (row) => {
      const drawRate = row.matchesCount > 0 ? (row.draws / row.matchesCount) * 100 : 0;
      const deckBWinRate = Math.max(0, 100 - row.deckAWinRate - drawRate);

      return (
        <SplitBar
          leftLabel={formatPercent(row.deckAWinRate)}
          leftValue={row.deckAWinRate}
          middleValue={drawRate}
          rightLabel={formatPercent(deckBWinRate)}
          rightValue={deckBWinRate}
          title={`${row.deckA.name}: ${formatPercent(row.deckAWinRate)} · ${row.deckB.name}: ${formatPercent(
            deckBWinRate,
          )} · Ничьи: ${formatPercent(drawRate)}`}
        />
      );
    },
  },
];

type PopularMatchupsTableProps = {
  items: PopularMatchupItem[];
};

export function PopularMatchupsTable({ items }: PopularMatchupsTableProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Популярные матчапы</h2>
          <p className="section-header__description">
            Частые пары колод с наглядным распределением побед и быстрым переходом в детали архетипов.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={items}
        emptyMessage="Пока нет матчапов по выбранным фильтрам."
        getRowKey={(row) => `${row.deckA.id}-${row.deckB.id}`}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
    </Card>
  );
}
