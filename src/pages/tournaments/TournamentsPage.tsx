import { useQuery } from '@tanstack/react-query';
import { getTournaments } from '@/entities/tournament/api';
import type { TournamentListItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

const columns: TableColumn<TournamentListItem>[] = [
  { id: 'date', header: 'Дата', render: (row) => formatDate(row.date) },
  {
    id: 'title',
    header: 'Турнир',
    render: (row) => (
      <EntityLink
        id={row.id}
        name={row.title}
        type="tournament"
      />
    ),
  },
  {
    id: 'type',
    header: 'Тип',
    render: (row) => <Badge variant="accent">{row.type === 'daily' ? 'Дейлик' : 'Турнир'}</Badge>,
  },
  { id: 'club', header: 'Клуб', render: (row) => row.club.name },
  { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge> },
  { id: 'players', header: 'Игроков', align: 'right', render: (row) => row.playersCount },
  { id: 'rounds', header: 'Раундов', align: 'right', render: (row) => row.roundsCount },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  {
    id: 'winner',
    header: 'Победитель',
    render: (row) =>
      row.winner ? (
        <EntityLink
          id={row.winner.player.id}
          name={row.winner.player.name}
          type="player"
        />
      ) : (
        '—'
      ),
  },
];

export function TournamentsPage() {
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const tournamentsQuery = useQuery({
    queryKey: ['tournaments', apiFilters],
    queryFn: () => getTournaments({ ...apiFilters, page: 1, limit: 50 }),
  });

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(tournamentsQuery.data?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Общий список загруженных событий с быстрым переходом на detail-страницы."
        eyebrow="Турниры"
        title="Турниры"
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {tournamentsQuery.isLoading ? <LoadingState description="Собираем список турниров." /> : null}
      {tournamentsQuery.isError ? (
        <ErrorState
          description={getErrorMessage(tournamentsQuery.error, 'Не удалось загрузить турниры.')}
          onRetry={() => {
            void tournamentsQuery.refetch();
          }}
        />
      ) : null}

      {tournamentsQuery.isSuccess ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Все турниры</h2>
              <p className="section-header__description">
                Найдено {tournamentsQuery.data.pagination.total} событий по текущему фильтру.
              </p>
            </div>
          </div>
          <Table
            columns={columns}
            data={tournamentsQuery.data.items}
            emptyMessage="Пока нет турниров по выбранным фильтрам."
            getRowKey={(row) => row.id}
          />
        </Card>
      ) : null}
    </div>
  );
}

