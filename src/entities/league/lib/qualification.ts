import type { LeagueDetails, LeagueStanding } from '@/shared/api/types';

type Assessment = NonNullable<LeagueStanding['qualification']>;
type Group = NonNullable<LeagueDetails['qualification']>['groups'][number];
type Metric = 'tournamentPoints' | 'bonusPoints' | 'tournamentsPlayed' | 'xOneCount';

// This policy belongs only to Portal's autumn league, not to every league.
export function isPortalAutumnLeague(league: LeagueDetails) {
  return /^(портал|portal)$/iu.test(league.club.name.trim())
    && /осенн/iu.test(league.name)
    && league.dateStart.slice(5, 10) === '09-01'
    && league.dateEnd.slice(5, 7) === '11';
}

// Existing prequalification comments identify Store Championships by month/date.
// Merge evidence from both API representations; repeated records are not extra slots.
function championshipMonths(comment: string): number[] {
  const months = new Set<number>();
  if (/сентябр|september/iu.test(comment)) months.add(9);
  if (/ноябр|november/iu.test(comment)) months.add(11);
  for (const match of comment.matchAll(/\b\d{1,2}[./](09|11)(?:[./]\d{2,4})?\b|\b\d{4}-(09|11)-\d{2}\b/g)) {
    months.add(Number(match[1] ?? match[2]));
  }
  return [...months];
}

function compare(left: LeagueStanding, right: LeagueStanding, metrics: Metric[]) {
  for (const metric of metrics) {
    const difference = right[metric] - left[metric];
    if (difference !== 0) return difference;
  }
  return 0;
}

