import { Link, useLocation } from 'react-router-dom';
import { getDashboardFilterSearch } from '@/shared/lib/filters';
import { cn } from '@/shared/lib/cn';
import type { PlayerRatingItem } from '@/shared/lib/establishedPlayers';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  SMALL_SAMPLE_HINT,
  formatRecord,
  getRecordSortValue,
} from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { Table, type TableColumn } from '@/shared/ui/Table';

type RankedTopPlayerItem = PlayerRatingItem & {
  homeRank: number;
};

const columns: TableColumn<RankedTopPlayerItem>[] = [
  {
    id: 'rank',
    header: '#',
    align: 'center',
    defaultSortDirection: 'asc',
    render: (row) => <span className={`table__rank ${row.homeRank <= 3 ? 'table__rank--top' : ''}`}>{row.homeRank}</span>,
    sortValue: (row) => row.homeRank,
  },
  {
    id: 'player',
    header: 'Игрок',
    sortValue: (row) => row.player.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
        />
        {row.isSmallSample ? (
          <Badge
            title={SMALL_SAMPLE_HINT}
            variant="warning"
          >
            Мало данных
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: 'tournaments',
    header: 'Турниров',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.tournamentsCount,
    sortValue: (row) => row.tournamentsCount,
  },
  {
    id: 'matches',
    header: 'Сыграно матчей',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.playedMatchesCount,
    sortValue: (row) => row.playedMatchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.playedWins, row.matchLosses, row.matchDraws),
    sortValue: (row) => getRecordSortValue(row.playedWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: 'Рейтинг',
    align: 'center',
    headerTitle: 'Скорректированный процент побед: учитывает результат игрока и количество сыгранных матчей.',
    defaultSortDirection: 'desc',
    render: (row) => (
      <div className="stacked-cell stacked-cell--compact stacked-cell--end">
        <strong>{formatPercent(row.adjustedWinRate)}</strong>
        <span className="muted-text">Побед: {formatPercent(row.rawWinRate)}</span>
      </div>
    ),
    sortValue: (row) => row.adjustedWinRate,
  },
  {
    id: 'deck',
    header: 'Любимая колода',
    align: 'center',
    sortValue: (row) => row.mostPlayedDeck?.name,
    render: (row) =>
      row.mostPlayedDeck ? (
        <EntityLink
          colors={row.mostPlayedDeck.colors}
          id={row.mostPlayedDeck.id}
          name={row.mostPlayedDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

const compactColumns: TableColumn<RankedTopPlayerItem>[] = [
  {
    id: 'rank',
    header: '#',
    align: 'center',
    defaultSortDirection: 'asc',
    render: (row) => <span className={`table__rank ${row.homeRank <= 3 ? 'table__rank--top' : ''}`}>{row.homeRank}</span>,
    sortValue: (row) => row.homeRank,
  },
  {
    id: 'player',
    header: 'Игрок',
    sortValue: (row) => row.player.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
        />
        {row.isSmallSample ? (
          <Badge
            title={SMALL_SAMPLE_HINT}
            variant="warning"
          >
            Мало данных
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: 'matches',
    header: 'Матчей',
    align: 'center',
    defaultSortDirection: 'desc',
    render: (row) => row.playedMatchesCount,
    sortValue: (row) => row.playedMatchesCount,
  },
  {
    id: 'winrate',
    header: 'Рейтинг',
    align: 'center',
    headerTitle: 'Скорректированный процент побед: учитывает результат игрока и количество сыгранных матчей.',
    defaultSortDirection: 'desc',
    render: (row) => (
      <div className="stacked-cell stacked-cell--compact stacked-cell--end">
        <strong>{formatPercent(row.adjustedWinRate)}</strong>
        <span className="muted-text">Побед: {formatPercent(row.rawWinRate)}</span>
      </div>
    ),
    sortValue: (row) => row.adjustedWinRate,
  },
  {
    id: 'deck',
    header: 'Любимая колода',
    align: 'center',
    sortValue: (row) => row.mostPlayedDeck?.name,
    render: (row) =>
      row.mostPlayedDeck ? (
        <EntityLink
          colors={row.mostPlayedDeck.colors}
          id={row.mostPlayedDeck.id}
          name={row.mostPlayedDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

type TopPlayersTableProps = {
  items: PlayerRatingItem[];
  limit?: number;
  showSpotlight?: boolean;
  actionHref?: string;
  actionLabel?: string;
  scopeDescription?: string;
  minimumMatches?: number;
  fieldWinRate?: number;
};

export function TopPlayersTable({
  items,
  limit,
  showSpotlight = false,
  actionHref,
  actionLabel = 'Смотреть всех игроков',
  scopeDescription,
  minimumMatches,
  fieldWinRate = 0,
}: TopPlayersTableProps) {
  const location = useLocation();
  const dashboardFilterSearch = getDashboardFilterSearch(location.search);
  const rankedItems = items.map((item, index) => ({
    ...item,
    homeRank: index + 1,
  }));
  const visibleItems = limit ? rankedItems.slice(0, limit) : rankedItems;
  const spotlightItems = showSpotlight ? visibleItems.slice(0, 3) : [];
  const tableItems = showSpotlight ? visibleItems.slice(3) : visibleItems;

  return (
    <Card className="top-players-card">
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Игроки с лучшими результатами</h2>
          <p className="section-header__description">
            {showSpotlight
              ? `Учитываем процент побед и количество матчей${minimumMatches ? `; в рейтинг входят игроки с ${minimumMatches}+ матчами` : ''}.`
              : 'Процент побед и результаты матчей.'}
            {scopeDescription ? ` ${scopeDescription}` : ''}
          </p>
        </div>
        {actionHref ? (
          <Link
            className="button button--ghost section-link"
            to={{
              pathname: actionHref,
              search: dashboardFilterSearch,
            }}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {showSpotlight ? (
        <details className="player-rating-method">
          <summary>Как считается рейтинг</summary>
          <div className="player-rating-method__body">
            <p>
              Сначала считаем среднее число матчей на игрока. Сейчас порог — <strong>{minimumMatches}</strong>,
              средний процент побед — <strong>{formatPercent(fieldWinRate)}</strong>.
            </p>
            <p>
              Итоговая оценка объединяет личный процент и средний результат: чем меньше матчей, тем ближе оценка
              к среднему; на длинной дистанции она почти совпадает с процентом игрока.
            </p>
            <code>оценка = N / (N + K) × P + K / (N + K) × C</code>
            <p className="muted-text">N — матчи игрока, K — порог, P — его процент побед, C — средний процент.</p>
          </div>
        </details>
      ) : null}

      {spotlightItems.length ? (
        <div className="spotlight-grid">
          {spotlightItems.map((item, index) => (
            <article
              key={item.player.id}
              className={cn('spotlight-card', index === 0 && 'spotlight-card--lead')}
            >
              <div className="spotlight-card__header">
                <span className="table__rank table__rank--top">{item.homeRank}</span>
                {item.isSmallSample ? (
                  <Badge
                    title={SMALL_SAMPLE_HINT}
                    variant="warning"
                  >
                    Мало данных
                  </Badge>
                ) : null}
              </div>

              <div className="spotlight-card__title">
                <EntityLink
                  id={item.player.id}
                  name={item.player.name}
                  type="player"
                />
              </div>

              <div className="spotlight-card__subtitle">
                {item.tournamentsCount} турниров · {item.playedMatchesCount} матчей
              </div>

              <div className="spotlight-card__stats">
                <div className="spotlight-card__stat">
                  <span>Рейтинг</span>
                  <strong>{formatPercent(item.adjustedWinRate)}</strong>
                  <small>Побед: {formatPercent(item.rawWinRate)}</small>
                </div>
                <div className="spotlight-card__stat">
                  <span>{MATCH_RECORD_LABEL}</span>
                  <strong>{formatRecord(item.playedWins, item.matchLosses, item.matchDraws)}</strong>
                </div>
              </div>

              <div className="spotlight-card__deck">
                <span className="muted-text">Любимая колода:</span>{' '}
                {item.mostPlayedDeck ? (
                  <EntityLink
                    colors={item.mostPlayedDeck.colors}
                    id={item.mostPlayedDeck.id}
                    name={item.mostPlayedDeck.name}
                    type="deck"
                  />
                ) : (
                  '—'
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tableItems.length ? (
        <Table
          columns={showSpotlight ? compactColumns : columns}
          data={tableItems}
          emptyMessage="Пока нет игроков, сыгравших достаточно матчей для этого рейтинга."
          getRowKey={(row) => row.player.id}
          getRowClassName={(row) => (row.homeRank <= 3 ? 'table__row--top' : undefined)}
        />
      ) : !spotlightItems.length ? (
        <Table
          columns={columns}
          data={visibleItems}
          emptyMessage="Пока нет игроков, сыгравших достаточно матчей для этого рейтинга."
          getRowKey={(row) => row.player.id}
          getRowClassName={(row) => (row.homeRank <= 3 ? 'table__row--top' : undefined)}
        />
      ) : null}
    </Card>
  );
}
