import { type ComponentProps, Fragment, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { leagueQueries } from '@/entities/league/queries';
import { calculatePortalAutumnQualification, isPortalAutumnLeague } from '@/entities/league/lib/qualification';
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
import { Input } from '@/shared/ui/Input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import './leagues.css';

function LeagueEntityLink(props: ComponentProps<typeof EntityLink>) {
  return props.id?.startsWith('demo-') ? <span>{props.name}</span> : <EntityLink {...props} />;
}

function getStandingMetric(standing: LeagueStanding, column: LeagueColumn) {
  const value = (standing as unknown as Record<string, unknown>)[column.key];

  return typeof value === 'number' || typeof value === 'string' ? value : '—';
}

function getZoneLabel(zone: LeagueStanding['zone']) {
  if (zone === 'prequalified') return 'Прошёл';
  if (zone === 'qualify') return 'В проходной зоне';
  if (zone === 'reserve') return 'В резервной зоне';
  return null;
}

function getQualificationLabel(status: NonNullable<LeagueStanding['qualification']>['status']) {
  return {
    confirmed: 'В финале',
    provisional: 'Проходит сейчас',
    outside: 'Пока не проходит',
    unresolved: 'Отбор пока не определён',
  }[status];
}

function getBonusLabel(league: LeagueDetails) {
  return league.bonusPointsLabel
    ?? league.columns.find((column) => column.key === 'bonusPoints')?.label
    ?? 'Бонусные очки';
}

function QualificationOverview({ league }: { league: LeagueDetails }) {
  if (!league.qualification) {
    const confirmed = new Map(league.prequalified.map((entry) => [entry.player.id, entry]));
    league.standings.filter((standing) => standing.zone === 'prequalified').forEach((standing) => {
      if (!confirmed.has(standing.player.id)) {
        confirmed.set(standing.player.id, {
          player: standing.player, comment: standing.prequalifiedComment ?? '', leagueRank: standing.leagueRank,
        });
      }
    });
    return (
      <Card>
        <h2 className="section-header__title">Отбор в финал</h2>
        <p className="muted-text">Полный состав по всем основаниям отбора пока не опубликован. Проходная зона в таблице показывает положение в рейтинге; она не заменяет отбор по всем квотам.</p>
        {confirmed.size > 0 ? (
          <>
            <h3>Место уже обеспечено</h3>
            <ul className="league-finalists">
              {[...confirmed.values()].map((entry) => (
                <li key={entry.player.id}>
                  <LeagueEntityLink type="player" id={entry.player.id} name={entry.player.name} />
                  {entry.comment ? <span>{entry.comment}</span> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    );
  }
  return (
    <Card>
      <h2 className="section-header__title">Отбор в финал · {formatPlacesCount(league.qualification.totalSlots)}</h2>
      <p className="muted-text">Если бы лига закончилась сегодня. Статус «Проходит сейчас» может измениться до конца лиги.</p>
      <div className="league-qualification-groups">
        {league.qualification.groups.map((group) => (
          <section key={group.key}>
            <h3>{group.label} · {formatPlacesCount(group.slots)}</h3>
            <p className="muted-text">{group.description}</p>
            <ul className="league-finalists">
              {group.entries.map((entry) => (
                <li key={entry.player.id}>
                  <LeagueEntityLink type="player" id={entry.player.id} name={entry.player.name} />
                  <Badge variant={entry.status === 'confirmed' ? 'accent' : 'neutral'}>
                    {entry.status === 'confirmed' ? 'Место обеспечено' : 'Проходит сейчас'}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}

function formatPlacesCount(count: number) {
  const modulo100 = count % 100;
  const modulo10 = count % 10;
  const unit = modulo100 >= 11 && modulo100 <= 14
    ? 'мест'
    : modulo10 === 1
      ? 'место'
      : modulo10 >= 2 && modulo10 <= 4
        ? 'места'
        : 'мест';

  return `${count} ${unit}`;
}

export function LeagueOverview({ league }: { league: LeagueDetails }) {
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
      <details className="league-overview__rules">
        <summary>Как начисляются {getBonusLabel(league)}</summary>
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
      </details>
    </Card>
  );
}

function StandingDetails({ standing, bonusLabel, showQualification }: { standing: LeagueStanding; bonusLabel: string; showQualification: boolean }) {
  return (
    <div className="league-standing-details">
      <section>
        <h3>Подробности игрока</h3>
        <dl className="league-player-totals">
          <div><dt>Турниров X−1 / X−0−1</dt><dd>{standing.xOneCount}</dd></div>
          {standing.tournamentsCounted !== standing.tournamentsPlayed ? <div><dt>Турниров в зачёте</dt><dd>{standing.tournamentsCounted}</dd></div> : null}
        </dl>
        <p className="muted-text">X−1 / X−0−1 — одно поражение или одна ничья при остальных победах.</p>
        {showQualification && standing.qualification?.paths.length ? (
          <div className="league-player-paths">
            <h3>Положение в отборе</h3>
            {standing.qualification.paths.map((path, index) => (
              <p key={index}><strong>{path.label}:</strong> {path.description}</p>
            ))}
          </div>
        ) : null}
        <h3>Начисления {bonusLabel}</h3>
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
                <LeagueEntityLink type="tournament" id={participation.tournamentId} name={participation.tournamentTitle} />
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

export function LeagueStandings({
  league,
}: {
  league: LeagueDetails;
}) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [view, setView] = useState<'statistics' | 'qualification'>('statistics');
  const [search, setSearch] = useState('');
  const bonusLabel = getBonusLabel(league);
  const statisticsColumns: LeagueColumn[] = [
    { position: 1, key: 'tournamentPoints', label: 'Турнирные очки' },
    { position: 2, key: 'bonusPoints', label: bonusLabel },
    { position: 3, key: 'tournamentsPlayed', label: 'Посещения' },
  ];
  const qualificationColumns = isPortalAutumnLeague(league)
    ? [...statisticsColumns, { position: 4, key: 'xOneCount', label: 'X−1 / X−0−1' }]
    : league.columns;
  const columns = view === 'statistics' ? statisticsColumns : qualificationColumns;
  const normalizedSearch = search.trim().toLocaleLowerCase('ru');
  const standings = league.standings.filter((standing) => standing.player.name.toLocaleLowerCase('ru').includes(normalizedSearch));
  const hasPrequalified = league.standings.some((standing) => standing.zone === 'prequalified');
  const hasZones = view === 'qualification' && !league.qualification && (hasPrequalified || Object.keys(league.cutoffs).length > 0);
  const tableColumnCount = columns.length + (view === 'qualification' ? 4 : 3);

  return (
    <Card className="league-standings-card">
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Таблица лиги</h2>
          <p className="section-header__description">
            Игроки расположены в официальном порядке лиги.
          </p>
        </div>
      </div>
      <div className="league-table-controls">
        <div className="league-view-switch" role="group" aria-label="Режим таблицы">
          <Button type="button" aria-pressed={view === 'statistics'} variant={view === 'statistics' ? 'primary' : 'secondary'} onClick={() => setView('statistics')}>Очки и статистика</Button>
          <Button type="button" aria-pressed={view === 'qualification'} variant={view === 'qualification' ? 'primary' : 'secondary'} onClick={() => setView('qualification')}>Отбор в финал</Button>
        </div>
        <Input label="Найти игрока" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя или фамилия" />
      </div>
      {view === 'statistics' ? (
        <p className="muted-text">Раскройте строку игрока, чтобы увидеть начисления по турнирам.</p>
      ) : <>
        <QualificationOverview league={league} />
        <p className="muted-text">Раскройте строку игрока, чтобы увидеть его положение по каждому пути отбора. X−1 / X−0−1 — турниры с одним поражением или одной ничьей при остальных победах.</p>
      </>}
      {hasZones ? (
        <div className="league-zone-legend" aria-label="Зоны таблицы">
          {hasPrequalified ? (
            <span className="league-zone-legend__item league-zone-legend__item--prequalified">
              Уже прошли
            </span>
          ) : null}
          {league.cutoffs.qualify ? (
            <span className="league-zone-legend__item league-zone-legend__item--qualify">
              Проходная зона: {formatPlacesCount(league.cutoffs.qualify)} по итогам лиги
            </span>
          ) : null}
          {league.cutoffs.reserve ? (
            <span className="league-zone-legend__item league-zone-legend__item--reserve">
              Резервная зона: до {league.cutoffs.reserve} мест по таблице
            </span>
          ) : null}
        </div>
      ) : null}
      <p className="table-region__mobile-hint">Таблицу можно прокручивать в сторону.</p>
      <div className="table-shell" tabIndex={0}>
        <table className="table table--fixed league-table">
          <colgroup>
            <col className="league-table__rank-column" />
            <col className="league-table__player-column" />
            {columns.map((column) => (
              <col className="league-table__metric-column" key={column.key} />
            ))}
            {view === 'qualification' ? <col className="league-table__qualification-column" /> : null}
            <col className="league-table__details-column" />
          </colgroup>
          <thead>
            <tr>
              <th className="table__cell table__cell--center">Место</th>
              <th className="table__cell">Игрок</th>
              {columns.map((column) => (
                <th className="table__cell table__cell--center" key={column.key}>{column.label}</th>
              ))}
              {view === 'qualification' ? <th className="table__cell">Отбор в финал</th> : null}
              <th className="table__cell table__cell--center"><span className="visually-hidden">Детали</span></th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => {
              const expanded = expandedPlayerId === standing.player.id;
              const detailsId = `league-player-${standing.player.id}`;
              const displayedRank = standing.leagueRank;
              const zoneLabel = getZoneLabel(standing.zone);
              const displayZone = standing.qualification
                ? standing.qualification.status === 'confirmed' ? 'prequalified'
                  : standing.qualification.status === 'provisional' ? 'qualify' : null
                : standing.zone;
              return (
                <Fragment key={standing.player.id}>
                  <tr className={cn(
                    'table__row',
                    view === 'qualification' && displayZone && `league-table__row--${displayZone}`,
                    expanded && 'league-table__row--expanded',
                  )}>
                    <td className="table__cell table__cell--center"><span className="table__rank">{displayedRank}</span></td>
                    <td className="table__cell league-table__player-cell">
                      <LeagueEntityLink type="player" id={standing.player.id} name={standing.player.name} />
                    </td>
                    {columns.map((column, index) => (
                      <td className="table__cell table__cell--center" key={column.key}>
                        {index === 0
                          ? <strong>{getStandingMetric(standing, column)}</strong>
                          : getStandingMetric(standing, column)}
                      </td>
                    ))}
                    {view === 'qualification' ? (
                      <td className="table__cell">
                        <strong>{standing.qualification ? getQualificationLabel(standing.qualification.status) : zoneLabel ?? 'Статус отбора не опубликован'}</strong>
                        <p className="league-zone-reason">{standing.qualification?.reason ?? standing.prequalifiedComment}</p>
                      </td>
                    ) : null}
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
                      <td colSpan={tableColumnCount} id={detailsId}><StandingDetails standing={standing} bonusLabel={bonusLabel} showQualification={view === 'qualification'} /></td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {!standings.length ? <tr><td className="table__cell" colSpan={tableColumnCount}>Игроки не найдены.</td></tr> : null}
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
  const league = useMemo(() => detailsQuery.data
    ? calculatePortalAutumnQualification(detailsQuery.data) : undefined, [detailsQuery.data]);

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
        description="Выберите лигу, чтобы посмотреть таблицу игроков, правила начисления бонусов и зачтённые турниры."
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

      {selectedLeague && detailsQuery.isLoading ? <LoadingState title="Собираем таблицу лиги…" description="Получаем правила, турниры и рейтинг игроков." /> : null}
      {selectedLeague && detailsQuery.isError ? (
        <ErrorState description={getErrorMessage(detailsQuery.error, 'Не удалось загрузить таблицу лиги.')} onRetry={() => void detailsQuery.refetch()} />
      ) : null}

      {league ? (
        <>
          <LeagueOverview league={league} />
          <LeagueStandings
            key={league.id}
            league={league}
          />
        </>
      ) : null}
    </div>
  );
}
