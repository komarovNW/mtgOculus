export type EntityType = 'tournament' | 'player' | 'deck';

export function buildEntityPath(type: EntityType, id: string) {
  if (type === 'tournament') {
    return `/tournaments/${id}`;
  }

  if (type === 'player') {
    return `/players/${id}`;
  }

  return `/decks/${id}`;
}

