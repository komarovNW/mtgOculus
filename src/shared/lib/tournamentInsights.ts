import type {
  DeckShort,
  TournamentDetailsResponse,
  TournamentMatchPlayer,
  TournamentPlayerDeckItem,
} from '@/shared/api/types';

export type TournamentMetagameChartItem = {
  id: string;
  name: string;
  metaShare: number;
  playersCount: number;
};

export type WinnerPathItem = {
  roundNumber: number;
  tableNumber: number;
  opponent: TournamentMatchPlayer;
  scoreText: string;
  isBye: boolean;
};

export function getTournamentMatchKind(
  match: TournamentDetailsResponse['rounds'][number]['matches'][number],
) {
  if (match.kind) {
    return match.kind;
  }

  return match.isBye ? 'bye' : 'played';
}

function sortMetagame(
  items: TournamentDetailsResponse['metagame'],
) {
  return [...items].sort(
    (left, right) =>
      right.playersCount - left.playersCount ||
      right.metaShare - left.metaShare ||
      left.bestRank - right.bestRank ||
      left.deck.name.localeCompare(right.deck.name, 'ru'),
  );
}

function getWinnerPath(
  details: TournamentDetailsResponse,
): WinnerPathItem[] {
  const winnerId = details.tournament.winner?.player.id;

  if (!winnerId) {
    return [];
  }

  return details.rounds.flatMap((round) =>
    round.matches.flatMap((match) => {
      const winnerIsPlayerA = match.playerA.id === winnerId;
      const winnerIsPlayerB = match.playerB.id === winnerId;

      if (!winnerIsPlayerA && !winnerIsPlayerB) {
        return [];
      }

      if (getTournamentMatchKind(match) === 'unknown') {
        return [];
      }

      const opponent = winnerIsPlayerA ? match.playerB : match.playerA;
      const winnerScore = winnerIsPlayerA
        ? match.playerA.score
        : match.playerB.score;
      const opponentScore = winnerIsPlayerA
        ? match.playerB.score
        : match.playerA.score;

      return [{
        roundNumber: round.roundNumber,
        tableNumber: match.tableNumber,
        opponent,
        scoreText: match.isBye ? 'BYE' : `${winnerScore}-${opponentScore}`,
        isBye: match.isBye,
      }];
    }),
  ).sort(
    (left, right) =>
      left.roundNumber - right.roundNumber ||
      left.tableNumber - right.tableNumber,
  );
}

function getMetagameChartData(
  items: TournamentDetailsResponse['metagame'],
): TournamentMetagameChartItem[] {
  const sorted = sortMetagame(items);

  if (sorted.length <= 8) {
    return sorted.map((item) => ({
      id: item.deck.id,
      name: item.deck.name,
      metaShare: item.metaShare,
      playersCount: item.playersCount,
    }));
  }

  const visible = sorted.slice(0, 7);
  const other = sorted.slice(7);

  return [
    ...visible.map((item) => ({
      id: item.deck.id,
      name: item.deck.name,
      metaShare: item.metaShare,
      playersCount: item.playersCount,
    })),
    {
      id: 'other',
      name: 'Другие',
      metaShare: other.reduce((sum, item) => sum + item.metaShare, 0),
      playersCount: other.reduce((sum, item) => sum + item.playersCount, 0),
    },
  ];
}

export function getTournamentInsights(details: TournamentDetailsResponse) {
  const allPairings = details.rounds.flatMap((round) => round.matches);
  const playedMatches = allPairings.filter(
    (match) => getTournamentMatchKind(match) === 'played',
  );
  const byeCount = allPairings.filter(
    (match) => getTournamentMatchKind(match) === 'bye',
  ).length;
  const unknownResultsCount = allPairings.filter(
    (match) => getTournamentMatchKind(match) === 'unknown',
  ).length;
  const participantsWithDeck = details.playerDecks.filter(
    (item): item is TournamentPlayerDeckItem & { deck: DeckShort } =>
      Boolean(item.deck),
  );
  const uniqueDecksCount = new Set(
    participantsWithDeck.map((item) => item.deck.id),
  ).size;
  const sortedMetagame = sortMetagame(details.metagame);
  const highestPlayersCount = sortedMetagame[0]?.playersCount ?? 0;
  const undefeatedPlayers = details.standings.filter(
    (item) =>
      item.matchLosses === 0 &&
      item.matchWins + item.matchDraws > 0,
  );
  const winnerId = details.tournament.winner?.player.id;

  return {
    byeCount,
    deckCoverageCount: participantsWithDeck.length,
    metagameItems: sortedMetagame,
    missingDecksCount: Math.max(
      0,
      details.tournament.playersCount - participantsWithDeck.length,
    ),
    metagameChartData: getMetagameChartData(details.metagame),
    mostPopularDeck: sortedMetagame[0],
    mostPopularDecks: sortedMetagame.filter(
      (item) => item.playersCount === highestPlayersCount,
    ),
    playedMatchesCount: playedMatches.length,
    reportedPairingsCount: allPairings.length,
    singlePlayerDecksCount: details.metagame.filter(
      (item) => item.playersCount === 1,
    ).length,
    unknownResultsCount,
    undefeatedPlayers,
    uniqueDecksCount,
    winnerPath: getWinnerPath(details),
    winnerStanding: winnerId
      ? details.standings.find((item) => item.player.id === winnerId)
      : undefined,
  };
}
