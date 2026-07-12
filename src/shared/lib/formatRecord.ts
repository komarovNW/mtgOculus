export const MATCH_RECORD_LABEL = 'Результат матчей';
export const MATCH_RECORD_HINT = 'Сначала идут победы, потом поражения, а если были ничьи, показываем их третьим числом.';
export const WIN_RATE_LABEL = 'Процент побед';
export const WIN_RATE_HINT = 'Доля выигранных матчей по этим фильтрам.';
export const GAME_WIN_RATE_LABEL = 'Процент побед по играм';
export const GAME_WIN_RATE_HINT = 'Доля выигранных игр внутри матчей.';
export const GAME_SCORE_HINT = 'Счёт по отдельным играм внутри матча: сначала победы одной стороны, потом другой.';
export const TOURNAMENT_PARTICIPATIONS_LABEL = 'Участий в турнирах';
export const TOURNAMENT_PARTICIPATIONS_HINT =
  'Сколько раз игрок или колода вообще попадали в турниры. Если один и тот же игрок сыграл три турнира, это считается как три участия.';
export const SMALL_SAMPLE_HINT = 'Матчей пока мало, поэтому процент побед здесь может заметно меняться.';
export const MATCHUP_SMALL_SAMPLE_HINT =
  'Матчей в этом матчапе пока мало, поэтому расклад ещё может сильно измениться.';

export function formatRecord(wins?: number | null, losses?: number | null, draws?: number | null) {
  if (wins === undefined || wins === null || losses === undefined || losses === null) {
    return '—';
  }

  const safeDraws = draws ?? 0;

  if (safeDraws > 0) {
    return `${wins}-${losses}-${safeDraws}`;
  }

  return `${wins}-${losses}`;
}

export function getRecordSortValue(wins?: number | null, losses?: number | null, draws?: number | null) {
  if (wins === undefined || wins === null || losses === undefined || losses === null) {
    return null;
  }

  const safeDraws = draws ?? 0;

  return wins * 10000 + safeDraws * 100 - losses;
}

export function getRecordSortValueFromString(record?: string | null) {
  if (!record) {
    return null;
  }

  const [winsRaw, lossesRaw, drawsRaw = '0'] = record.split('-');
  const wins = Number(winsRaw);
  const losses = Number(lossesRaw);
  const draws = Number(drawsRaw);

  if ([wins, losses, draws].some((value) => Number.isNaN(value))) {
    return null;
  }

  return getRecordSortValue(wins, losses, draws);
}
