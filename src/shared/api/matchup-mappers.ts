import { mapAppliedFilters, type BackendAppliedFilters } from '@/shared/api/backend-mappers';
import { AppError } from '@/shared/api/client';
import type { DeckShort, MatchupMatrixResponse, MatchupStats } from '@/shared/api/types';

type BackendMatchupDeck = Omit<DeckShort, 'id' | 'colors'> & {
  id: number | string;
  colors?: string | string[] | null;
};

export type BackendMatchupMatrixResponse = {
  decks: BackendMatchupDeck[];
  rows: {
    deck: BackendMatchupDeck;
    metaShare: number;
    mirrorMatches: number;
    overall: MatchupStats | null;
    cells: (MatchupStats | null)[];
  }[];
  appliedFilters?: BackendAppliedFilters | null;
};

function mapDeck(deck: BackendMatchupDeck): DeckShort {
  const colors = Array.isArray(deck.colors) ? deck.colors : deck.colors?.split('');
  return {
    ...deck,
    id: String(deck.id),
    colors: colors?.map((color) => color.toUpperCase()).filter((color) => /^[WUBRGC]$/.test(color)) ?? null,
  };
}

export function mapMatchupMatrixResponse(raw: BackendMatchupMatrixResponse): MatchupMatrixResponse {
  const invalidMatrix = () => new AppError({
    code: 'INVALID_MATCHUP_MATRIX',
    message: 'Не удалось сопоставить колоды и результаты в матрице. Попробуйте загрузить её ещё раз.',
  });

  if (!Array.isArray(raw.decks) || !Array.isArray(raw.rows)) throw invalidMatrix();

  const decks = raw.decks.map(mapDeck);
  const rowsById = new Map(raw.rows.map((row) => [String(row.deck.id), row]));
  if (
    new Set(decks.map((deck) => deck.id)).size !== decks.length ||
    rowsById.size !== raw.rows.length || raw.rows.length !== decks.length
  ) throw invalidMatrix();

  // Only rows may be reordered: cell indices belong to the original decks array.
  // Reject incomplete rows instead of shifting results onto the wrong opponent.
  const rows = decks.map((deck) => {
    const row = rowsById.get(deck.id);
    if (!row || !Array.isArray(row.cells) || row.cells.length !== decks.length) throw invalidMatrix();
    return { ...row, deck };
  });

  return { decks, rows, appliedFilters: mapAppliedFilters(raw.appliedFilters) };
}
