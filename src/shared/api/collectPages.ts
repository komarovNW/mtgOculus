import { AppError, type RequestOptions } from '@/shared/api/client';
import type { Pagination } from '@/shared/api/types';
import { getNextPageParam } from '@/shared/lib/pagination';

/** Compatibility path until the API provides aggregates for the full selection. */
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; pagination: Pagination }>,
  options?: RequestOptions,
): Promise<T[]> {
  const items: T[] = [];
  let page: number | undefined = 1;
  let expectedTotal: number | undefined;

  // Follow hasMore (the API's next), not count / the requested page size:
  // the server may cap page_size. Avoid flooding it with every page at once.
  while (page !== undefined) {
    options?.signal?.throwIfAborted();
    const response = await fetchPage(page);
    options?.signal?.throwIfAborted();
    const nextPage = getNextPageParam(response);
    expectedTotal ??= response.pagination.total;
    items.push(...response.items);

    if (
      response.pagination.total !== expectedTotal ||
      items.length > expectedTotal ||
      (nextPage === undefined && items.length !== expectedTotal) ||
      (nextPage !== undefined && (response.items.length === 0 || nextPage <= page))
    ) {
      throw new AppError({
        code: 'INVALID_PAGINATION',
        message: 'Не удалось загрузить полную статистику. Попробуйте ещё раз.',
      });
    }

    page = nextPage;
  }

  return items;
}
