import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MatchupMatrixRow, MatchupStats } from '@/shared/api/types';
import { formatMatchupPercent as matchupPercent } from '@/shared/lib/formatMatchupPercent';
import { Badge } from '@/shared/ui/Badge';

type MatchupDetailsProps = {
  id: string;
  anchor: HTMLElement;
  row: MatchupMatrixRow;
  opponent: string;
  stats: MatchupStats | null;
  mirror: boolean;
  overall: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

export function MatchupDetails({
  id, anchor, row, opponent, stats, mirror, overall, onPointerEnter, onPointerLeave,
}: MatchupDetailsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!ref.current) return;
      const target = anchor.getBoundingClientRect();
      const popup = ref.current.getBoundingClientRect();
      const margin = 12;
      const top = target.top >= popup.height + margin
        ? target.top - popup.height - 8 : target.bottom + 8;
      setPosition({
        left: Math.max(margin, Math.min(target.left + target.width / 2 - popup.width / 2, window.innerWidth - popup.width - margin)),
        top: Math.max(margin, Math.min(top, window.innerHeight - popup.height - margin)),
      });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    return () => window.removeEventListener('scroll', updatePosition, true);
  }, [anchor, row, opponent, stats, mirror, overall]);

  return createPortal(
    <div id={id} ref={ref} role="tooltip" className="matchup-details" style={position}
      onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <strong className="matchup-details__title">{row.deck.name} → {opponent}</strong>
      {mirror ? (
        <p>Зеркальных матчей: {row.mirrorMatches}. В процент побед они не входят.</p>
      ) : !stats || stats.matchesCount === 0 ? (
        <p>Нет сыгранных матчей по выбранным фильтрам.</p>
      ) : (
        <>
          <dl className="matchup-details__stats">
            <div><dt>Матчей</dt><dd>{stats.matchesCount}</dd></div>
            <div><dt>Победы / поражения / ничьи</dt><dd>{stats.wins} / {stats.losses} / {stats.draws}</dd></div>
            <div><dt>Процент побед</dt><dd>{matchupPercent(stats.winRate)}</dd></div>
            <div><dt>Доверительный интервал</dt><dd>{stats.winRateLow !== null && stats.winRateHigh !== null
              ? `${matchupPercent(stats.winRateLow)} – ${matchupPercent(stats.winRateHigh)}` : 'Нет данных'}</dd></div>
          </dl>
          {stats.isSmallSample ? <Badge variant="warning">Малая выборка</Badge> : null}
          {stats.isSmallSample ? <p>Матчей пока мало: процент побед может заметно измениться.</p> : null}
        </>
      )}
      {overall ? <p>Против всех колод выбранного среза, включая колоды за пределами матрицы. Без зеркал.</p> : null}
    </div>,
    document.body,
  );
}
