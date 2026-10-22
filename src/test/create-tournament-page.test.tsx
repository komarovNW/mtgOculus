import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTournament } from '@/entities/admin-tournament/api';
import { getLeagueOptions, getLeagueQualifierOptions } from '@/entities/league/api';
import { CreateTournamentPage } from '@/pages/create-tournament/CreateTournamentPage';
import { AppError } from '@/shared/api/client';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/admin-tournament/api', () => ({
  createTournament: vi.fn(),
}));

vi.mock('@/entities/league/api', () => ({
  getLeagueOptions: vi.fn().mockResolvedValue([{
    id: '7',
    name: 'Осенняя лига',
    club: { id: 'goldfish_msk', name: 'Goldfish', cityId: 'moscow' },
    format: { id: 'pauper', name: 'Pauper' },
    dateStart: '2026-09-01',
    dateEnd: '2026-11-30',
  }]),
  getLeagueQualifierOptions: vi.fn().mockResolvedValue([{
    id: '12',
    title: 'Store Championship',
    date: '2026-09-27',
    slots: 2,
    league: { id: '7', name: 'Осенняя лига' },
  }]),
}));

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({
    items: [{ id: 'moscow', name: 'Москва' }],
  }),
  getClubs: vi.fn().mockResolvedValue({
    items: [
      { id: 'edinorog_moscow', cityId: 'moscow', name: 'Единорог' },
      { id: 'goldfish_msk', cityId: 'moscow', name: 'Goldfish' },
    ],
  }),
  getFormats: vi.fn().mockResolvedValue({
    items: [
      { id: 'pauper', name: 'Pauper' },
      { id: 'legacy', name: 'Legacy' },
    ],
  }),
}));

