import type { TournamentDetailsResponse, TournamentRoundMatch } from '@/shared/api/types';
import { formatPlayoffStage } from './formatPlayoffStage';
import { getTournamentMatchKind, getTournamentStandingHighlights } from './tournamentInsights';

export function getPlayerTournamentMatches(details: TournamentDetailsResponse, playerId: string) {
  const stages = [
    ...details.rounds.map((round) => ({ label: `Раунд ${round.roundNumber}`, matches: round.matches })),
    ...(details.playoff ?? []).map((stage) => ({ label: formatPlayoffStage(stage.topN), matches: stage.matches })),
  ];
  return stages.flatMap((stage, stageIndex) => stage.matches.flatMap((match, matchIndex) => {
    const isA = match.playerA.id === playerId;
    if (!isA && match.playerB.id !== playerId) return [];
    const kind = getTournamentMatchKind(match);
    return [{
      key: `${stageIndex}-${matchIndex}`,
      stage: stage.label,
      opponent: isA ? match.playerB : match.playerA,
      score: kind === 'bye' ? 'BYE' : kind === 'unknown' ? 'Нет данных' : orientMatchScore(match, isA),
      result: kind === 'bye' ? 'BYE' : kind === 'unknown' ? 'Нет данных'
        : match.winnerPlayerId === playerId ? 'Победа'
          : match.winnerPlayerId ? 'Поражение' : match.playerA.score === match.playerB.score ? 'Ничья' : 'Нет данных',
      kind,
    }];
  }));
}

export function orientMatchScore(match: TournamentRoundMatch, isPlayerA: boolean) {
  if (isPlayerA) return match.scoreText;
  const parts = match.scoreText.trim().split(/[-/]/);
  const suffix = parts.length === 3 && /^\d+$/.test(parts[2]) ? `-${parts[2]}` : '';
  return `${match.playerB.score}-${match.playerA.score}${suffix}`;
}

export function getDeckQualificationCounts(details: TournamentDetailsResponse) {
  const selected = getTournamentStandingHighlights(details);
  const decks = new Map(details.playerDecks.map((entry) => [entry.player.id, entry.deck]));
  const counts = new Map<string, number>();
  for (const row of details.standings) {
    const deck = row.deck ?? decks.get(row.player.id);
    if (deck && selected.has(row.player.id)) counts.set(deck.id, (counts.get(deck.id) ?? 0) + 1);
  }
  return counts;
}
