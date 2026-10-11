import type { LeagueDetails, LeagueStanding } from '@/shared/api/types';

export type DemoScenario = 'september' | 'november' | 'tie';
const names = ['Алексей Северин', 'Мария Лескова', 'Илья Речной', 'Анна Заречная',
  'Дмитрий Ветров', 'Ольга Луговая', 'Павел Ясный', 'Елена Озерова',
  'Михаил Соснов', 'Софья Рябинина', 'Артём Кленов', 'Виктор Полянский',
  'Дарья Береговая', 'Роман Снегирёв', 'Наталья Рассветова', 'Тимофей Липов',
  'Вера Солнечная', 'Лев Дубравин', 'Ксения Тихова', 'Максим Родников',
  'Алиса Светлова', 'Глеб Листьев', 'Полина Ивовая', 'Матвей Холмов'];
// Entirely synthetic records: [wins, losses, draws]. Tuesday dailies have 3 rounds.
type Record = [number, number, number];
const repeat = (count: number, record: Record): Record[] => Array.from({ length: count }, () => record);

export function createDemoLeague(scenario: DemoScenario): LeagueDetails {
  const dates = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 8, 1 + index * 7));
    return date.toISOString().slice(0, 10);
  });
  const rules: LeagueDetails['rules'] = [
    { kind: 'exact', label: '12 очков без поражений', threshold: 12, requireUndefeated: true, points: 4 },
    { kind: 'exact', label: '10 очков без поражений', threshold: 10, requireUndefeated: true, points: 3 },
    { kind: 'exact', label: '9 очков во вторник без поражений', threshold: 9, requireUndefeated: true, points: 3 },
    { kind: 'exact', label: '7 очков во вторник без поражений', threshold: 7, requireUndefeated: true, points: 2 },
  ];
  const standings: LeagueStanding[] = names.map((name, index) => {
    const number = index + 1;
    let records: Record[];
    if (number <= 4 || number === 13) records = repeat(4, [2, 1, 0]);
    else if (number <= 8) records = repeat(17 - number, [2, 1, 0]);
    else if (number <= 11) records = repeat(14 - number, [3, 0, 0]);
    else if (number === 12) records = repeat(12, [0, 3, 0]);
    else if (number === 14) records = repeat(2, [3, 0, 0]);
    else if (number === 15) records = [[3, 0, 0]];
    else if (number === 16) records = [[2, 0, 1]];
    else records = repeat(number - 16, [1, 2, 0]);
    if (scenario === 'tie' && number === 9) records = repeat(9, [2, 1, 0]);
    const participations = records.map(([wins, losses, draws], i) => ({
      tournamentId: `demo-daily-${i}`, tournamentTitle: `Демо-дейлик №${i + 1}`,
      date: dates[i], tournamentPoints: wins * 3 + draws,
      rulePoints: losses === 0 ? (wins === 3 ? 3 : 2) : 0,
      manualBonusPoints: 0, bonusReason: '', counted: true,
    }));
    const bonusPoints = participations.reduce((sum, entry) => sum + entry.rulePoints, 0);
    const breakdown = rules.filter((rule) => participations.some((entry) => entry.tournamentPoints === rule.threshold && entry.rulePoints > 0))
      .map((rule) => {
        const timesApplied = participations.filter((entry) => entry.tournamentPoints === rule.threshold && entry.rulePoints > 0).length;
        return { ...rule, timesApplied, pointsPerTime: rule.points, points: rule.points * timesApplied };
      });
    return {
      player: { id: `demo-player-${number}`, name }, rank: 0, leagueRank: 0,
      tournamentPoints: participations.reduce((sum, entry) => sum + entry.tournamentPoints, 0),
      bonusPoints, rulePoints: bonusPoints, manualBonusPoints: 0, droppedTournamentPoints: 0,
      tournamentsPlayed: records.length, tournamentsCounted: records.length,
      xZeroCount: records.filter(([, losses, draws]) => losses === 0 && draws === 0).length,
      xOneCount: records.filter(([, losses, draws]) => losses + draws === 1).length,
      zone: null, prequalifiedComment: null, participations, breakdown,
    };
  });
  const prequalified = [1, 2, 3, 4].map((number) => ({
    player: standings[number - 1].player, comment: 'Топ-4 сентябрьского Store Championship', leagueRank: null,
  }));
  if (scenario === 'november') {
    prequalified.push(...[1, 5, 9, 13].map((number) => ({
      player: standings[number - 1].player, comment: 'Топ-4 ноябрьского Store Championship', leagueRank: null,
    })));
  }
  standings.sort((a, b) => b.tournamentPoints - a.tournamentPoints || b.bonusPoints - a.bonusPoints || b.xOneCount - a.xOneCount);
  standings.forEach((row, index) => { row.rank = index + 1; row.leagueRank = index + 1; });
  return {
    id: `demo-${scenario}`, name: 'Осенняя лига · демо', club: { id: 'demo-portal', name: 'Портал', cityId: 'demo-city' },
    format: { id: 'standard', name: 'Standard' }, dateStart: '2026-09-01', dateEnd: '2026-11-29',
    bestTournamentsCount: null, sort: ['tournamentPoints', 'bonusPoints', 'xOneCount'],
    columns: [{ position: 1, key: 'tournamentPoints', label: 'Очки лиги' },
      { position: 2, key: 'bonusPoints', label: 'Podval Points' },
      { position: 3, key: 'xOneCount', label: 'X−1 / X−0−1' }],
    bonusPointsLabel: 'Podval Points', cutoffs: {}, rules, prequalified, standings,
    tournaments: dates.map((date, i) => ({ id: `demo-daily-${i}`, title: `Демо-дейлик №${i + 1}`, date,
      playersCount: standings.filter((row) => row.participations.length > i).length })),
  };
}
