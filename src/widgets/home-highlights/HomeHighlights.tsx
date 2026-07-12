import type { DeckMetagameItem, DeckPerformanceItem, HomeSummary, RecentTournamentItem, TopPlayerItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { SMALL_SAMPLE_HINT, formatRecord } from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';

type HomeHighlightsProps = {
  summary: HomeSummary;
  deckMetagame: DeckMetagameItem[];
  deckPerformance: DeckPerformanceItem[];
  topPlayers: TopPlayerItem[];
  recentTournaments: RecentTournamentItem[];
};

export function HomeHighlights({
  summary,
  deckMetagame,
  deckPerformance,
  topPlayers,
  recentTournaments,
}: HomeHighlightsProps) {
  const topMetaDeck = deckMetagame[0];
  const bestStableDeck = deckPerformance.find((item) => !item.isSmallSample) ?? deckPerformance[0];
  const topPlayer = topPlayers[0];
  const latestTournament = recentTournaments[0];

  return (
    <Card
      className="insights-card"
      tone="muted"
    >
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Главное прямо сейчас</h2>
          <p className="section-header__description">
            Коротко собрали главное, чтобы можно было быстро понять картину до подробных таблиц.
          </p>
        </div>
      </div>

      <div className="insights-grid">
        <div className="insights-summary">
          <div className="insights-summary__value">{summary.tournamentsCount}</div>
          <div className="insights-summary__title">турниров в статистике</div>
          <p className="insights-summary__description">
            Это {summary.matchesCount} матчей, {summary.uniquePlayersCount} уникальных игроков и {summary.uniqueDecksCount}{' '}
            колод.
          </p>
        </div>

        <div className="insights-list">
          {topMetaDeck ? (
            <article className="insight-item">
              <div className="insight-item__title">Чаще всего встречается</div>
              <div className="insight-item__body">
                <EntityLink
                  colors={topMetaDeck.deck.colors}
                  id={topMetaDeck.deck.id}
                  name={topMetaDeck.deck.name}
                  type="deck"
                />{' '}
                занимает {formatPercent(topMetaDeck.metaShare)} поля и встретилась {topMetaDeck.playersCount} раз.
              </div>
            </article>
          ) : null}

          {bestStableDeck ? (
            <article className="insight-item">
              <div className="insight-item__title">По результатам впереди</div>
              <div className="insight-item__body">
                <EntityLink
                  colors={bestStableDeck.deck.colors}
                  id={bestStableDeck.deck.id}
                  name={bestStableDeck.deck.name}
                  type="deck"
                />{' '}
                с {formatPercent(bestStableDeck.matchWinRate)} побед за {bestStableDeck.matchesCount} матчей.
                {bestStableDeck.isSmallSample ? (
                  <Badge
                    title={SMALL_SAMPLE_HINT}
                    variant="warning"
                  >
                    Малая выборка
                  </Badge>
                ) : null}
              </div>
            </article>
          ) : null}

          {topPlayer ? (
            <article className="insight-item">
              <div className="insight-item__title">Лучший результат сейчас у</div>
              <div className="insight-item__body">
                <EntityLink
                  id={topPlayer.player.id}
                  name={topPlayer.player.name}
                  type="player"
                />{' '}
                с {formatPercent(topPlayer.matchWinRate)} побед и результатом{' '}
                {formatRecord(topPlayer.matchWins, topPlayer.matchLosses, topPlayer.matchDraws)}.
              </div>
            </article>
          ) : null}

          {latestTournament ? (
            <article className="insight-item">
              <div className="insight-item__title">Последний загруженный турнир</div>
              <div className="insight-item__body">
                <EntityLink
                  id={latestTournament.id}
                  name={latestTournament.title}
                  type="tournament"
                />{' '}
                на {latestTournament.playersCount} игроков.
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
