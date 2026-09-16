import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMatchups } from '@/entities/matchup/api';
import { mapMatchupMatrixResponse } from '@/shared/api/matchup-mappers';
import { matchupResponse } from '@/test/fixtures/matchups';

afterEach(() => vi.unstubAllGlobals());

describe('matchup API', () => {
  it('aligns rows by ID, preserves opponent indices and server statistics including draws', () => {
    const result = mapMatchupMatrixResponse(matchupResponse());
    expect(result.decks.map((deck) => deck.id)).toEqual(['0', '22', '30']);
    expect(result.rows.map((row) => row.deck.id)).toEqual(['0', '22', '30']);
    expect(result.rows[0].cells[1]).toMatchObject({ winRate: 66.67, draws: 1 });
    expect(result.rows[1].cells[0]).toMatchObject({ winRate: 0, draws: 1 });
    expect(result.rows[0].cells[0]).toBeNull();
    expect(result.rows[0].cells[2]).toBeNull();
    expect(result.rows[0].overall?.matchesCount).toBe(100);
    expect(result.rows[0].deck.colors).toEqual(['U', 'B']);
    expect(result.rows[1].deck.colors).toBeNull();
    expect(result.rows[2].deck.colors).toEqual(['G']);
  });

  it('rejects ambiguous or incomplete matrices instead of displaying mismatched opponents', () => {
    const missingCell = matchupResponse();
    missingCell.rows[0].cells.pop();
    const duplicateRow = matchupResponse();
    duplicateRow.rows[0] = duplicateRow.rows[1];
    const unknownDeck = matchupResponse();
    unknownDeck.rows[0].deck = { id: 999, name: 'Unknown' };
    const duplicateColumn = matchupResponse();
    duplicateColumn.decks[0] = duplicateColumn.decks[1];
    [missingCell, duplicateRow, unknownDeck, duplicateColumn].forEach((response) => {
      expect(() => mapMatchupMatrixResponse(response)).toThrow('Не удалось сопоставить');
    });
  });

  it('makes one cancellable request with all filters and no deck detail requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(matchupResponse())));
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;
    await getMatchups({ cityId: 'moscow', clubId: 'club', formatId: 'legacy', tournamentType: 'daily',
      dateFrom: '2026-01-01', dateTo: '2026-09-06', top: 3 }, { signal });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url).pathname).toBe('/api/v1/matchups');
    expect(Object.fromEntries(new URL(url).searchParams)).toEqual({ cityId: 'moscow', clubId: 'club', formatId: 'legacy',
      tournamentType: 'daily', dateFrom: '2026-01-01', dateTo: '2026-09-06', top: '3' });
    expect(options).toEqual({ method: 'GET', signal });
  });
});