describe('CreateTournamentPage', () => {
  beforeEach(() => {
    vi.mocked(createTournament).mockReset();
    vi.mocked(getLeagueOptions).mockClear();
    vi.mocked(getLeagueQualifierOptions).mockClear();
  });

  it('keeps the Aetherhub directory and the complete input guide available', async () => {
    render(
      <TestProviders>
        <CreateTournamentPage />
      </TestProviders>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Добавить' }))
      .toBeInTheDocument();
    expect(screen.getByText('Как добавить событие')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Единорог/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/Edinorog',
    );
    expect(screen.getByRole('link', { name: /Голдфиш/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/goldfish',
    );
    expect(screen.getByRole('link', { name: /Pair of Dice/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/Andysays',
    );
    expect(screen.getByRole('link', { name: /Портал/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/PhillipRus',
    );
    expect(screen.getByRole('link', { name: /@komarovNV/ })).toHaveAttribute(
      'href',
      'https://t.me/komarovNV',
    );

    expect(screen.getByText('1. С именами игроков')).toBeInTheDocument();
    expect(screen.getByText('2. Только колоды — по порядку мест')).toBeInTheDocument();
    expect(screen.getByText('Так добавлять нельзя')).toBeInTheDocument();
  });

  it('uses today, Moscow and a daily as the initial defaults', async () => {
    render(
      <TestProviders>
        <CreateTournamentPage />
      </TestProviders>,
    );

    const today = new Date();
    const expectedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    expect(await screen.findByLabelText(/Дата события/)).toHaveValue(expectedDate);
    expect(await screen.findByLabelText(/Город/)).toHaveValue('moscow');
    expect(await screen.findByLabelText(/Клуб/)).toHaveValue('');
    expect(screen.getByLabelText(/Тип события/)).toHaveValue('daily');
    expect(screen.getByLabelText(/Формат/)).toHaveValue('');
    expect(screen.getByLabelText(/Лига/)).toBeDisabled();
  });

  it('requires a playoff and deck order before importing a tournament', async () => {
    const user = userEvent.setup();
    vi.mocked(createTournament).mockResolvedValue({ success: true, tournamentId: '1', message: 'Готово' });
    render(<TestProviders><CreateTournamentPage /></TestProviders>);
    await user.selectOptions(await screen.findByLabelText(/Клуб/), 'goldfish_msk');
    await user.selectOptions(screen.getByLabelText(/Формат/), 'pauper');
    await user.selectOptions(screen.getByLabelText(/Тип события/), 'tournament');
    await user.type(screen.getByLabelText(/Ссылка на Aetherhub/), 'https://aetherhub.com/Tourney/1');
    await user.type(screen.getByLabelText(/Список игроков и колод/), 'Lands');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(createTournament).not.toHaveBeenCalled();
    expect(screen.getByText('Выберите порядок колод.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Финал · 0\/1/ }));
    await user.type(screen.getByLabelText(/Игрок A · Финал 1/), 'Александр');
    await user.type(screen.getByLabelText(/Игрок B · Финал 1/), 'Никита');
    await user.selectOptions(screen.getByLabelText(/Порядок колод/), 'swiss');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(createTournament).toHaveBeenCalledWith(expect.objectContaining({
      tournamentType: 'tournament', decksOrder: 'swiss',
      playoffMatches: [{ topN: 2, playerA: 'Александр', playerB: 'Никита', playerAWins: 2, playerBWins: 0 }],
    }), expect.anything());
  });

  it('imports a tournament from Melee.gg without manual result fields', async () => {
    const user = userEvent.setup();
    vi.mocked(createTournament).mockResolvedValue({
      success: true,
      tournamentId: '2',
      message: 'Турнир добавлен.',
    });
    render(<TestProviders><CreateTournamentPage /></TestProviders>);

    await user.selectOptions(await screen.findByLabelText(/Клуб/), 'goldfish_msk');
    await user.selectOptions(screen.getByLabelText(/Формат/), 'pauper');
    await user.selectOptions(screen.getByLabelText(/Тип события/), 'tournament');
    await user.selectOptions(screen.getByLabelText(/Источник результатов/), 'melee');

    expect(screen.queryByLabelText(/Ссылка на Aetherhub/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Файл итоговых стендингов/)).not.toBeInTheDocument();
    expect(screen.queryByText('Плей-офф')).not.toBeInTheDocument();
    expect(screen.queryByText(/Учитывать в матрице матчапов/)).not.toBeInTheDocument();
    expect(screen.getByText(/Турнир должен быть завершён на Melee.gg/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Ссылка или номер турнира Melee.gg/), '12345');
    await user.type(screen.getByLabelText(/Список игроков и колод/), 'Lands\nDoomsday');
    expect(screen.getByText(/Итоговые места учитывают плей-офф/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Порядок колод/), 'swiss');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(createTournament).toHaveBeenCalledWith(expect.objectContaining({
      tournamentType: 'tournament',
      tournamentImportSource: 'melee',
      meleeUrl: '12345',
      playerDecksText: 'Lands\nDoomsday',
      decksOrder: 'swiss',
    }), expect.anything());
  });

  it('offers the regular import when Melee.gg does not support the tournament', async () => {
    const user = userEvent.setup();
    vi.mocked(createTournament).mockRejectedValue(new AppError({
      status: 422,
      code: 'MELEE_UNSUPPORTED_TOURNAMENT',
      message: 'Такой турнир не поддерживается.',
      details: [{
        code: 'MELEE_UNSUPPORTED_TOURNAMENT',
        message: 'Такой турнир не поддерживается.',
        source: 'meleeUrl',
      }],
    }));
    render(<TestProviders><CreateTournamentPage /></TestProviders>);

    await user.selectOptions(await screen.findByLabelText(/Клуб/), 'goldfish_msk');
    await user.selectOptions(screen.getByLabelText(/Формат/), 'pauper');
    await user.selectOptions(screen.getByLabelText(/Тип события/), 'tournament');
    await user.selectOptions(screen.getByLabelText(/Источник результатов/), 'melee');
    await user.type(screen.getByLabelText(/Ссылка или номер турнира Melee.gg/), '12345');
    await user.type(
      screen.getByLabelText(/Список игроков и колод/),
      'Игрок - Lands',
    );
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText(/нельзя загрузить автоматически с Melee.gg/))
      .toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Перейти к обычному импорту' }));
    expect(screen.getByLabelText(/Источник результатов/)).toHaveValue('standard');
    expect(screen.getByLabelText(/Ссылка на Aetherhub/)).toBeInTheDocument();
  });

  it('loads matching leagues for a daily and sends the selected league', async () => {
    const user = userEvent.setup();
    vi.mocked(createTournament).mockResolvedValue({
      success: true,
      tournamentId: '145',
      message: 'Дейлик добавлен.',
    });

    render(
      <TestProviders>
        <CreateTournamentPage />
      </TestProviders>,
    );

    await user.selectOptions(await screen.findByLabelText(/Клуб/), 'goldfish_msk');
    await user.selectOptions(screen.getByLabelText(/Формат/), 'pauper');
    const leagueSelect = await screen.findByLabelText(/Лига/);

    expect(getLeagueOptions).toHaveBeenCalledWith({
      cityId: 'moscow',
      clubId: 'goldfish_msk',
      formatId: 'pauper',
      date: (screen.getByLabelText(/Дата события/) as HTMLInputElement).value,
    }, { signal: expect.any(AbortSignal) });
    expect(leagueSelect).toHaveTextContent('Осенняя лига');

    await user.selectOptions(leagueSelect, '7');
    await user.type(
      screen.getByLabelText(/Ссылка на Aetherhub/),
      'https://aetherhub.com/Tourney/RoundTourney/100523',
    );
    await user.type(
      screen.getByLabelText(/Список игроков и колод/),
      'Колошко Александр - Lands',
    );
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(vi.mocked(createTournament).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ leagueId: '7' }),
    );
  });

  it('links a tournament import to an available league qualifier', async () => {
    const user = userEvent.setup();
    vi.mocked(createTournament).mockResolvedValue({
      success: true,
      tournamentId: '146',
      message: 'Турнир добавлен.',
    });

    render(<TestProviders><CreateTournamentPage /></TestProviders>);
    await user.selectOptions(await screen.findByLabelText(/Клуб/), 'goldfish_msk');
    await user.selectOptions(screen.getByLabelText(/Формат/), 'pauper');
    await user.selectOptions(screen.getByLabelText(/Тип события/), 'tournament');
    await user.selectOptions(await screen.findByLabelText(/Лига отбора/), '7');

    expect(getLeagueQualifierOptions).toHaveBeenCalledWith(
      '7',
      { signal: expect.any(AbortSignal) },
    );

    await user.selectOptions(await screen.findByLabelText(/Отборочный турнир/), '12');
    await user.selectOptions(screen.getByLabelText(/Источник результатов/), 'melee');
    await user.type(screen.getByLabelText(/Ссылка или номер турнира Melee.gg/), '12345');
    await user.type(screen.getByLabelText(/Список игроков и колод/), 'Игрок - Lands');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(createTournament).toHaveBeenCalledWith(expect.objectContaining({
      tournamentType: 'tournament',
      leagueId: '7',
      leagueQualifierId: '12',
    }), expect.anything());
  });

  it('clears only the Aetherhub URL and decks when adding another event', async () => {
    const user = userEvent.setup();

    vi.mocked(createTournament).mockResolvedValue({
      success: true,
      tournamentId: '145',
      message: 'Событие добавлено.',
    });

    render(
      <TestProviders>
        <CreateTournamentPage />
      </TestProviders>,
    );

    const dateInput = await screen.findByLabelText(/Дата события/);
    const clubSelect = await screen.findByLabelText(/Клуб/);
    const formatSelect = screen.getByLabelText(/Формат/);
    const aetherhubInput = screen.getByLabelText(/Ссылка на Aetherhub/);
    const decksInput = screen.getByLabelText(/Список игроков и колод/);

    await user.clear(dateInput);
    await user.type(dateInput, '2026-07-24');
    await user.selectOptions(clubSelect, 'edinorog_moscow');
    await user.selectOptions(formatSelect, 'legacy');
    await user.type(
      aetherhubInput,
      'https://aetherhub.com/Tourney/RoundTourney/100523',
    );
    await user.type(decksInput, 'Колошко Александр - Lands');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(
      await screen.findByRole('heading', { name: 'Событие добавлено' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить ещё' }));

    expect(dateInput).toHaveValue('2026-07-24');
    expect(screen.getByLabelText(/Город/)).toHaveValue('moscow');
    expect(clubSelect).toHaveValue('edinorog_moscow');
    expect(screen.getByLabelText(/Тип события/)).toHaveValue('daily');
    expect(formatSelect).toHaveValue('legacy');
    expect(aetherhubInput).toHaveValue('');
    expect(decksInput).toHaveValue('');
  });

  it('shows structured backend errors and warnings after a failed import', async () => {
    const user = userEvent.setup();

    vi.mocked(createTournament).mockRejectedValue(
      new AppError({
        status: 422,
        code: 'DECK_PLAYER_NOT_FOUND_IN_STANDINGS',
        message:
          'Игрок "Колошко Александр" из списка колод отсутствует в стендингах.',
        details: [
          {
            code: 'DECK_PLAYER_NOT_FOUND_IN_STANDINGS',
            message:
              'Игрок "Колошко Александр" из списка колод отсутствует в стендингах.',
            source: 'playerDecksText',
            playerName: 'Колошко Александр',
          },
          {
            code: 'INVALID_MATCH_SCORE',
            message: 'Некорректный счёт матча в раунде 5, столе 11.',
            source: 'allRoundsFile',
            roundNumber: 5,
            tableNumber: 11,
            rawValue: '2-1-1',
          },
        ],
        warnings: [
          {
            code: 'PLAYER_NAME_NORMALIZED',
            message:
              'Имя "Панферов Александр" сопоставлено с "Панфёров Александр".',
            source: 'playerDecksText',
            rawValue: 'Панферов Александр',
            matchedValue: 'Панфёров Александр',
          },
        ],
      }),
    );

    render(
      <TestProviders>
        <CreateTournamentPage />
      </TestProviders>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Добавить' }),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Дата события/));
    await user.type(screen.getByLabelText(/Дата события/), '2026-07-24');
    await user.selectOptions(screen.getByLabelText(/Клуб/), 'goldfish_msk');
    await user.selectOptions(screen.getByLabelText(/Формат/), 'pauper');
    await user.type(
      screen.getByLabelText(/Ссылка на Aetherhub/),
      'https://aetherhub.com/Tourney/RoundTourney/100523',
    );
    await user.type(
      screen.getByLabelText(/Список игроков и колод/),
      'Колошко Александр - Lands',
    );
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Не удалось добавить событие',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Список игроков и колод:')).toHaveLength(2);
    expect(screen.getByText('Раунды и результаты:')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Игрок "Колошко Александр" из списка колод отсутствует в стендингах.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Некорректный счёт матча в раунде 5, столе 11.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Имя "Панферов Александр" сопоставлено с "Панфёров Александр".',
      ),
    ).toBeInTheDocument();
  });
});
