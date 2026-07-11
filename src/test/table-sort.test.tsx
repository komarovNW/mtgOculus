import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { MATCH_RECORD_LABEL, formatRecord, getRecordSortValue } from '@/shared/lib/formatRecord';
import { Table, type TableColumn } from '@/shared/ui/Table';

type SortRow = {
  id: string;
  player: string;
  wins: number;
  losses: number;
  draws: number;
};

const rows: SortRow[] = [
  { id: '1', player: 'Борис', wins: 3, losses: 1, draws: 0 },
  { id: '2', player: 'Алексей', wins: 5, losses: 1, draws: 0 },
  { id: '3', player: 'Виктор', wins: 1, losses: 3, draws: 0 },
];

const columns: TableColumn<SortRow>[] = [
  {
    id: 'player',
    header: 'Игрок',
    render: (row) => row.player,
    sortValue: (row) => row.player,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    defaultSortDirection: 'desc',
    render: (row) => formatRecord(row.wins, row.losses, row.draws),
    sortValue: (row) => getRecordSortValue(row.wins, row.losses, row.draws),
  },
];

function getBodyRows() {
  return screen.getAllByRole('row').slice(1);
}

describe('Table sorting', () => {
  test('sorts by string columns on header click', async () => {
    const user = userEvent.setup();

    render(
      <Table
        columns={columns}
        data={rows}
        emptyMessage="Нет данных"
        getRowKey={(row) => row.id}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Игрок' }));

    expect(within(getBodyRows()[0]).getByText('Алексей')).toBeInTheDocument();
    expect(within(getBodyRows()[1]).getByText('Борис')).toBeInTheDocument();
    expect(within(getBodyRows()[2]).getByText('Виктор')).toBeInTheDocument();
  });

  test('toggles numeric sort direction for match records', async () => {
    const user = userEvent.setup();

    render(
      <Table
        columns={columns}
        data={rows}
        emptyMessage="Нет данных"
        getRowKey={(row) => row.id}
      />,
    );

    await user.click(screen.getByRole('button', { name: MATCH_RECORD_LABEL }));

    expect(within(getBodyRows()[0]).getByText('Алексей')).toBeInTheDocument();
    expect(within(getBodyRows()[2]).getByText('Виктор')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: MATCH_RECORD_LABEL }));

    expect(within(getBodyRows()[0]).getByText('Виктор')).toBeInTheDocument();
    expect(within(getBodyRows()[2]).getByText('Алексей')).toBeInTheDocument();
  });
});
