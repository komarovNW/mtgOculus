import { Fragment, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { leagueQueries } from '@/entities/league/queries';
import type { LeagueDetails, LeagueListItem, LeagueSortField, LeagueStanding } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/formatDate';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import './leagues.css';

const sortFields: Array<{ value: LeagueSortField; label: string }> = [
  { value: 'tournamentPoints', label: 'Турнирные очки' },
  { value: 'bonusPoints', label: 'Бонусные очки' },
  { value: 'tournamentsPlayed', label: 'Сыграно турниров' },
];

function readSort(value: string | null) {
  const allowed = new Set(sortFields.map((field) => field.value));
  return (value?.split(',') ?? []).filter(
    (field, index, all): field is LeagueSortField =>
      allowed.has(field as LeagueSortField) && all.indexOf(field) === index,
  ).slice(0, 3);
}

function getSortOptions(allowEmpty: boolean) {
  return [
    ...(allowEmpty ? [{ value: '', label: 'Не задан' }] : []),
    ...sortFields.map((field) => ({ value: field.value, label: field.label })),
  ];
}

function LeagueOverview({ league }: { league: LeagueDetails }) {
  return (
    <Card className="league-overview" tone="accent">
      <div className="league-overview__heading">
        <div>
          <span className="league-overview__eyebrow">Сезон</span>
          <h2>{league.name}</h2>
        </div>
        <div className="league-overview__badges">
          <Badge variant="accent">{league.club.name}</Badge>
          <Badge>{league.format.name}</Badge>
        </div>
      </div>
      <div className="league-overview__stats">
        <div><strong>{league.standings.length}</strong><span>игроков</span></div>
        <div><strong>{league.tournaments.length}</strong><span>турниров</span></div>
        <div><strong>{formatDate(league.dateStart)} — {formatDate(league.dateEnd)}</strong><span>период лиги</span></div>
      </div>
      <div className="league-overview__rules">
        <h3>Бонусные очки</h3>
        {league.rules.length ? (
          <ul>
            {league.rules.map((rule, index) => (
              <li key={`${rule.kind}-${rule.threshold}-${index}`}>
                <span>{rule.label}</span>
                <strong>+{rule.points}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="muted-text">Дополнительные бонусные правила не заданы.</p>}
        <p className="league-overview__counting">
          {league.bestTournamentsCount
            ? `В итог идут ${league.bestTournamentsCount} лучших турниров игрока.`
            : 'В итог идут все сыгранные турниры.'}
        </p>
      </div>
    </Card>
  );
}

function StandingDetails({ standing }: { standing: LeagueStanding }) {
  return (
    <div className="league-standing-details">
      <section>
        <h3>Бонусные очки</h3>
        {standing.breakdown.length ? (
          <ul className="league-breakdown">
            {standing.breakdown.map((item, index) => (
              <li key={`${item.kind}-${item.threshold}-${index}`}>
                <span>{item.label}</span>
                <strong>{item.timesApplied} × {item.pointsPerTime} = {item.points}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="muted-text">Бонусные правила не срабатывали.</p>}
        {standing.manualBonusPoints ? (
          <p className="league-manual-bonus">Ручные бонусы: <strong>+{standing.manualBonusPoints}</strong></p>
        ) : null}
        {standing.droppedTournamentPoints ? (
          <p className="muted-text">Не вошло в итог: {standing.droppedTournamentPoints} турнирных очков.</p>
        ) : null}
      </section>
      <section>
        <h3>Турниры</h3>
        <ul className="league-participations">
          {standing.participations.map((participation) => (
            <li key={participation.tournamentId} className={cn(!participation.counted && 'league-participation--dropped')}>
              <div className="league-participation__event">
                <EntityLink type="tournament" id={participation.tournamentId} name={participation.tournamentTitle} />
                <span>{formatDate(participation.date)}</span>
              </div>
              <div className="league-participation__score">
                <strong>{participation.tournamentPoints}</strong> турнирных
                {participation.rulePoints + participation.manualBonusPoints > 0
                  ? ` · +${participation.rulePoints + participation.manualBonusPoints} бонусных`
                  : ''}
              </div>
              <Badge variant={participation.counted ? 'accent' : 'warning'}>
                {participation.counted ? 'В зачёте' : 'Не в зачёте'}
              </Badge>
              {participation.bonusReason ? <p className="league-participation__reason">{participation.bonusReason}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function LeagueStandings({
  league,
  isCustomSort,
  isFetching,
}: {
  league: LeagueDetails;
  isCustomSort: boolean;
  isFetching: boolean;
}) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  return (
    <Card className="league-standings-card">
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Таблица лиги</h2>
          <p className="section-header__description">
            {isCustomSort
              ? 'Показываем выбранный порядок и место игрока в официальной таблице.'
              : 'Игроки расположены в официальном порядке лиги.'}
          </p>
        </div>
        {isFetching ? <Badge variant="accent">Обновляем порядок…</Badge> : <Badge>{league.standings.length} игроков</Badge>}
      </div>
      <p className="table-region__mobile-hint">Таблицу можно прокручивать в сторону.</p>
      <div className="table-shell" tabIndex={0}>
        <table className="table table--fixed league-table">
          <colgroup>
            <col className="league-table__rank-column" />
            {isCustomSort ? <col className="league-table__league-rank-column" /> : null}
            <col className="league-table__player-column" />
            <col className="league-table__points-column" />
            <col className="league-table__points-column" />
            <col className="league-table__events-column" />
            <col className="league-table__details-column" />
          </colgroup>
          <thead>
            <tr>
              <th className="table__cell table__cell--center">{isCustomSort ? 'По выбранному порядку' : 'Место'}</th>
              {isCustomSort ? <th className="table__cell table__cell--center">Место в лиге</th> : null}
              <th className="table__cell">Игрок</th>
              <th className="table__cell table__cell--center">Турнирные</th>
              <th className="table__cell table__cell--center">Бонусные</th>
              <th className="table__cell table__cell--center">В зачёте / сыграно</th>
              <th className="table__cell table__cell--center"><span className="visually-hidden">Детали</span></th>
            </tr>
          </thead>
          <tbody>
            {league.standings.map((standing) => {
              const expanded = expandedPlayerId === standing.player.id;
              const detailsId = `league-player-${standing.player.id}`;
              const displayedRank = isCustomSort ? standing.rank : standing.leagueRank;
              return (
                <Fragment key={standing.player.id}>
                  <tr className={cn('table__row', displayedRank <= 3 && 'table__row--top', expanded && 'league-table__row--expanded')}>
                    <td className="table__cell table__cell--center"><span className={cn('table__rank', displayedRank <= 3 && 'table__rank--top')}>{displayedRank}</span></td>
                    {isCustomSort ? <td className="table__cell table__cell--center">{standing.leagueRank}</td> : null}
                    <td className="table__cell"><EntityLink type="player" id={standing.player.id} name={standing.player.name} /></td>
                    <td className="table__cell table__cell--center"><strong>{standing.tournamentPoints}</strong></td>
                    <td className="table__cell table__cell--center">{standing.bonusPoints}</td>
                    <td className="table__cell table__cell--center">{standing.tournamentsCounted} / {standing.tournamentsPlayed}</td>
                    <td className="table__cell table__cell--center">
                      <Button
                        aria-label={expanded ? 'Скрыть подробности' : 'Подробнее'}
                        aria-controls={detailsId}
                        aria-expanded={expanded}
                        className="league-details-button"
                        onClick={() => setExpandedPlayerId(expanded ? null : standing.player.id)}
                        type="button"
                        variant={expanded ? 'secondary' : 'primary'}
                      >
                        <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
                      </Button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="league-table__details-row">
                      <td colSpan={isCustomSort ? 7 : 6} id={detailsId}><StandingDetails standing={standing} /></td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function LeaguesPage() {
  const [showSort, setShowSort] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const listQuery = useQuery(leagueQueries.list({}));
  const requestedLeagueId = searchParams.get('leagueId');
  const selectedLeague = listQuery.data?.items.find((league) => league.id === requestedLeagueId)
    ?? listQuery.data?.items[0];
  const requestedSort = useMemo(() => readSort(searchParams.get('sort')), [searchParams]);
  const activeSort = requestedSort.length ? requestedSort : selectedLeague?.sort ?? [];
  const detailsQuery = useQuery({
    ...leagueQueries.details(selectedLeague?.id ?? '', activeSort),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const obsoleteFilterKeys = [
      'cityId',
      'clubId',
      'formatId',
      'tournamentType',
      'dateFrom',
      'dateTo',
    ];
    const hasObsoleteFilters = obsoleteFilterKeys.some((key) => next.has(key));

    if (!hasObsoleteFilters) {
      return;
    }

    obsoleteFilterKeys.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  function updateParams(values: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setSearchParams(next);
  }

  function updateSort(index: number, value: string) {
    const next: Array<LeagueSortField | ''> = [activeSort[0] ?? 'tournamentPoints', activeSort[1] ?? '', activeSort[2] ?? ''];
    next[index] = sortFields.some((field) => field.value === value) ? value as LeagueSortField : '';
    const normalized = next.filter((field, fieldIndex, all): field is LeagueSortField =>
      Boolean(field) && all.indexOf(field) === fieldIndex);
    updateParams({ sort: normalized.join(',') });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Сезонный рейтинг"
        title="Лиги"
        description="Выберите лигу, чтобы посмотреть таблицу игроков, правила начисления бонусов и зачтённые турниры."
      />

      {listQuery.isLoading ? <LoadingState title="Загружаем лиги…" description="Получаем список доступных сезонов." /> : null}
      {listQuery.isError ? (
        <ErrorState description={getErrorMessage(listQuery.error, 'Не удалось загрузить список лиг.')} onRetry={() => void listQuery.refetch()} />
      ) : null}
      {listQuery.isSuccess && !selectedLeague ? (
        <EmptyState title="Лиги пока не добавлены" description="Когда появится первая лига, здесь можно будет открыть её таблицу." />
      ) : null}

      {selectedLeague ? (
        <Card className="league-selector-card">
          <Select
            label="Лига"
            value={selectedLeague.id}
            onChange={(event) => updateParams({ leagueId: event.target.value, sort: undefined })}
            options={(listQuery.data?.items ?? []).map((league: LeagueListItem) => ({
              value: league.id,
              label: `${league.name} · ${league.club.name} · ${league.format.name}`,
            }))}
          />
        </Card>
      ) : null}

      {selectedLeague && detailsQuery.isLoading ? <LoadingState title="Собираем таблицу лиги…" description="Получаем правила, турниры и рейтинг игроков." /> : null}
      {selectedLeague && detailsQuery.isError ? (
        <ErrorState description={getErrorMessage(detailsQuery.error, 'Не удалось загрузить таблицу лиги.')} onRetry={() => void detailsQuery.refetch()} />
      ) : null}

      {detailsQuery.data ? (
        <>
          <LeagueOverview league={detailsQuery.data} />
          <Card className={`league-sort-card${showSort ? ' league-sort-card--open' : ''}`}>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Порядок в таблице</h2>
              </div>
              <div className="league-sort-actions">
                {requestedSort.length ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateParams({ sort: undefined })}
                  >
                    Вернуть официальный порядок
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" aria-expanded={showSort} onClick={() => setShowSort((value) => !value)}>
                  {showSort ? 'Скрыть настройки' : 'Изменить порядок'}
                </Button>
              </div>
            </div>
            {showSort ? <div className="league-sort-grid">
              {['Главный показатель', 'Первый тай-брейк', 'Второй тай-брейк'].map((label, index) => {
                const current = activeSort[index] ?? '';
                return (
                  <Select
                    key={label}
                    label={label}
                    value={current}
                    onChange={(event) => updateSort(index, event.target.value)}
                    options={getSortOptions(index > 0)}
                  />
                );
              })}
            </div> : null}
          </Card>
          <LeagueStandings
            key={`${detailsQuery.data.id}-${activeSort.join('-')}`}
            league={detailsQuery.data}
            isCustomSort={requestedSort.length > 0}
            isFetching={detailsQuery.isFetching}
          />
        </>
      ) : null}
    </div>
  );
}
