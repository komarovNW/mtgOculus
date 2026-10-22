import type { CSSProperties } from 'react';
import type { TournamentDetailsResponse } from '@/shared/api/types';
import { formatPlayoffStage } from '@/shared/lib/formatPlayoffStage';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';

export function PlayoffBracket({ stages }: { stages: NonNullable<TournamentDetailsResponse['playoff']> }) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Сетка плей-офф</h2>
          <p className="section-header__description">Победители выделены. На узком экране прокрутите сетку вправо.</p>
        </div>
      </div>
      <div className="playoff-bracket" role="region" aria-label="Сетка плей-офф" tabIndex={0}>
        <div className="playoff-bracket__stages" style={{ '--stage-count': stages.length } as CSSProperties}>
          {stages.map((stage, stageIndex) => (
            <section className="playoff-bracket__stage" key={stage.topN} aria-label={formatPlayoffStage(stage.topN)}>
              <h3>{formatPlayoffStage(stage.topN)}</h3>
              <div className="playoff-bracket__matches" style={{ gridTemplateRows: `repeat(${Math.max(1, stage.matches.length)}, 1fr)` }}>
                {stage.matches.map((match, index) => (
                  <div className="playoff-bracket__slot" key={`${index}-${match.playerA.id}-${match.playerB.id}`} data-outgoing={stageIndex < stages.length - 1 || undefined} data-incoming={stageIndex > 0 || undefined}>
                    <article className="playoff-bracket__match" aria-label={`${formatPlayoffStage(stage.topN)}: ${match.playerA.name} — ${match.playerB.name}`}>
                      {[match.playerA, match.playerB].map((player, side) => (
                        <div key={side} className={`playoff-bracket__player${match.winnerPlayerId === player.id ? ' playoff-bracket__player--winner' : ''}`}>
                          <div>
                            <EntityLink type="player" id={player.id} name={player.name} />
                            <div className="playoff-bracket__deck">{player.deck ? <EntityLink type="deck" id={player.deck.id} name={player.deck.name} /> : 'Колода не указана'}</div>
                          </div>
                          <strong aria-label={`${player.name}: ${player.score}${match.winnerPlayerId === player.id ? ', победа' : ''}`}>{player.score}</strong>
                        </div>
                      ))}
                    </article>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Card>
  );
}
