import { useMemo, useState } from 'react';
import type { PopularMatchupItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { MATCHUP_SMALL_SAMPLE_HINT, formatRecord, getRecordSortValue } from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { SplitBar } from '@/shared/ui/SplitBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<PopularMatchupItem>[] = [
  {
    id: 'matchup',
    header: 'Матчап',
    sortValue: (row) => `${row.deckA.name} vs ${row.deckB.name}`,
    render: (row) => (
      <div className="matchup-cell">
        <EntityLink
          colors={row.deckA.colors}
          id={row.deckA.id}
          name={row.deckA.name}
          type="deck"
        />
        <span>против</span>
        <EntityLink
          colors={row.deckB.colors}
          id={row.deckB.id}
          name={row.deckB.name}
          type="deck"
        />
        {row.isSmallSample ? (
          <Badge
            title={MATCHUP_SMALL_SAMPLE_HINT}
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
    header: 'Результат матчапа',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: 'Сначала победы левой колоды, потом правой, затем ничьи.',
    render: (row) => formatRecord(row.deckAWins, row.deckBWins, row.draws),
    sortValue: (row) => getRecordSortValue(row.deckAWins, row.deckBWins, row.draws),
  },
  {
    id: 'distribution',
    header: 'Распределение побед',
    headerTitle: 'Показываем, как делятся победы между этими двумя колодами.',
    defaultSortDirection: 'desc',
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
    sortValue: (row) => row.deckAWinRate,
  },
];

type PopularMatchupsTableProps = {
  items: PopularMatchupItem[];
  initialLimit?: number;
  expandable?: boolean;
};

export function PopularMatchupsTable({
  items,
  initialLimit = 5,
  expandable = false,
}: PopularMatchupsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = useMemo(() => {
    if (!expandable || isExpanded) {
      return items;
    }

    return items.slice(0, initialLimit);
  }, [expandable, initialLimit, isExpanded, items]);

  const hiddenItemsCount = Math.max(0, items.length - visibleItems.length);

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Частые матчапы</h2>
          <p className="section-header__description">
            Пары колод, которые чаще всего встречались между собой. Сначала показываем самые частые встречи, а детали
            можно раскрыть ниже.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={visibleItems}
        emptyMessage="Когда по этим фильтрам накопятся встречи между колодами, здесь появятся матчапы."
        getRowKey={(row) => `${row.deckA.id}-${row.deckB.id}`}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
      {expandable && items.length > initialLimit ? (
        <div className="section-actions">
          <Button
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
            variant="ghost"
          >
            {isExpanded
              ? 'Свернуть список'
              : hiddenItemsCount > 0
                ? `Показать ещё ${hiddenItemsCount}`
                : 'Показать все матчапы'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
