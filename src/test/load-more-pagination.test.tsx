import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getNextPageParam } from '@/shared/lib/pagination';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';

describe('list pagination', () => {
  it('returns the next page while the backend has more data', () => {
    expect(
      getNextPageParam({
        pagination: {
          page: 2,
          limit: 50,
          total: 120,
          totalPages: 3,
          hasMore: true,
        },
      }),
    ).toBe(3);
  });

  it('stops after the last page', () => {
    expect(
      getNextPageParam({
        pagination: {
          page: 3,
          limit: 50,
          total: 120,
          totalPages: 3,
          hasMore: false,
        },
      }),
    ).toBeUndefined();
  });

  it('shows progress and requests the next batch', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();

    render(
      <LoadMorePagination
        hasMore
        isLoading={false}
        loadedCount={50}
        onLoadMore={onLoadMore}
        totalCount={123}
      />,
    );

    expect(screen.getByText('Показано 50 из 123')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать ещё 50' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('hides the load button when every item is loaded', () => {
    render(
      <LoadMorePagination
        hasMore={false}
        isLoading={false}
        loadedCount={123}
        onLoadMore={() => undefined}
        totalCount={123}
      />,
    );

    expect(screen.getByText('Показано 123 из 123')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
