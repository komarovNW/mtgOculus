import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMatchups } from '@/entities/matchup/api';
import { MatchupsPage } from '@/pages/matchups/MatchupsPage';
import { mapMatchupMatrixResponse } from '@/shared/api/matchup-mappers';
import { matchupResponse } from '@/test/fixtures/matchups';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/matchup/api', () => ({ getMatchups: vi.fn() }));
vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [{ id: 'moscow', name: 'Москва' }, { id: 'spb', name: 'Петербург' }] }),
  getClubs: vi.fn().mockResolvedValue({
    items: [
      { id: 'club', name: 'Клуб', cityId: 'moscow' },
      { id: 'second-club', name: 'Второй клуб', cityId: 'moscow' },
    ],
  }),
  getFormats: vi.fn().mockResolvedValue({ items: [{ id: 'legacy', name: 'Legacy' }, { id: 'pauper', name: 'Pauper' }] }),
}));

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.search}</output><button onClick={() => navigate(-1)}>Назад</button></>;
}

function setup(initialEntry = '/matchups', queryGcTime = 0) {
  return render(<TestProviders initialEntry={initialEntry} queryGcTime={queryGcTime}><MatchupsPage /><LocationProbe /></TestProviders>);
}

describe('MatchupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMatchups).mockResolvedValue(mapMatchupMatrixResponse(matchupResponse()));
  });

  it('renders whole-field totals, draws, mirrors, no meetings and small sample details', async () => {
    const user = userEvent.setup();
    setup('/matchups?cityId=moscow&formatId=legacy&top=3');
    const cell = await screen.findByRole('button', { name: /Tempo против Forge/ });
    expect(cell).toHaveTextContent('67%');
    expect(cell).toHaveTextContent('*');
    expect(screen.getByRole('button', { name: /Tempo против всё поле/ })).toHaveTextContent('100');
    expect(screen.getByRole('button', { name: /Tempo против Tempo/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Tempo против Tempo/ })).not.toHaveTextContent('%');
    expect(screen.getByRole('button', { name: /Tempo против Lands/ })).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: /Forge против Lands/ })).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: /Forge против Tempo/ })).toHaveTextContent('0%');
    await user.click(cell);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('2 / 0 / 1');
    expect(tooltip).toHaveTextContent('66,67%');
    expect(tooltip).toHaveTextContent('20,77% – 93,85%');
    expect(tooltip).toHaveTextContent('Мало данных');
    expect(cell).toHaveAttribute('aria-describedby', tooltip.id);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Tempo' });
    expect(links[0]).toHaveAttribute('href', '/decks/0?cityId=moscow&formatId=legacy');
  });

  it('supports hover, touch clicks and arrow navigation without tabbing through every cell', async () => {
    const user = userEvent.setup();
    setup();
    const overall = await screen.findByRole('button', { name: /Tempo против всё поле/ });
    fireEvent.pointerEnter(overall, { pointerType: 'mouse' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('включая колоды за пределами матрицы');
    fireEvent.focus(overall);
    await user.click(overall);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    const tempoForge = screen.getByRole('button', { name: /Tempo против Forge/ });
    expect(tempoForge).toHaveFocus();
    expect(tempoForge).toHaveAttribute('tabindex', '0');
    expect(overall).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tempo → Forge');
    fireEvent.click(screen.getByRole('button', { name: /Tempo против Tempo/ }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Зеркальных матчей: 2');
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('requires a format and cancels the active query when filters reset', async () => {
    const user = userEvent.setup();
    setup('/matchups?formatId=');
    expect(screen.getByRole('heading', { name: 'Выберите формат' })).toBeInTheDocument();
    expect(getMatchups).not.toHaveBeenCalled();
    await screen.findByRole('option', { name: 'Legacy' });
    vi.mocked(getMatchups).mockImplementation(() => new Promise(() => {}));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Формат' }), 'legacy');
    expect(await screen.findByText('Загружаем матрицу матчапов…')).toBeInTheDocument();
    const signal = vi.mocked(getMatchups).mock.calls[0][1]?.signal;
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole('heading', { name: 'Выберите формат' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('applies a matrix size preset, keeps it in URL and reuses cache on Back', async () => {
    const user = userEvent.setup();
    setup('/matchups?formatId=legacy&top=3', 30_000);
    await screen.findByRole('table');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Колод в матрице' }), '40');
    await waitFor(() => expect(getMatchups).toHaveBeenLastCalledWith(expect.objectContaining({ top: 40 }), { signal: expect.any(AbortSignal) }));
    expect(screen.getByTestId('location')).toHaveTextContent('top=40');
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('combobox', { name: 'Колод в матрице' })).toHaveValue('3');
    expect(getMatchups).toHaveBeenCalledTimes(2);
  });

  it.each(['999', '1', '3.5', 'invalid'])('does not send invalid URL top=%s', async (top) => {
    setup(`/matchups?top=${top}`);
    await screen.findByRole('table');
    expect(getMatchups).toHaveBeenCalledWith(expect.objectContaining({ top: 15 }), { signal: expect.any(AbortSignal) });
  });

  it('passes all filters and clears the club when the city changes', async () => {
    const user = userEvent.setup();
    setup('/matchups?cityId=moscow&clubId=club&formatId=legacy&tournamentType=daily&dateFrom=2026-01-01&dateTo=2026-09-06&top=2');
    await screen.findByRole('table');
    expect(getMatchups).toHaveBeenCalledWith({ cityId: 'moscow', clubId: 'club', formatId: 'legacy', tournamentType: 'daily',
      dateFrom: '2026-01-01', dateTo: '2026-09-06', top: 2 }, { signal: expect.any(AbortSignal) });
    await user.selectOptions(screen.getByLabelText('Город'), 'spb');
    await waitFor(() => expect(getMatchups).toHaveBeenLastCalledWith(expect.objectContaining({ cityId: 'spb', clubId: undefined, top: 2 }), { signal: expect.any(AbortSignal) }));
  });

  it('shows an empty result and allows retry after a failed request', async () => {
    const user = userEvent.setup();
    vi.mocked(getMatchups).mockRejectedValueOnce(new Error('Сервер недоступен'))
      .mockResolvedValueOnce({ decks: [], rows: [], appliedFilters: {} });
    setup();
    expect(await screen.findByText('Сервер недоступен')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Попробовать ещё раз' }));
    expect(await screen.findByRole('heading', { name: 'Матчапы не найдены' })).toBeInTheDocument();
  });

  it('does not request an inverted date range', () => {
    setup('/matchups?dateFrom=2026-09-06&dateTo=2026-01-01');
    expect(screen.getByRole('heading', { name: 'Проверьте период' })).toBeInTheDocument();
    expect(getMatchups).not.toHaveBeenCalled();
  });

  it('keeps identical deck order across headers and rows', async () => {
    setup();
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('rowheader').map((cell) => within(cell).getByRole('link').textContent))
      .toEqual(['Tempo', 'Forge', 'Lands']);
    expect(within(table).getAllByRole('columnheader').slice(2).map((cell) => cell.textContent))
      .toEqual(['Tempo', 'Forge', 'Lands']);
  });

  describe('quick periods and common filters', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 8, 6, 12));
    });
    afterEach(() => vi.useRealTimers());

    it('replaces the old dates atomically, keeps the other filters and does not repeat an active selection', async () => {
      const user = userEvent.setup();
      setup('/matchups?cityId=moscow&clubId=club&formatId=legacy&tournamentType=daily&dateFrom=2026-01-01&dateTo=2026-02-01&top=3');
      await screen.findByRole('table');
      await user.click(screen.getByRole('button', { name: '30 дней' }));
      await waitFor(() => expect(getMatchups).toHaveBeenCalledTimes(2));
      expect(getMatchups).toHaveBeenLastCalledWith({ cityId: 'moscow', clubId: 'club', formatId: 'legacy', tournamentType: 'daily',
        dateFrom: '2026-08-08', dateTo: '2026-09-06', top: 3 }, { signal: expect.any(AbortSignal) });
      expect(screen.getByLabelText('Дата от')).toHaveValue('2026-08-08');
      expect(screen.getByLabelText('Дата до')).toHaveValue('2026-09-06');
      expect(screen.getByRole('button', { name: '30 дней' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('location')).toHaveTextContent('dateFrom=2026-08-08');
      expect(screen.getByRole('group', { name: 'Период' })).toHaveTextContent('08.08.2026 — 06.09.2026');
      await user.click(screen.getByRole('button', { name: '30 дней' }));
      expect(getMatchups).toHaveBeenCalledTimes(2);
    });

    it('recognizes URL dates, switches to a custom period on manual input and restores it on Back', async () => {
      const user = userEvent.setup();
      setup('/matchups?dateFrom=2026-08-08&dateTo=2026-09-06', 30_000);
      await screen.findByRole('table');
      expect(screen.getByRole('button', { name: '30 дней' })).toHaveAttribute('aria-pressed', 'true');
      fireEvent.change(screen.getByLabelText('Дата от'), { target: { value: '2026-07-01' } });
      const group = screen.getByRole('group', { name: 'Период' });
      expect(getMatchups).toHaveBeenCalledTimes(1);
      expect(group).toHaveTextContent('08.08.2026 — 06.09.2026');
      await user.click(screen.getByRole('button', { name: 'Применить период' }));
      await waitFor(() => expect(getMatchups).toHaveBeenCalledTimes(2));
      expect(group).toHaveTextContent('Свой период: 01.07.2026 — 06.09.2026');
      expect(within(group).getAllByRole('button').every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(true);
      await user.click(screen.getByRole('button', { name: '90 дней' }));
      expect(screen.getByLabelText('Дата от')).toHaveValue('2026-06-09');
      await user.click(screen.getByRole('button', { name: 'Назад' }));
      expect(group).toHaveTextContent('Свой период: 01.07.2026 — 06.09.2026');
      expect(screen.getByLabelText('Дата от')).toHaveValue('2026-07-01');
    });

    it('does not apply an inverted manual period and lets the user cancel the draft', async () => {
      const user = userEvent.setup();
      setup('/matchups?dateFrom=2026-08-08&dateTo=2026-09-06');
      await screen.findByRole('table');
      fireEvent.change(screen.getByLabelText('Дата от'), { target: { value: '2026-10-01' } });
      expect(screen.getByRole('alert')).toHaveTextContent('Дата начала должна быть не позже даты окончания.');
      expect(screen.getByRole('button', { name: 'Применить период' })).toBeDisabled();
      expect(getMatchups).toHaveBeenCalledTimes(1);
      await user.click(screen.getByRole('button', { name: 'Отменить' }));
      expect(screen.getByLabelText('Дата от')).toHaveValue('2026-08-08');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(getMatchups).toHaveBeenCalledTimes(1);
    });

    it('clears only dates with All time and preserves the period when location changes', async () => {
      const user = userEvent.setup();
      setup('/matchups?cityId=moscow&clubId=club&formatId=legacy&tournamentType=daily&dateFrom=2026-08-08&dateTo=2026-09-06&top=3');
      await screen.findByRole('table');
      await user.selectOptions(screen.getByLabelText('Город'), 'spb');
      expect(screen.getByRole('button', { name: '30 дней' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Дата от')).toHaveValue('2026-08-08');
      await user.click(screen.getByRole('button', { name: 'Всё время' }));
      await waitFor(() => expect(getMatchups).toHaveBeenLastCalledWith({ cityId: 'spb', clubId: undefined, formatId: 'legacy', tournamentType: 'daily',
        dateFrom: undefined, dateTo: undefined, top: 3 }, { signal: expect.any(AbortSignal) }));
      expect(screen.getByLabelText('Дата от')).toHaveValue('');
      expect(screen.getByLabelText('Дата до')).toHaveValue('');
      expect(screen.getByTestId('location')).not.toHaveTextContent('dateFrom');
      expect(screen.getByTestId('location')).not.toHaveTextContent('dateTo');
      expect(screen.getByRole('button', { name: 'Всё время' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('preserves the selected dates in deck links and when applying matrix size', async () => {
      const user = userEvent.setup();
      setup('/matchups?cityId=moscow&formatId=legacy&dateFrom=2026-08-08&dateTo=2026-09-06&top=3');
      await screen.findByRole('table');
      expect(screen.getAllByRole('link', { name: 'Tempo' })[0]).toHaveAttribute('href',
        '/decks/0?cityId=moscow&formatId=legacy&dateFrom=2026-08-08&dateTo=2026-09-06');
      await user.selectOptions(screen.getByRole('combobox', { name: 'Колод в матрице' }), '10');
      await waitFor(() => expect(getMatchups).toHaveBeenLastCalledWith(expect.objectContaining({ top: 10, dateFrom: '2026-08-08', dateTo: '2026-09-06' }), { signal: expect.any(AbortSignal) }));
      expect(screen.getByRole('button', { name: '30 дней' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('lets presets repair an invalid period and returns to All time on reset', async () => {
      const user = userEvent.setup();
      setup('/matchups?dateFrom=2026-09-06&dateTo=2026-01-01');
      expect(getMatchups).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: '365 дней' }));
      await screen.findByRole('table');
      expect(screen.queryByRole('heading', { name: 'Проверьте период' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Дата от')).toHaveValue('2025-09-07');
      await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
      expect(screen.getByRole('button', { name: 'Всё время' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('heading', { name: 'Выберите формат' })).toBeInTheDocument();
    });
  });
});
