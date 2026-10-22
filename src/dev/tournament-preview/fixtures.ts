import { mapTournamentDetailsResponse, type BackendTournamentDetailsResponse } from '@/shared/api/backend-mappers';

type Match = BackendTournamentDetailsResponse['rounds'][number]['matches'][number];
type Deck = NonNullable<BackendTournamentDetailsResponse['standings'][number]['deck']>;
const names = ['Александр Волков', 'Михаил Соколов', 'Дмитрий Орлов', 'Илья Морозов', 'Никита Лебедев', 'Андрей Козлов', 'Сергей Новиков', 'Павел Васильев'];
const decks: Deck[] = [
  { id: 1, name: 'Izzet Tempo', colors: ['U', 'R'] },
  { id: 2, name: 'Golgari Gardens', colors: ['B', 'G'] },
  { id: 3, name: 'Mono Red', colors: ['R'] },
  { id: 4, name: 'Azorius Familiars', colors: ['W', 'U'] },
  { id: 5, name: 'Affinity', colors: ['U', 'B', 'R'] },
];
const givenNames = ['Александр', 'Михаил', 'Дмитрий', 'Илья', 'Никита', 'Андрей', 'Сергей', 'Павел', 'Артём', 'Иван', 'Максим'];
const surnames = ['Громов', 'Белов', 'Зайцев', 'Крылов', 'Фомин', 'Романов', 'Егоров', 'Титов', 'Петров', 'Смирнов'];
const player = (id: number) => ({ id, name: names[id - 1] ?? `${givenNames[(id - 9) % givenNames.length]} ${surnames[Math.floor((id - 9) / givenNames.length)]}` });

function match(a: number, b: number | null, aWins: number, bWins: number, tableNumber: number, draws = 0): Match {
  return {
    tableNumber,
    playerA: { ...player(a), score: aWins },
    playerB: b === null ? null : { ...player(b), score: bWins },
    scoreText: `${aWins}-${bWins}${draws ? `-${draws}` : ''}`,
    winnerPlayerId: aWins === bWins ? null : aWins > bWins ? a : b,
    isBye: b === null,
  };
}

function buildFixture(withPlayoff: boolean): BackendTournamentDetailsResponse {
  const participants = withPlayoff ? 8 : 7;
  const rounds = withPlayoff ? [
    [match(1, 8, 2, 0, 1), match(2, 7, 2, 1, 2), match(3, 6, 2, 0, 3), match(4, 5, 2, 1, 4)],
    [match(1, 2, 2, 1, 1), match(3, 4, 2, 0, 2), match(5, 6, 2, 1, 3), match(7, 8, 2, 0, 4)],
    [match(1, 3, 2, 1, 1), match(2, 4, 2, 0, 2), match(5, 7, 2, 0, 3), match(6, 8, 2, 1, 4)],
  ] : [
    [match(1, 2, 2, 0, 1), match(3, 4, 1, 1, 2), match(5, 6, 2, 1, 3), match(7, null, 2, 0, 4)],
    [match(1, 5, 2, 1, 1), match(7, 3, 0, 2, 2), match(4, 2, 2, 1, 3), match(6, null, 2, 0, 4)],
    [match(1, 3, 2, 1, 1), match(4, 5, 2, 0, 2), match(6, 7, 2, 1, 3), match(2, null, 2, 0, 4)],
  ];
  const playoff = withPlayoff ? [
    { topN: 4, matches: [match(1, 5, 1, 2, 1), match(2, 3, 2, 0, 2)] },
    { topN: 2, matches: [match(5, 2, 2, 1, 1, 1)] },
  ] : [];
  const swissMatches = rounds.flat();
  const records = Array.from({ length: participants }, (_, index) => {
    const id = index + 1;
    const matches = swissMatches.filter((m) => m.playerA.id === id || m.playerB?.id === id);
    const wins = matches.filter((m) => m.winnerPlayerId === id).length;
    const draws = matches.filter((m) => m.winnerPlayerId === null).length;
    const losses = matches.length - wins - draws;
    return { id, matches, wins, draws, losses, points: wins * 3 + draws };
  }).sort((a, b) => b.points - a.points || a.id - b.id);
  const deckFor = (id: number) => !withPlayoff && id === 7 ? undefined : decks[(id - 1) % decks.length];
  const finalOrder = withPlayoff ? [5, 2, 1, 3, 4, 6, 7, 8] : records.map((r) => r.id);
  const standings = finalOrder.map((id, index) => {
    const r = records.find((item) => item.id === id)!;
    const gameWins = r.matches.reduce((n, m) => n + (m.playerA.id === id ? m.playerA.score : m.playerB!.score), 0);
    const gameLosses = r.matches.reduce((n, m) => n + (m.playerA.id === id ? m.playerB?.score ?? 0 : m.playerA.score), 0);
    return {
      rank: index + 1, swissRank: records.indexOf(r) + 1, player: player(id), deck: deckFor(id),
      record: `${r.wins}-${r.losses}${r.draws ? `-${r.draws}` : ''}`, points: r.points,
      matchWins: r.wins, matchLosses: r.losses, matchDraws: r.draws,
      gw: 100 * gameWins / (gameWins + gameLosses),
    };
  });
  const allMatches = [...swissMatches, ...playoff.flatMap((stage) => stage.matches)];
  const byesCount = allMatches.filter((m) => m.isBye).length;
  return {
    tournament: {
      id: withPlayoff ? 900001 : 900002,
      title: withPlayoff ? 'Осенний кубок' : 'Открытый турнир',
      date: withPlayoff ? '2026-10-18' : '2026-10-11', type: 'tournament',
      city: { id: 'moscow', name: 'Москва' },
      club: { id: 'portal_moscow', name: 'Портал', cityId: 'moscow' },
      format: { id: 'legacy', name: 'Legacy' }, playersCount: participants, roundsCount: 3,
      playoffSize: withPlayoff ? 4 : null,
      winner: withPlayoff ? { player: player(5), deck: deckFor(5) } : null,
      matchesCount: allMatches.length, pairingsCount: allMatches.length,
      playedMatchesCount: allMatches.length - byesCount, byesCount, sourceUrl: null,
    },
    standings,
    rounds: rounds.map((matches, index) => ({ roundNumber: index + 1, matches })),
    playoff,
    playerDecks: standings.map(({ player, deck, rank, record }) => ({ player, deck, rank, record })),
    metagame: decks.flatMap((deck) => {
      const entries = standings.filter((entry) => entry.deck?.id === deck.id);
      return entries.length ? [{ deck, playersCount: entries.length, metaShare: entries.length / standings.filter((entry) => entry.deck).length * 100, bestRank: Math.min(...entries.map((entry) => entry.rank)) }] : [];
    }),
  };
}

