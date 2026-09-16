import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { MatchupMatrixResponse, MatchupStats } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { formatMatchupPercent as matchupPercent } from '@/shared/lib/formatMatchupPercent';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MatchupDetails } from './MatchupDetails';
import { getMatchupHeatColor, matchupHeatGradient } from './matchupHeatmap';
import './matchup-matrix.css';

type ActiveCell = { row: number; column: number; anchor: HTMLButtonElement; pinned: boolean };

function heatStyle(stats: MatchupStats | null): CSSProperties {
  if (!stats || stats.matchesCount === 0) return {};
  return {
    '--matchup-heat': getMatchupHeatColor(stats.winRate),
  } as CSSProperties;
}

export function MatchupMatrix({ data, isFetching = false }: { data: MatchupMatrixResponse; isFetching?: boolean }) {
  const tooltipId = useId();
  const descriptionId = useId();
  const [active, setActive] = useState<ActiveCell | null>(null);
  const [tabCell, setTabCell] = useState({ row: 0, column: -1 });
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const tableRef = useRef<HTMLTableElement>(null);

  function cancelClose() {
    clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive((current) => current?.pinned ? current : null), 150);
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!active) return;
    const dismiss = () => { clearTimeout(closeTimer.current); setActive(null); };
    const onScroll = () => {
      // Arrow navigation may scroll the focused cell into view; keep its details readable.
      if (document.activeElement !== active.anchor) dismiss();
    };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!active.anchor.contains(target) && !document.getElementById(tooltipId)?.contains(target)) dismiss();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [active, tooltipId]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, row: number, column: number) {
    const direction = {
      ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0],
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const nextRow = Math.max(0, Math.min(data.rows.length - 1, row + direction[0]));
    const nextColumn = Math.max(-1, Math.min(data.decks.length - 1, column + direction[1]));
    tableRef.current?.querySelector<HTMLButtonElement>(`[data-row="${nextRow}"][data-column="${nextColumn}"]`)?.focus();
  }

  function renderCell(rowIndex: number, column: number) {
    const row = data.rows[rowIndex];
    const overall = column === -1;
    const mirror = !overall && row.deck.id === data.decks[column].id;
    const opponent = overall ? 'всё поле' : data.decks[column].name;
    const stats = overall ? row.overall : row.cells[column];
    const hasMatches = !mirror && stats !== null && stats.matchesCount > 0;
    const selected = active?.row === rowIndex && active.column === column;
    const label = `${row.deck.name} против ${opponent}: ${mirror
      ? `зеркальных матчей ${row.mirrorMatches}`
      : hasMatches ? `${matchupPercent(stats.winRate)} побед, матчей ${stats.matchesCount}${stats.isSmallSample ? ', малая выборка' : ''}`
        : 'нет матчей'}`;

    return (
      <td key={column} className={cn('matchup-matrix__cell', overall && 'matchup-matrix__overall',
        mirror && 'matchup-matrix__mirror', active?.column === column && 'matchup-matrix__column-active')}
        style={mirror ? undefined : heatStyle(stats)}>
        <button type="button" className={cn('matchup-matrix__value', selected && 'matchup-matrix__value--active')}
          data-row={rowIndex} data-column={column} aria-label={label}
          aria-describedby={selected ? tooltipId : undefined} aria-expanded={selected}
          tabIndex={tabCell.row === rowIndex && tabCell.column === column ? 0 : -1}
          onPointerEnter={(event) => {
            if (event.pointerType === 'touch') return;
            cancelClose();
            const anchor = event.currentTarget;
            setActive((current) => current?.pinned ? current : { row: rowIndex, column, anchor, pinned: false });
          }}
          onPointerLeave={scheduleClose}
          onFocus={(event) => {
            cancelClose();
            setTabCell({ row: rowIndex, column });
            setActive({ row: rowIndex, column, anchor: event.currentTarget, pinned: false });
          }}
          onBlur={scheduleClose}
          onKeyDown={(event) => navigate(event, rowIndex, column)}
          onClick={(event) => {
            cancelClose();
            const anchor = event.currentTarget;
            setActive((current) => current?.pinned && selected ? null : { row: rowIndex, column, anchor, pinned: true });
          }}>
          {mirror ? (
            <span className="matchup-matrix__mirror-count">{row.mirrorMatches}</span>
          ) : hasMatches ? (
            <>
              <strong>{stats.winRate === null ? '—' : `${Math.round(stats.winRate)}%`}</strong>
              <span className="matchup-matrix__count">{stats.matchesCount}</span>
              {stats.isSmallSample ? <span className="matchup-matrix__small" aria-hidden="true">*</span> : null}
            </>
          ) : <span className="matchup-matrix__missing">—</span>}
        </button>
      </td>
    );
  }

  const activeRow = active ? data.rows[active.row] : undefined;
  return (
    <Card className="matchup-card">
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Колода против колоды</h2>
          <p id={descriptionId} className="section-header__description">
            Строка — ваша колода, столбец — соперник. В ячейке — процент побед и число матчей.
            <span className="matchup-desktop-help"> Наведите, нажмите или выберите ячейку клавишей Tab; стрелки перемещают по матрице, Escape закрывает подробности.</span>
            <span className="matchup-mobile-help"> Листайте матрицу вбок. Нажмите на ячейку для подробностей.</span>
          </p>
        </div>
        <span className="matchup-card__status" role="status">{isFetching ? 'Обновляем…' : `Колод: ${data.decks.length}`}</span>
      </div>
      <div className="matchup-legend" aria-label="Обозначения матрицы">
        <div className="matchup-legend__scale" role="img"
          aria-label="Процент побед: от красного при 0% через янтарный при 50% к зелёному при 100%">
          <div className="matchup-legend__gradient" style={{ background: matchupHeatGradient }} />
          <div className="matchup-legend__ticks">
            {[0, 25, 50, 75, 100].map((value) => <span key={value}>{value}%</span>)}
          </div>
        </div>
        <span><b>*</b> Малая выборка</span>
        <span>— Нет матчей</span>
      </div>
      <div className="matchup-matrix-scroll" role="region" aria-label="Матрица результатов матчапов" tabIndex={0}>
        <table className="matchup-matrix" ref={tableRef} aria-describedby={descriptionId}
          style={{ width: `calc(var(--matchup-name-width) + ${96 + data.decks.length * 64}px)` }}>
          <caption className="matchup-sr-only">Процент побед колоды в строке против колоды в столбце</caption>
          <colgroup><col style={{ width: 'var(--matchup-name-width)' }} /><col style={{ width: 96 }} />
            {data.decks.map((deck) => <col key={deck.id} style={{ width: 64 }} />)}</colgroup>
          <thead>
            <tr>
              <th scope="col" className="matchup-matrix__corner">Колода <span>Доля метагейма</span></th>
              <th scope="col" className={cn('matchup-matrix__overall-heading', active?.column === -1 && 'matchup-matrix__heading-active')}>
                Против всего поля
              </th>
              {data.decks.map((deck, index) => (
                <th scope="col" key={deck.id} className={cn('matchup-matrix__opponent', active?.column === index && 'matchup-matrix__heading-active')}>
                  <div><EntityLink id={deck.id} name={deck.name} type="deck" /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={row.deck.id} className={cn(active?.row === rowIndex && 'matchup-matrix__row-active')}>
                <th scope="row" className="matchup-matrix__deck">
                  <EntityLink id={row.deck.id} name={row.deck.name} colors={row.deck.colors} type="deck" />
                  <span className="matchup-matrix__share">{matchupPercent(row.metaShare)}</span>
                </th>
                {renderCell(rowIndex, -1)}
                {data.decks.map((_, column) => renderCell(rowIndex, column))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="matchup-card__note">
        «Против всего поля» — результат против всех колод по выбранным фильтрам, включая колоды за пределами матрицы.
        На диагонали — число зеркальных матчей; в процент побед они не входят. При ничьих проценты двух сторон могут не давать 100% в сумме.
      </p>
      {active && activeRow ? <MatchupDetails id={tooltipId} anchor={active.anchor} row={activeRow}
        opponent={active.column === -1 ? 'всё поле' : data.decks[active.column].name}
        stats={active.column === -1 ? activeRow.overall : activeRow.cells[active.column]}
        mirror={active.column >= 0 && activeRow.deck.id === data.decks[active.column].id}
        overall={active.column === -1} onPointerEnter={cancelClose} onPointerLeave={scheduleClose} /> : null}
    </Card>
  );
}
