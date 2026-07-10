import { describe, expect, it } from 'vitest';
import { buildEntityPath } from '@/shared/lib/entityPaths';

describe('buildEntityPath', () => {
  it('builds stable routes by id', () => {
    expect(buildEntityPath('tournament', 'tournament_123')).toBe('/tournaments/tournament_123');
    expect(buildEntityPath('player', 'player_123')).toBe('/players/player_123');
    expect(buildEntityPath('deck', 'deck_123')).toBe('/decks/deck_123');
  });
});

