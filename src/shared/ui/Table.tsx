import { cn } from '@/shared/lib/cn';
import type { ReactNode } from 'react';
import { EmptyState } from '@/shared/ui/EmptyState';

export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  headerTitle?: string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  emptyMessage: string;
  getRowClassName?: (row: T, index: number) => string | undefined;
};

export function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage,
  getRowClassName,
}: TableProps<T>) {
  if (data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="table-shell">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className={`table__cell table__cell--${column.align ?? 'left'}`}
                title={column.headerTitle}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={cn('table__row', getRowClassName?.(row, index))}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={`table__cell table__cell--${column.align ?? 'left'}`}
                >
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
