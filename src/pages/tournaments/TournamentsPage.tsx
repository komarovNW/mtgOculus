import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/useAuth';
import { Link } from 'react-router-dom';
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
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.date),
    sortValue: (row) => row.date,
  },
  {
    id: 'title',
    header: 'Турнир',
    sortValue: (row) => row.title,
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
    sortValue: (row) => row.type,
    render: (row) => <Badge variant="accent">{row.type === 'daily' ? 'Дейлик' : 'Турнир'}</Badge>,
  },
  { id: 'club', header: 'Клуб', render: (row) => row.club.name, sortValue: (row) => row.club.name },
  { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge>, sortValue: (row) => row.format.name },
  {
    id: 'players',
    header: 'Игроков',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
  },
  {
    id: 'rounds',
    header: 'Раундов',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.roundsCount,
    sortValue: (row) => row.roundsCount,
  },
  {
    id: 'matches',
    header: 'Матчей',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'winner',
    header: 'Победитель',
    sortValue: (row) => row.winner?.player.name,
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
  const { hasPermission } = useAuth();
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const canCreateTournament = hasPermission('tournament:create');
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
        description="Здесь можно быстро найти нужный турнир, а потом открыть стендинги, пары и колоды участников."
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
          description={getErrorMessage(tournamentsQuery.error, 'Не получилось загрузить список турниров. Попробуйте обновить страницу или изменить фильтры.')}
          onRetry={() => {
            void tournamentsQuery.refetch();
          }}
        />
      ) : null}

      {tournamentsQuery.isSuccess ? (
        <>
          <Card
            className="insights-card"
            tone="muted"
          >
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Быстрый ориентир</h2>
                <p className="section-header__description">
                  Сначала смотрите свежие и крупные события, а потом открывайте нужный турнир, если нужны стендинги,
                  пары и метагейм.
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{tournamentsQuery.data.pagination.total}</div>
                <div className="insights-summary__title">турниров найдено</div>
                <p className="insights-summary__description">
                  Фильтры выше помогут быстро оставить только нужный клуб, формат или период.
                </p>
              </div>

              <div className="insights-list">
                {tournamentsQuery.data.items[0] ? (
                <article className="insight-item">
                  <div className="insight-item__title">Самый свежий турнир</div>
                  <div className="insight-item__body">
                      <EntityLink
                        id={tournamentsQuery.data.items[0].id}
                        name={tournamentsQuery.data.items[0].title}
                        type="tournament"
                      />{' '}
                      на {tournamentsQuery.data.items[0].playersCount} игроков.
                    </div>
                  </article>
                ) : null}

                {tournamentsQuery.data.items.length > 0 ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Самый большой турнир в списке</div>
                    <div className="insight-item__body">
                      {(() => {
                        const biggestTournament = [...tournamentsQuery.data.items].sort(
                          (left, right) => right.playersCount - left.playersCount || right.matchesCount - left.matchesCount,
                        )[0];

                        return (
                          <>
                            <EntityLink
                              id={biggestTournament.id}
                              name={biggestTournament.title}
                              type="tournament"
                            />{' '}
                            собрал {biggestTournament.playersCount} игроков и {biggestTournament.matchesCount} матчей.
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ) : null}

                <article className="insight-item">
                  <div className="insight-item__title">Что делать дальше</div>
                  <div className="insight-item__body">
                    Откройте турнир по названию, если хотите посмотреть итоговые места, пары по раундам и колоды всех
                    участников.
                  </div>
                </article>
              </div>
            </div>

            <div className="insights-actions">
              <Link
                className="button button--primary section-link"
                state={canCreateTournament ? undefined : { from: '/admin/tournaments/create' }}
                to={canCreateTournament ? '/admin/tournaments/create' : '/login'}
              >
                {canCreateTournament ? 'Добавить турнир' : 'Войти, чтобы добавить турнир'}
              </Link>
            </div>
          </Card>

          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Все турниры</h2>
                <p className="section-header__description">
                  Найдено {tournamentsQuery.data.pagination.total} турниров. Нажмите на турнир, чтобы открыть его
                  страницу.
                </p>
              </div>
            </div>
            <Table
              columns={columns}
              data={tournamentsQuery.data.items}
              emptyMessage="По этим фильтрам пока нет загруженных турниров."
              getRowKey={(row) => row.id}
              layout="fixed"
              minWidth={880}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
