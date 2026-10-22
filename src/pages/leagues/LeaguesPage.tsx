import { Fragment, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { leagueQueries } from '@/entities/league/queries';
import type { LeagueColumn, LeagueDetails, LeagueListItem, LeagueStanding } from '@/shared/api/types';
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

function getStandingMetric(standing: LeagueStanding, column: LeagueColumn) {
  const value = (standing as unknown as Record<string, unknown>)[column.key];

  return typeof value === 'number' || typeof value === 'string' ? value : '—';
}

function hasPortalAutumnZones(league: LeagueDetails) {
  return /портал|portal/iu.test(league.club.name)
    && /осенн/iu.test(league.name)
    && league.dateStart.slice(5, 10) === '09-01'
    && league.dateEnd.slice(5, 7) === '11';
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
        <div><strong>{league.tournaments.length}</strong><span>событий</span></div>
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
            ? `В итог идут ${league.bestTournamentsCount} лучших событий игрока.`
            : 'В итог идут все сыгранные события.'}
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
}: {
  league: LeagueDetails;
}) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const tableColumnCount = league.columns.length + 3;
  const qualifiedPlayers = new Map(
    league.qualification.flatMap((block) => block.seats.flatMap((seat) => (
      seat.player ? [[seat.player.id, seat.comment ?? block.title] as const] : []
    ))),
  );
  const zoneCandidates = hasPortalAutumnZones(league)
    ? league.standings.filter((standing) => !qualifiedPlayers.has(standing.player.id))
    : [];
  const qualifyingPlayerIds = new Set(zoneCandidates.slice(0, 4).map((standing) => standing.player.id));
  const reservePlayerIds = new Set(zoneCandidates.slice(4, 8).map((standing) => standing.player.id));
  const hasZones = qualifiedPlayers.size > 0 || qualifyingPlayerIds.size > 0 || reservePlayerIds.size > 0;

  return (
    <Card className="league-standings-card">
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Таблица лиги</h2>
          <p className="section-header__description">
            Игроки расположены в официальном порядке лиги.
          </p>
        </div>
        <div className="league-standings__meta">
          <Badge>{league.standings.length} игроков</Badge>
        </div>
      </div>
      {hasZones ? (
        <div aria-label="Зоны таблицы" className="league-zone-legend">
          {qualifiedPlayers.size ? <span className="league-zone-legend__item league-zone-legend__item--qualified">Прошли</span> : null}
          {qualifyingPlayerIds.size ? <span className="league-zone-legend__item league-zone-legend__item--qualify">Проходная зона</span> : null}
          {reservePlayerIds.size ? <span className="league-zone-legend__item league-zone-legend__item--reserve">Резервная зона</span> : null}
        </div>
      ) : null}
      <p className="table-region__mobile-hint">Таблицу можно прокручивать в сторону.</p>
      <div className="table-shell" tabIndex={0}>
        <table className="table table--fixed league-table">
          <colgroup>
            <col className="league-table__rank-column" />
            <col className="league-table__player-column" />
            {league.columns.map((column) => (
              <col className="league-table__metric-column" key={column.key} />
            ))}
            <col className="league-table__details-column" />
          </colgroup>
          <thead>
            <tr>
              <th className="table__cell table__cell--center">Место</th>
              <th className="table__cell">Игрок</th>
              {league.columns.map((column) => (
                <th className="table__cell table__cell--center" key={column.key}>{column.label}</th>
              ))}
              <th className="table__cell table__cell--center"><span className="visually-hidden">Детали</span></th>
            </tr>
          </thead>
          <tbody>
            {league.standings.map((standing) => {
              const expanded = expandedPlayerId === standing.player.id;
              const detailsId = `league-player-${standing.player.id}`;
              const displayedRank = standing.leagueRank;
              const qualifiedComment = qualifiedPlayers.get(standing.player.id);
              const isQualified = qualifiedPlayers.has(standing.player.id);
              const isQualifying = qualifyingPlayerIds.has(standing.player.id);
              const isReserve = reservePlayerIds.has(standing.player.id);
              return (
                <Fragment key={standing.player.id}>
                  <tr className={cn(
                    'table__row',
                    displayedRank <= 3 && 'table__row--top',
                    isQualified && 'league-table__row--qualified',
                    isQualifying && 'league-table__row--qualify',
                    isReserve && 'league-table__row--reserve',
                    expanded && 'league-table__row--expanded',
                  )}>
                    <td className="table__cell table__cell--center"><span className={cn('table__rank', displayedRank <= 3 && 'table__rank--top')}>{displayedRank}</span></td>
                    <td className="table__cell league-table__player-cell">
                      <EntityLink type="player" id={standing.player.id} name={standing.player.name} />
                      {isQualified ? <span className="league-zone-label league-zone-label--qualified">Прошёл</span> : null}
                      {isQualifying ? <span className="league-zone-label league-zone-label--qualify">В проходной зоне</span> : null}
                      {isReserve ? <span className="league-zone-label league-zone-label--reserve">В резервной зоне</span> : null}
                      {isQualified && qualifiedComment ? <span className="league-zone-reason">{qualifiedComment}</span> : null}
                    </td>
                    {league.columns.map((column, index) => (
                      <td className="table__cell table__cell--center" key={column.key}>
                        {index === 0
                          ? <strong>{getStandingMetric(standing, column)}</strong>
                          : getStandingMetric(standing, column)}
                      </td>
                    ))}
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
                      <td colSpan={tableColumnCount} id={detailsId}><StandingDetails standing={standing} /></td>
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
  const { id: routeLeagueId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listQuery = useQuery(leagueQueries.list({}));
  const legacyLeagueId = searchParams.get('leagueId');
  const requestedLeagueId = routeLeagueId ?? legacyLeagueId;
  const selectedLeague = requestedLeagueId
    ? listQuery.data?.items.find((league) => league.id === requestedLeagueId)
    : listQuery.data?.items[0];
  const detailsQuery = useQuery(leagueQueries.details(selectedLeague?.id ?? ''));

  useEffect(() => {
    if (!routeLeagueId && legacyLeagueId) {
      navigate(`/leagues/${legacyLeagueId}`, { replace: true });
      return;
    }

    const next = new URLSearchParams(searchParams);
    const obsoleteFilterKeys = [
      'cityId',
      'clubId',
      'formatId',
      'tournamentType',
      'dateFrom',
      'dateTo',
      'sort',
    ];
    const hasObsoleteFilters = obsoleteFilterKeys.some((key) => next.has(key));

    if (!hasObsoleteFilters) {
      return;
    }

    obsoleteFilterKeys.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }, [legacyLeagueId, navigate, routeLeagueId, searchParams, setSearchParams]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Сезонный рейтинг"
        title="Лиги"
        description="Выберите лигу, чтобы посмотреть таблицу игроков, правила начисления бонусов и зачтённые события."
      />

      {listQuery.isLoading ? <LoadingState title="Загружаем лиги…" description="Получаем список доступных сезонов." /> : null}
      {listQuery.isError ? (
        <ErrorState description={getErrorMessage(listQuery.error, 'Не удалось загрузить список лиг.')} onRetry={() => void listQuery.refetch()} />
      ) : null}
      {listQuery.isSuccess && requestedLeagueId && !selectedLeague ? (
        <EmptyState title="Лига не найдена" description="Проверьте ссылку или выберите лигу в общем списке." />
      ) : null}
      {listQuery.isSuccess && !requestedLeagueId && !selectedLeague ? (
        <EmptyState title="Лиги пока не добавлены" description="Когда появится первая лига, здесь можно будет открыть её таблицу." />
      ) : null}

      {selectedLeague ? (
        <Card className="league-selector-card">
          <Select
            label="Лига"
            value={selectedLeague.id}
            onChange={(event) => navigate(`/leagues/${event.target.value}`)}
            options={(listQuery.data?.items ?? []).map((league: LeagueListItem) => ({
              value: league.id,
              label: `${league.name} · ${league.club.name} · ${league.format.name}`,
            }))}
          />
        </Card>
      ) : null}

      {selectedLeague && detailsQuery.isLoading ? <LoadingState title="Собираем таблицу лиги…" description="Получаем правила, события и рейтинг игроков." /> : null}
      {selectedLeague && detailsQuery.isError ? (
        <ErrorState description={getErrorMessage(detailsQuery.error, 'Не удалось загрузить таблицу лиги.')} onRetry={() => void detailsQuery.refetch()} />
      ) : null}

      {detailsQuery.data ? (
        <>
          <LeagueOverview league={detailsQuery.data} />
          <LeagueStandings
            key={detailsQuery.data.id}
            league={detailsQuery.data}
          />
        </>
      ) : null}
    </div>
  );
}
