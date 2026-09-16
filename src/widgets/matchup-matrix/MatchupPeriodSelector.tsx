import { useId } from 'react';
import {
  datePresetDays,
  getActiveDatePreset,
  getDatePresetRange,
  type DatePreset,
  type DateRange,
} from '@/shared/lib/datePresets';
import { formatDate } from '@/shared/lib/formatDate';
import { Button } from '@/shared/ui/Button';

type MatchupPeriodSelectorProps = {
  range: DateRange;
  onChange: (range: DateRange) => void;
};

export function MatchupPeriodSelector({ range, onChange }: MatchupPeriodSelectorProps) {
  const labelId = useId();
  const active = getActiveDatePreset(range);
  const dates = range.dateFrom && range.dateTo
    ? `${formatDate(range.dateFrom)} — ${formatDate(range.dateTo)}`
    : range.dateFrom ? `с ${formatDate(range.dateFrom)}` : `по ${formatDate(range.dateTo)}`;

  function selectPeriod(preset: DatePreset) {
    const next = getDatePresetRange(preset);
    if (next.dateFrom !== range.dateFrom || next.dateTo !== range.dateTo) onChange(next);
  }

  return (
    <div className="matchup-period" role="group" aria-labelledby={labelId}>
      <span className="field__label" id={labelId}>Период</span>
      <div className="matchup-period__buttons">
        {datePresetDays.map((days) => (
          <Button key={days} type="button" className="matchup-period__button"
            aria-pressed={active === days} variant={active === days ? 'primary' : 'secondary'}
            onClick={() => selectPeriod(days)}>
            {days} дней
          </Button>
        ))}
        <Button type="button" className="matchup-period__button"
          aria-pressed={active === 'all'} variant={active === 'all' ? 'primary' : 'secondary'}
          onClick={() => selectPeriod('all')}>
          Всё время
        </Button>
      </div>
      <div className="matchup-period__summary" role="status" aria-live="polite">
        {active === 'all' ? 'За всё время' : `${active === null ? 'Свой период: ' : ''}${dates} · включительно`}
      </div>
      <p className="field__hint matchup-period__hint">
        Последние дни, включая сегодня. Выбор сразу обновляет даты в фильтрах выше.
      </p>
    </div>
  );
}
