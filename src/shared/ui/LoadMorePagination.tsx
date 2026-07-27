import { LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { Button } from '@/shared/ui/Button';

type LoadMorePaginationProps = {
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
  isLoading: boolean;
  isError?: boolean;
  onLoadMore: () => void;
};

export function LoadMorePagination({
  hasMore,
  loadedCount,
  totalCount,
  isLoading,
  isError = false,
  onLoadMore,
}: LoadMorePaginationProps) {
  if (totalCount === 0) {
    return null;
  }

  const remainingCount = Math.max(0, totalCount - loadedCount);

  return (
    <div
      aria-live="polite"
      className="load-more-pagination"
    >
      <span className="load-more-pagination__status">
        Показано {loadedCount} из {totalCount}
      </span>
      {isError ? <span className="load-more-pagination__error">Не удалось загрузить следующую страницу.</span> : null}
      {hasMore ? (
        <Button
          disabled={isLoading}
          onClick={onLoadMore}
          type="button"
          variant="ghost"
        >
          {isLoading
            ? 'Загружаем…'
            : remainingCount > 0
              ? `Показать ещё ${Math.min(LIST_PAGE_SIZE, remainingCount)}`
              : 'Показать ещё'}
        </Button>
      ) : null}
    </div>
  );
}
