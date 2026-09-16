import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { matchupsQueryOptions } from '@/entities/matchup/queries';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { MatchupMatrix } from '@/widgets/matchup-matrix/MatchupMatrix';
import { MatchupPeriodSelector } from '@/widgets/matchup-matrix/MatchupPeriodSelector';

function MatrixSize({ top, onApply }: { top: number; onApply: (top: number) => void }) {
  const [value, setValue] = useState(String(top));
  return (
    <form className="matchup-size" onSubmit={(event) => {
      event.preventDefault();
      const next = Number(value);
      if (Number.isInteger(next) && next >= 2 && next <= 40) onApply(next);
    }}>
      <Input label="Колод в матрице" type="number" min={2} max={40} step={1} required
        value={value} onChange={(event) => setValue(event.target.value)} />
      <Button type="submit" variant="secondary">Применить размер</Button>
    </form>
  );
}

export function MatchupsPage() {
  const { filters, apiFilters, searchParams, setFilters, resetFilters, updateQueryParams } = useDashboardFilters();
  const requestedTop = Number(searchParams.get('top') ?? 15);
  const top = Number.isInteger(requestedTop) && requestedTop >= 2 && requestedTop <= 40 ? requestedTop : 15;
  const invalidDates = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const query = useQuery({
    ...matchupsQueryOptions({ ...apiFilters, formatId: filters.formatId, top }),
    enabled: Boolean(filters.formatId) && !invalidDates,
  });
  const data = query.data;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Статистика колод" title="Матрица матчапов"
        description="Сравните колоды между собой: против кого они чаще побеждают и сколько матчей стоит за результатом."
        badges={query.isSuccess && filters.formatId && !invalidDates
          ? getAppliedFilterLabels(data?.appliedFilters).map((label) => <Badge key={label}>{label}</Badge>) : undefined} />
      <FiltersPanel filters={filters} onChange={setFilters} onReset={resetFilters} requireFormat />
      <Card className="matchup-toolbar">
        <div>
          <h2 className="section-header__title">Параметры матрицы</h2>
          <p className="section-header__description">От 2 до 40 колод за выбранный период. Город, клуб, формат и тип события задаются в фильтрах выше.</p>
        </div>
        <div className="matchup-controls">
          <MatrixSize key={top} top={top} onApply={(next) => updateQueryParams({ top: String(next) })} />
          <MatchupPeriodSelector range={filters} onChange={setFilters} />
        </div>
      </Card>
      {!filters.formatId ? (
        <EmptyState title="Выберите формат" description="Для сравнения матчапов нужен один формат. Укажите его в фильтрах выше." />
      ) : invalidDates ? (
        <EmptyState title="Проверьте период" description="Дата начала должна быть не позже даты окончания." />
      ) : query.isLoading ? (
        <LoadingState title="Загружаем матрицу матчапов…" description="Получаем результаты колод по выбранным фильтрам." />
      ) : query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : data?.decks.length ? (
        <MatchupMatrix key={JSON.stringify([apiFilters, top, data.decks.map((deck) => deck.id)])} data={data} isFetching={query.isFetching} />
      ) : query.isSuccess ? (
        <EmptyState title="Матчапы не найдены" description="По этим фильтрам пока нет данных. Попробуйте расширить период или выбрать другой город, клуб или формат." />
      ) : null}
    </div>
  );
}
