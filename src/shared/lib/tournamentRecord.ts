import type { PlayerMatchItem } from '@/shared/api/types';
import { getPlayerMatchKind } from '@/shared/lib/playerDetailInsights';

export type MatchRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export function parseMatchRecord(record: string): MatchRecord | null {
  const match = record.trim().match(/^(\d+)-(\d+)(?:-(\d+))?$/);

  if (!match) {
    return null;
  }

  return {
    wins: Number(match[1]),
    losses: Number(match[2]),
    draws: Number(match[3] ?? 0),
  };
}

export function addMatchRecords(left: MatchRecord, right: MatchRecord): MatchRecord {
  return {
    wins: left.wins + right.wins,
    losses: left.losses + right.losses,
    draws: left.draws + right.draws,
  };
}

export function getPlayoffRecords(matches: PlayerMatchItem[]) {
  const records = new Map<string, MatchRecord>();

  for (const match of matches) {
    if (match.playoffTopN == null || getPlayerMatchKind(match) !== 'played') {
      continue;
    }

    const record = records.get(match.tournament.id) ?? {
      wins: 0,
      losses: 0,
      draws: 0,
    };
    const resultKey = match.result === 'win'
      ? 'wins'
      : match.result === 'loss'
        ? 'losses'
        : 'draws';

    record[resultKey] += 1;
    records.set(match.tournament.id, record);
  }

  return records;
}
