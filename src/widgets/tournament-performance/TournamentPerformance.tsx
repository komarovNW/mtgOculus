import { useState } from 'react';
import type { PlayerTournamentItem } from '@/shared/api/types';
import { getTournamentAchievements } from '@/shared/lib/tournamentResults';
import { formatDate } from '@/shared/lib/formatDate';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { EntityLink } from '@/shared/ui/EntityLink';

const TOURNAMENT_PREVIEW_LIMIT = 5;

function getTournamentDisplayTitle(item: PlayerTournamentItem) {
  const formattedDate = formatDate(item.tournament.date);

  return item.tournament.title.endsWith(` ${formattedDate}`)
    ? item.tournament.title.slice(0, -formattedDate.length).trim()
    : item.tournament.title;
}
type TournamentPerformanceProps = {
  items: PlayerTournamentItem[];
  isLoading?: boolean;
};

export function TournamentPerformance({ items, isLoading = false }: TournamentPerformanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedItems = [...items].sort(
    (left, right) =>
      right.tournament.date.localeCompare(left.tournament.date) ||
      right.tournament.id.localeCompare(left.tournament.id),
  );
  const achievements = getTournamentAchievements(items);
  const bestTournament = achievements.best;
  const hasLongHistory = sortedItems.length >= 10;
  const visibleItems = hasLongHistory && !isExpanded
    ? sortedItems.slice(0, TOURNAMENT_PREVIEW_LIMIT)
    : sortedItems;

  return (
    <section className="page-stack tournament-performance" aria-labelledby="tournament-performance-title">
      <div className="section-header">
        <div>
          <h2 className="section-header__title" id="tournament-performance-title">
            Выступления на турнирах
          </h2>
          <p className="section-header__description">
            Достижения с выбранными фильтрами. Топ-4 и топ-8 считаются по итоговому месту, включая турниры без плей-офф.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="tournament-performance__state" tone="muted">
          Собираем историю турниров…
        </Card>
      ) : items.length === 0 ? (
        <Card className="tournament-performance__state" tone="muted">
          С выбранными фильтрами у игрока пока нет турниров.
        </Card>
      ) : (
        <>
          <div className="tournament-performance__summary">
            {bestTournament ? <Card className="tournament-performance__best" tone="accent">
              <div className="tournament-performance__label">Лучшее выступление</div>
              <div className="tournament-performance__place">
                <strong>{bestTournament.rank} место</strong>
                <span>из {bestTournament.tournament.playersCount}</span>
              </div>
              <div className="tournament-performance__event">
                <EntityLink
                  id={bestTournament.tournament.id}
                  name={getTournamentDisplayTitle(bestTournament)}
                  type="tournament"
                />
              </div>
              <div className="tournament-performance__meta">
                {formatDate(bestTournament.tournament.date)}
                {bestTournament.deck ? (
                  <>
                    {' · '}
                    <EntityLink
                      colors={bestTournament.deck.colors}
                      id={bestTournament.deck.id}
                      name={bestTournament.deck.name}
                      type="deck"
                    />
                  </>
                ) : null}
                {' · '}{bestTournament.record}
              </div>
            </Card> : <Card className="tournament-performance__best">Итоговые места пока не опубликованы.</Card>}

            <Card className="tournament-performance__metric">
              <div className="tournament-performance__label">Участий</div>
              <strong>{achievements.count}</strong>
              <span>
                {items.length < 10
                  ? 'Вся история видна ниже'
                  : `Последние ${TOURNAMENT_PREVIEW_LIMIT} — ниже`}
              </span>
            </Card>

            {[
              { label: 'Победы', value: achievements.wins },
              { label: 'Топ-4', value: achievements.top4 },
              { label: 'Топ-8', value: achievements.top8 },
            ].map((metric) => <Card className="tournament-performance__metric" key={metric.label}>
              <div className="tournament-performance__label">{metric.label}</div>
              <strong>{metric.value}</strong>
              <span>{metric.label === 'Победы' ? 'Первые места' : 'По итоговому месту, включая победы'}</span>
            </Card>)}
          </div>

          <Card className="tournament-performance__history">
            <div className="tournament-performance__rows" role="list">
              {visibleItems.map((item) => (
                <article
                  className={item.tournament.id === bestTournament?.tournament.id
                    ? 'tournament-performance__row tournament-performance__row--best'
                    : 'tournament-performance__row'}
                  key={item.tournament.id}
                  role="listitem"
                >
                  <time dateTime={item.tournament.date}>
                    {formatDate(item.tournament.date)}
                  </time>
                  <div className="tournament-performance__row-event">
                    <EntityLink
                      id={item.tournament.id}
                      name={getTournamentDisplayTitle(item)}
                      type="tournament"
                    />
                    <span>{item.tournament.playersCount} участников</span>
                  </div>
                  <div className="tournament-performance__row-deck">
                    {item.deck ? (
                      <EntityLink
                        colors={item.deck.colors}
                        id={item.deck.id}
                        name={item.deck.name}
                        type="deck"
                      />
                    ) : 'Колода не указана'}
                  </div>
                  <div className="tournament-performance__record" aria-label={`Результат матчей: ${item.record}`}>
                    {item.record}
                  </div>
                  <div className="tournament-performance__rank">
                    <strong>{item.rank > 0 ? `${item.rank} место` : 'Место не указано'}</strong>
                    <span>из {item.tournament.playersCount}</span>
                  </div>
                </article>
              ))}
            </div>
            {hasLongHistory ? (
              <div className="tournament-performance__actions">
                <Button
                  aria-expanded={isExpanded}
                  onClick={() => setIsExpanded((value) => !value)}
                  type="button"
                  variant="ghost"
                >
                  {isExpanded
                    ? 'Показать только последние'
                    : `Показать все турниры (${items.length})`}
                </Button>
              </div>
            ) : null}
          </Card>
        </>
      )}
    </section>
  );
}
