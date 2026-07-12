import { cn } from '@/shared/lib/cn';
import { useState, type ReactNode } from 'react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { InfoHint } from '@/shared/ui/InfoHint';

type SortDirection = 'asc' | 'desc';
type SortValue = string | number | boolean | Date | null | undefined;

export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  headerTitle?: string;
  sortLabel?: string;
  sortValue?: (row: T, index: number) => SortValue;
  defaultSortDirection?: SortDirection;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  emptyMessage: string;
  getRowClassName?: (row: T, index: number) => string | undefined;
  layout?: 'auto' | 'fixed';
  minWidth?: number | string;
  defaultSort?: {
    columnId: string;
    direction: SortDirection;
  };
};

type SortState = {
  columnId: string;
  direction: SortDirection;
};

function compareValues(left: Exclude<SortValue, null | undefined>, right: Exclude<SortValue, null | undefined>) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  return String(left).localeCompare(String(right), 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
}

function getColumnSortLabel<T>(column: TableColumn<T>) {
  if (column.sortLabel) {
    return column.sortLabel;
  }

  if (typeof column.header === 'string') {
    return column.header;
  }

  return column.id;
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage,
  getRowClassName,
  layout = 'auto',
  minWidth,
  defaultSort,
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState | null>(defaultSort ?? null);

  if (data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  const rows = data.map((row, originalIndex) => ({
    row,
    originalIndex,
  }));

  const activeColumn = sortState ? columns.find((column) => column.id === sortState.columnId) : undefined;

  if (activeColumn?.sortValue && sortState) {
    rows.sort((left, right) => {
      const leftValue = activeColumn.sortValue?.(left.row, left.originalIndex);
      const rightValue = activeColumn.sortValue?.(right.row, right.originalIndex);
      const leftMissing = leftValue === null || leftValue === undefined;
      const rightMissing = rightValue === null || rightValue === undefined;

      if (leftMissing || rightMissing) {
        if (leftMissing && rightMissing) {
          return left.originalIndex - right.originalIndex;
        }

        return leftMissing ? 1 : -1;
      }

      const compared = compareValues(leftValue, rightValue);

      if (compared === 0) {
        return left.originalIndex - right.originalIndex;
      }

      return sortState.direction === 'asc' ? compared : -compared;
    });
  }

  function handleSort(column: TableColumn<T>) {
    if (!column.sortValue) {
      return;
    }

    setSortState((current) => {
      if (current?.columnId === column.id) {
        return {
          columnId: column.id,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        columnId: column.id,
        direction: column.defaultSortDirection ?? 'asc',
      };
    });
  }

  return (
    <div className="table-shell">
      <table
        className={cn('table', layout === 'fixed' && 'table--fixed')}
        style={
          minWidth !== undefined
            ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }
            : undefined
        }
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className={`table__cell table__cell--${column.align ?? 'left'}`}
                aria-sort={
                  sortState?.columnId === column.id
                    ? sortState.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <div className={cn('table__header-content', `table__header-content--${column.align ?? 'left'}`)}>
                  {column.sortValue ? (
                    <button
                      className={cn(
                        'table__sort-button',
                        `table__sort-button--${column.align ?? 'left'}`,
                        sortState?.columnId === column.id && 'table__sort-button--active',
                      )}
                      onClick={() => handleSort(column)}
                      title={`Сортировать по колонке ${getColumnSortLabel(column)}`}
                      type="button"
                    >
                      <span className="table__sort-label">{column.header}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'table__sort-indicator',
                          sortState?.columnId === column.id && 'table__sort-indicator--active',
                        )}
                      >
                        {sortState?.columnId === column.id ? (sortState.direction === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  ) : (
                    <span className="table__header-label">{column.header}</span>
                  )}
                  {column.headerTitle ? <InfoHint text={column.headerTitle} /> : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, originalIndex }, index) => (
            <tr
              key={getRowKey(row, originalIndex)}
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
