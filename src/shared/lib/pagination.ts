import type { Pagination } from '@/shared/api/types';

export const LIST_PAGE_SIZE = 50;

type PaginatedPage = {
  pagination: Pagination;
};

export function getNextPageParam(lastPage: PaginatedPage) {
  const { hasMore, page, totalPages } = lastPage.pagination;
  const canLoadMore = hasMore ?? (totalPages !== undefined && page < totalPages);

  return canLoadMore ? page + 1 : undefined;
}
