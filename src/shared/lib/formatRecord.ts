export const MATCH_RECORD_LABEL = 'Результат матчей';
export const MATCH_RECORD_HINT = 'Показываем результат в формате победы-поражения-ничьи.';
export const WIN_RATE_LABEL = 'Процент побед';
export const WIN_RATE_HINT = 'Показываем, какой процент матчей был выигран в турнирах по выбранным фильтрам.';
export const GAME_WIN_RATE_LABEL = 'Процент побед по играм';
export const GAME_WIN_RATE_HINT = 'Показываем, какой процент отдельных игр внутри матчей был выигран.';
export const GAME_SCORE_HINT = 'Показываем счёт по играм внутри матча: сначала победы одной стороны, потом другой.';
export const TOURNAMENT_PARTICIPATIONS_LABEL = 'Участий в турнирах';
export const TOURNAMENT_PARTICIPATIONS_HINT =
  'Сколько всего раз игроки или колоды появлялись на турнирах. Если один и тот же игрок сыграл три турнира, считаем три участия.';
export const SMALL_SAMPLE_HINT = 'Пока матчей мало, поэтому процент побед может быть нестабильным.';
export const MATCHUP_SMALL_SAMPLE_HINT =
  'В этом матчапе пока мало матчей, поэтому результаты могут заметно меняться.';

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
