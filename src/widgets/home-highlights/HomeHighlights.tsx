import type {
  DeckMetagameItem,
  DeckPerformanceItem,
  HomeSummary,
  PopularMatchupItem,
  RecentTournamentItem,
} from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';

const MIN_DECK_MATCHES = 30;
const MIN_DECK_TOURNAMENTS = 10;

type HomeHighlightsProps = {
  summary: HomeSummary;
  deckMetagame: DeckMetagameItem[];
  deckPerformance: DeckPerformanceItem[];
  popularMatchups: PopularMatchupItem[];
  recentTournaments: RecentTournamentItem[];
};

export function HomeHighlights({
  summary,
  deckMetagame,
  deckPerformance,
  popularMatchups,
  recentTournaments,
}: HomeHighlightsProps) {
  const topMetaDeck = deckMetagame[0];
  const metagameByDeckId = new Map(
    deckMetagame.map((item) => [item.deck.id, item]),
  );
  const bestEstablishedDeck = [...deckPerformance]
    .filter((item) => {
      const metagame = metagameByDeckId.get(item.deck.id);

      return (
        item.matchesCount >= MIN_DECK_MATCHES &&
        (metagame?.tournamentsCount ?? 0) >= MIN_DECK_TOURNAMENTS
      );
    })
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount,
    )[0];
  const bestEstablishedDeckMetagame = bestEstablishedDeck
    ? metagameByDeckId.get(bestEstablishedDeck.deck.id)
    : undefined;
  const mostPopularMatchup = [...popularMatchups].sort(
    (left, right) => right.matchesCount - left.matchesCount,
  )[0];
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
            Коротко собрали главное. Результаты колод сравниваем только после 30 матчей
            минимум в 10 турнирах.
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

          {bestEstablishedDeck && bestEstablishedDeckMetagame ? (
            <article className="insight-item">
              <div className="insight-item__title">
                Лучший результат на достаточной выборке
              </div>
              <div className="insight-item__body">
                <EntityLink
                  colors={bestEstablishedDeck.deck.colors}
                  id={bestEstablishedDeck.deck.id}
                  name={bestEstablishedDeck.deck.name}
                  type="deck"
                />{' '}
                с {formatPercent(bestEstablishedDeck.matchWinRate)} побед за{' '}
                {bestEstablishedDeck.matchesCount} матчей в{' '}
                {bestEstablishedDeckMetagame.tournamentsCount} турнирах.
              </div>
            </article>
          ) : null}

          {mostPopularMatchup ? (
            <article className="insight-item">
              <div className="insight-item__title">Самый частый матчап</div>
              <div className="insight-item__body">
                <EntityLink
                  colors={mostPopularMatchup.deckA.colors}
                  id={mostPopularMatchup.deckA.id}
                  name={mostPopularMatchup.deckA.name}
                  type="deck"
                />{' '}
                против{' '}
                <EntityLink
                  colors={mostPopularMatchup.deckB.colors}
                  id={mostPopularMatchup.deckB.id}
                  name={mostPopularMatchup.deckB.name}
                  type="deck"
                />{' '}
                — {mostPopularMatchup.matchesCount} матчей.
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