/** Pure projection: never changes the server's statistics or official table order. */
export function calculatePortalAutumnQualification(league: LeagueDetails): LeagueDetails {
  if (!isPortalAutumnLeague(league) || league.qualification) return league;

  const confirmed = new Map<string, {
    player: LeagueStanding['player']; comments: Set<string>; months: Set<number>;
  }>();
  const records = [
    ...league.prequalified,
    ...league.standings.filter((row) => row.zone === 'prequalified').map((row) => ({
      player: row.player, comment: row.prequalifiedComment ?? '',
    })),
  ];
  for (const record of records) {
    const entry = confirmed.get(record.player.id) ?? {
      player: record.player, comments: new Set<string>(), months: new Set<number>(),
    };
    if (record.comment) entry.comments.add(record.comment);
    championshipMonths(record.comment).forEach((month) => entry.months.add(month));
    confirmed.set(record.player.id, entry);
  }

  const repeats = [...confirmed.values()].filter((entry) => entry.months.size === 2).length;
  const storeSlots = 8 - repeats;
  // Invalid source data must not silently create more than sixteen places.
  if (confirmed.size > storeSlots || [9, 11].some((month) =>
    [...confirmed.values()].filter((entry) => entry.months.has(month)).length > 4)) return league;

  const selected = new Set(confirmed.keys());
  const assessments = new Map<string, Assessment>();
  for (const row of league.standings) {
    const entry = confirmed.get(row.player.id);
    assessments.set(row.player.id, {
      status: entry ? 'confirmed' : 'outside',
      reason: entry ? [...entry.comments].join('; ') || 'Топ-4 Store Championship'
        : 'Сейчас вне проходных мест по очкам, Podval Points и посещениям.',
      paths: [],
    });
  }

  const remainingStoreSlots = storeSlots - confirmed.size;
  const groups: Group[] = [{
    key: 'store_championships', label: 'Store Championship: сентябрь и ноябрь', slots: storeSlots,
    description: `${confirmed.size} игроков уже обеспечили место.${remainingStoreSlots > 0
      ? ` Ещё ${remainingStoreSlots} мест зарезервировано под результаты Store Championship.` : ''}${repeats > 0
      ? ` Повторных квалификаций: ${repeats}; столько же мест передано в отбор по очкам.` : ''}`,
    entries: [...confirmed.values()].map((entry) => ({
      player: entry.player, status: 'confirmed',
      reason: [...entry.comments].join('; ') || 'Топ-4 Store Championship',
    })),
  }];
  if ([...confirmed.values()].every((entry) => entry.months.size > 0)) {
    groups.splice(0, 1, ...[9, 11].map((month): Group => {
      const slots = month === 9 ? 4 : 4 - repeats;
      const entries = [...confirmed.values()].filter((entry) => entry.months.has(month)
        && (month === 9 || !entry.months.has(9))).map((entry) => ({
        player: entry.player, status: 'confirmed' as const, reason: [...entry.comments].join('; '),
      }));
      return {
        key: `store_${month}`, label: `${month === 9 ? 'Сентябрьский' : 'Ноябрьский'} Store Championship`,
        slots, entries,
        description: `${entries.length} игроков обеспечили место.${entries.length < slots
          ? ` Ожидаются результаты для остальных мест: ${slots - entries.length}.` : ''}${month === 11 && repeats > 0
          ? ` Повторных квалификаций: ${repeats}; эти места переданы в отбор по очкам.` : ''}`,
      };
    }));
  }

  const stages: Array<{ key: string; label: string; slots: number; metrics: Metric[] }> = [
    { key: 'league_points', label: 'Очки лиги', slots: 4 + repeats, metrics: ['tournamentPoints', 'bonusPoints', 'xOneCount'] },
    { key: 'podval_points', label: 'Podval Points', slots: 3, metrics: ['bonusPoints', 'tournamentPoints', 'xOneCount'] },
    { key: 'attendance', label: 'Посещения', slots: 1, metrics: ['tournamentsPlayed', 'tournamentPoints', 'bonusPoints'] },
  ];
  let blockedByTie = '';
  for (const stage of stages) {
    const group: Group = {
      key: stage.key, label: stage.label, slots: stage.slots, entries: [],
      description: 'Среди игроков, ещё не прошедших другими способами.',
    };
    groups.push(group);
    if (stage.key === 'league_points' && repeats > 0) {
      group.description += ` Дополнительных мест за повторный топ-4: ${repeats}.`;
    }
    const candidates = league.standings.filter((row) => !selected.has(row.player.id));
    if (blockedByTie) {
      group.description = `Распределение зависит от решения равенства в категории «${blockedByTie}».`;
      for (const row of candidates) assessments.get(row.player.id)!.paths.push({
        label: stage.label, description: group.description,
      });
      continue;
    }
    candidates.sort((a, b) => compare(a, b, stage.metrics));
    let certainCount = Math.min(stage.slots, candidates.length);
    const cutoff = candidates[stage.slots - 1];
    const firstOutside = candidates[stage.slots];
    if (cutoff && firstOutside && compare(cutoff, firstOutside, stage.metrics) === 0) {
      while (certainCount > 0 && compare(candidates[certainCount - 1], cutoff, stage.metrics) === 0) certainCount--;
      blockedByTie = stage.label;
      group.description += ' На границе мест равенство: требуется решение организатора.';
    }

    let position = 1;
    candidates.forEach((row, index) => {
      if (index > 0 && compare(candidates[index - 1], row, stage.metrics) !== 0) position = index + 1;
      const assessment = assessments.get(row.player.id)!;
      const gap = cutoff ? cutoff[stage.metrics[0]] - row[stage.metrics[0]] : 0;
      const description = `${position}-е место в отборе; доступно мест: ${stage.slots}.${gap > 0
        ? ` До текущей границы по основному показателю: ${gap}.` : index >= stage.slots && !blockedByTie
          ? ' Основной показатель равен проходному, ниже по дополнительным показателям.' : ''}`;
      assessment.paths.push({ label: stage.label, description });
      if (index < certainCount) {
        selected.add(row.player.id);
        assessment.status = 'provisional';
        assessment.reason = `Проходит по категории «${stage.label}».`;
        group.entries.push({ player: row.player, status: 'provisional', reason: description });
      } else if (blockedByTie) {
        assessment.status = 'unresolved';
        assessment.reason = `Итоговый отбор зависит от решения равенства в категории «${stage.label}».`;
      }
    });
    if (candidates.length < stage.slots) group.description += ` Пока недостаточно игроков: ${candidates.length} из ${stage.slots}.`;
  }

  return {
    ...league,
    bonusPointsLabel: league.bonusPointsLabel ?? 'Podval Points',
    qualification: { totalSlots: 16, groups },
    standings: league.standings.map((row) => ({ ...row, qualification: assessments.get(row.player.id) })),
  };
}