function buildLargeFixture(): BackendTournamentDetailsResponse {
  const ids = Array.from({ length: 109 }, (_, index) => index + 1);
  const points = new Map(ids.map((id) => [id, 0]));
  const opponents = new Map(ids.map((id) => [id, new Set<number>()]));
  const byes = new Set<number>();
  const rounds: BackendTournamentDetailsResponse['rounds'] = [];
  function pair(remaining: number[]): Array<[number, number]> | null {
    if (!remaining.length) return [];
    const [a, ...rest] = remaining;
    for (const b of rest) {
      if (opponents.get(a)!.has(b)) continue;
      const tail = pair(rest.filter((id) => id !== b));
      if (tail) return [[a, b], ...tail];
    }
    return null;
  }
  for (let roundNumber = 1; roundNumber <= 7; roundNumber++) {
    const ordered = [...ids].sort((a, b) => points.get(b)! - points.get(a)! || a - b);
    const bye = [...ordered].reverse().find((id) => !byes.has(id))!;
    byes.add(bye);
    const pairs = pair(ordered.filter((id) => id !== bye));
    if (!pairs) throw new Error('Could not pair demo round');
    const matches = pairs.map(([a, b], index) => {
      const seed = (a * 31 + b * 17 + roundNumber * 13) % 19;
      opponents.get(a)!.add(b);
      opponents.get(b)!.add(a);
      return seed === 0 ? match(a, b, 1, 1, index + 1)
        : seed < 12 ? match(a, b, 2, seed % 2, index + 1)
          : match(a, b, seed % 2, 2, index + 1);
    });
    matches.push(match(bye, null, 2, 0, 55));
    for (const m of matches) {
      if (m.winnerPlayerId !== null) points.set(m.winnerPlayerId!, points.get(m.winnerPlayerId!)! + 3);
      else for (const id of [m.playerA.id, m.playerB!.id]) points.set(id, points.get(id)! + 1);
    }
    rounds.push({ roundNumber, matches });
  }
  const deckPool = [...decks, ...['Mono Blue Terror', 'Elves', 'Boros Synthesizer', 'Orzhov Blade', 'Walls Combo', 'Tron', 'Jund Wildfire'].map((name, index) => ({ id: index + 6, name }))];
  const swiss = ids.map((id) => {
    const matches = rounds.flatMap((r) => r.matches).filter((m) => m.playerA.id === id || m.playerB?.id === id);
    const matchWins = matches.filter((m) => m.winnerPlayerId === id).length;
    const matchDraws = matches.filter((m) => m.winnerPlayerId === null).length;
    const matchLosses = 7 - matchWins - matchDraws;
    const wins = matches.reduce((n, m) => n + (m.playerA.id === id ? m.playerA.score : m.playerB!.score), 0);
    const losses = matches.reduce((n, m) => n + (m.playerA.id === id ? m.playerB?.score ?? 0 : m.playerA.score), 0);
    return { player: player(id), deck: deckPool[(id * 7) % deckPool.length], points: points.get(id)!, matchWins, matchLosses, matchDraws, record: `${matchWins}-${matchLosses}${matchDraws ? `-${matchDraws}` : ''}`, gw: wins / (wins + losses) * 100 };
  });
  const ranked = swiss.map((entry) => {
    const rivals = [...opponents.get(entry.player.id)!].map((id) => swiss[id - 1]);
    return { ...entry, omw: rivals.reduce((n, r) => n + Math.max(1 / 3, r.points / 21), 0) / rivals.length * 100, ogw: rivals.reduce((n, r) => n + Math.max(100 / 3, r.gw), 0) / rivals.length };
  }).sort((a, b) => b.points - a.points || b.omw - a.omw || b.gw - a.gw || b.ogw - a.ogw || a.player.id - b.player.id)
    .map((entry, index) => ({ ...entry, swissRank: index + 1, rank: index + 1 }));
  const seeds = ranked.slice(0, 8).map((entry) => entry.player.id);
  let remaining = [seeds[0], seeds[7], seeds[3], seeds[4], seeds[1], seeds[6], seeds[2], seeds[5]];
  const playoff: NonNullable<BackendTournamentDetailsResponse['playoff']> = [];
  const eliminated = new Map<number, number>();
  for (const topN of [8, 4, 2]) {
    const matches: Match[] = [];
    for (let i = 0; i < remaining.length; i += 2) {
      const m = match(remaining[i], remaining[i + 1], i === 0 && topN !== 2 ? 1 : 2, i === 0 && topN !== 2 ? 2 : 1, i / 2 + 1);
      matches.push(m);
      eliminated.set(m.winnerPlayerId === m.playerA.id ? m.playerB!.id : m.playerA.id, topN);
    }
    playoff.push({ topN, matches });
    remaining = matches.map((m) => m.winnerPlayerId!);
  }
  eliminated.set(remaining[0], 1);
  const standings = [...ranked].sort((a, b) => (eliminated.get(a.player.id) ?? Infinity) - (eliminated.get(b.player.id) ?? Infinity) || a.swissRank - b.swissRank)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  const raw = buildFixture(true);
  return {
    ...raw,
    tournament: { ...raw.tournament, id: 900003, title: 'Большой кубок', date: '2026-10-20', playersCount: 109, roundsCount: 7, playoffSize: 8, winner: { player: standings[0].player, deck: standings[0].deck }, matchesCount: 392, pairingsCount: 392, playedMatchesCount: 385, byesCount: 7 },
    standings, rounds, playoff,
    playerDecks: standings.map(({ player, deck, rank, record }) => ({ player, deck, rank, record })),
    metagame: deckPool.map((deck) => {
      const entries = standings.filter((entry) => entry.deck.id === deck.id);
      return { deck, playersCount: entries.length, metaShare: entries.length / 109 * 100, bestRank: Math.min(...entries.map((entry) => entry.rank)) };
    }),
  };
}

export const tournamentPreviews = [
  { id: 'demo-playoff', description: '8 игроков · 3 раунда швейцарки · топ-4. Победитель поднимается с 4-го места на 1-е. В финале есть ничейная игра.', raw: buildFixture(true) },
  { id: 'demo-swiss', description: '7 игроков · 3 раунда · без плей-офф. Есть ничья, BYE и участник без колоды.', raw: buildFixture(false) },
  { id: 'demo-large', description: '109 игроков · 7 раундов швейцарки · топ-8. Четвертьфиналы, полуфиналы и финал, 12 колод и 7 BYE.', raw: buildLargeFixture() },
].map((item) => ({ ...item, details: mapTournamentDetailsResponse(item.raw) }));
