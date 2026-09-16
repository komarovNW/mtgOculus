import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllDecks } from '@/entities/deck/api';
import { getAllPlayers } from '@/entities/player/api';
import { getAllTournaments } from '@/entities/tournament/api';

afterEach(() => vi.unstubAllGlobals());

function pageResponse(page: number, hasMore: boolean) {
  return new Response(JSON.stringify({
    count: 3,
    // The server returns one row even though the client requested 100.
    next: hasMore ? `http://api.invalid/list?page=${page + 1}` : null,
    previous: null,
    appliedFilters: {},
    results: [{
      id: page,
      deck: { id: page, name: `Deck ${page}` },
      player: { id: page, name: `Player ${page}` },
    }],
  }));
}

describe.each([
  ['decks', getAllDecks],
  ['players', getAllPlayers],
  ['tournaments', getAllTournaments],
] as const)('%s full-selection fallback', (_name, getAll) => {
  it('follows next despite a capped page size and keeps the filters and signal', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      const page = Number(new URL(input).searchParams.get('page'));
      return pageResponse(page, page < 3);
    });
    vi.stubGlobal('fetch', fetchMock);

    const items = await getAll({ cityId: 'test-city', formatId: 'test-format' }, { signal: controller.signal });

    expect(items).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [index, call] of fetchMock.mock.calls.entries()) {
      const url = new URL(call[0]);
      expect(url.searchParams.get('page')).toBe(String(index + 1));
      expect(url.searchParams.get('cityId')).toBe('test-city');
      expect(url.searchParams.get('formatId')).toBe('test-format');
      expect(call[1].signal).toBe(controller.signal);
      // Never follow the backend's absolute next URL (it can even use HTTP).
      expect(url.hostname).not.toBe('api.invalid');
    }
  });

  it('does not publish partial aggregates when a later page fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(pageResponse(1, true))
      .mockResolvedValueOnce(new Response('{}', { status: 503 })));
    await expect(getAll({})).rejects.toMatchObject({ status: 503 });
  });

  it('stops the page sequence when its query is cancelled', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(async () => {
      controller.abort();
      return pageResponse(1, true);
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getAll({}, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty page with next instead of looping forever', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      count: 3, next: 'http://api.invalid/list?page=2', previous: null, appliedFilters: {}, results: [],
    })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getAll({})).rejects.toMatchObject({ code: 'INVALID_PAGINATION' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not call an incomplete selection complete when next disappears early', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(pageResponse(1, false)));
    await expect(getAll({})).rejects.toMatchObject({ code: 'INVALID_PAGINATION' });
  });
});
