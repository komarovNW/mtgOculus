import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createTournament } from '@/entities/admin-tournament/api';
import { dictionaryQueries } from '@/entities/dictionaries/queries';
import { leagueQueries } from '@/entities/league/queries';
import { AppError } from '@/shared/api/client';
import type {
  CreateTournamentPayload,
  ImportFeedbackItem,
  TournamentImportSource,
  TournamentType,
} from '@/shared/api/types';
import { buildDashboardFilterSearch } from '@/shared/lib/filters';
import { formatDate } from '@/shared/lib/formatDate';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { analyzePlayerDecksInput } from '@/shared/lib/playerDecksInput';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

type FormState = CreateTournamentPayload;

const playoffStages = [
  { topN: 8, title: 'Четвертьфиналы', matchTitle: 'Четвертьфинал', maxMatches: 4 },
  { topN: 4, title: 'Полуфиналы', matchTitle: 'Полуфинал', maxMatches: 2 },
  { topN: 2, title: 'Финал', matchTitle: 'Финал', maxMatches: 1 },
] as const;

function getCalendarDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

function createInitialState(): FormState {
  return {
    date: getCalendarDate(new Date()),
    cityId: 'moscow',
    clubId: '',
    tournamentType: 'daily',
    tournamentImportSource: 'standard',
    formatId: '',
    leagueId: '',
    leagueQualifierId: '',
    aetherhubUrl: '',
    meleeUrl: '',
    playerDecksText: '',
    includeInMatchupMatrix: true,
  };
}

const aetherhubClubLinks = [
  {
    city: 'Москва',
    club: 'Единорог',
    href: 'https://aetherhub.com/User/Edinorog',
  },
  {
    city: 'Москва',
    club: 'Голдфиш',
    href: 'https://aetherhub.com/User/goldfish',
  },
  {
    city: 'Санкт-Петербург',
    club: 'Pair of Dice',
    href: 'https://aetherhub.com/User/Andysays',
  },
  {
    city: 'Москва',
    club: 'Портал',
    href: 'https://aetherhub.com/User/PhillipRus',
  },
];

const importSourceLabels: Record<string, string> = {
  aetherhubUrl: 'Ссылка Aetherhub',
  meleeUrl: 'Ссылка Melee.gg',
  allRoundsFile: 'Раунды и результаты',
  date: 'Дата события',
  playerDecksText: 'Список игроков и колод',
  standingsFile: 'Стендинги',
  finalStandingsFile: 'Стендинги',
  playoffMatches: 'Плей-офф',
  noPlayoff: 'Без плей-офф',
  decksOrder: 'Порядок колод',
  leagueQualifierId: 'Отборочный турнир',
};

function ImportFeedbackList({
  items,
  title,
  tone,
}: {
  items: ImportFeedbackItem[];
  title: string;
  tone: 'error' | 'warning';
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={`import-feedback import-feedback--${tone}`}>
      <h3 className="import-feedback__title">{title}</h3>
      <ul className="flat-list import-feedback__list">
        {items.map((item, index) => (
          <li key={`${item.code}-${item.source ?? 'general'}-${index}`}>
            {item.source ? (
              <strong className="import-feedback__source">
                {importSourceLabels[item.source] ?? 'Данные события'}:
              </strong>
            ) : null}{' '}
            {item.message}
          </li>
        ))}
      </ul>
    </section>
  );
}

function isAetherhubTournamentUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      (hostname === 'aetherhub.com' ||
        hostname === 'www.aetherhub.com') &&
      url.pathname.toLowerCase().includes('/tourney/')
    );
  } catch {
    return false;
  }
}

function isMeleeTournamentReference(value: string) {
  if (/^\d+$/.test(value)) return true;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      (hostname === 'melee.gg' || hostname === 'www.melee.gg') &&
      /^\/tournament\/view\/\d+\/?$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function CreateTournamentPage() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FormState>(createInitialState);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const citiesQuery = useQuery(dictionaryQueries.cities());
  const formatsQuery = useQuery(dictionaryQueries.formats());
  const clubsQuery = useQuery(dictionaryQueries.clubs(formState.cityId));
  const leagueOptionsQuery = useQuery({
    ...leagueQueries.options({
      cityId: formState.cityId || undefined,
      clubId: formState.clubId || undefined,
      formatId: formState.formatId || undefined,
      date: formState.date || undefined,
    }),
    enabled: Boolean(
      formState.cityId && formState.clubId && formState.formatId && formState.date,
    ),
  });
  const leagueQualifierOptionsQuery = useQuery({
    ...leagueQueries.qualifierOptions(formState.leagueId ?? ''),
    enabled:
      formState.tournamentType === 'tournament' && Boolean(formState.leagueId),
  });
  const importMutation = useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'dictionaries',
      });
    },
  });
  const importError =
    importMutation.error instanceof AppError ? importMutation.error : null;

  const inputAnalysis = analyzePlayerDecksInput(formState.playerDecksText);
  const isMeleeImport =
    formState.tournamentType === 'tournament' &&
    formState.tournamentImportSource === 'melee';
  const playerDeckLinesCount = formState.playerDecksText
    .split('\n')
    .filter((line) => line.trim()).length;
  const selectedCity = citiesQuery.data?.items.find(
    (item) => item.id === formState.cityId,
  );
  const selectedClub = clubsQuery.data?.items.find(
    (item) => item.id === formState.clubId,
  );
  const selectedFormat = formatsQuery.data?.items.find(
    (item) => item.id === formState.formatId,
  );
  const selectedLeague = leagueOptionsQuery.data?.find(
    (item) => item.id === formState.leagueId,
  );
  const selectedLeagueQualifier = leagueQualifierOptionsQuery.data?.find(
    (item) => item.id === formState.leagueQualifierId,
  );
  const eventFilterSearch = buildDashboardFilterSearch({
    cityId: formState.cityId,
    clubId: formState.clubId,
    formatId: formState.formatId,
    tournamentType: formState.tournamentType,
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
    setValidationErrors([]);

    if (!importMutation.isIdle) {
      importMutation.reset();
    }
  }

  function addPlayoffMatch(topN: number) {
    const matches = [
      ...(formState.playoffMatches ?? []),
      { topN, playerA: '', playerB: '', playerAWins: 2, playerBWins: 0 },
    ].sort((a, b) => b.topN - a.topN);

    setField('playoffMatches', matches);
  }

  function updatePlayoffMatch(
    index: number,
    patch: Partial<NonNullable<FormState['playoffMatches']>[number]>,
  ) {
    setField(
      'playoffMatches',
      formState.playoffMatches?.map((match, matchIndex) =>
        matchIndex === index ? { ...match, ...patch } : match),
    );
  }

  useEffect(() => {
    const clubs = clubsQuery.data?.items ?? [];

    if (!formState.cityId || clubs.length !== 1 || formState.clubId === clubs[0].id) {
      return;
    }

    setFormState((current) => ({ ...current, clubId: clubs[0].id }));
  }, [clubsQuery.data?.items, formState.cityId, formState.clubId]);

  useEffect(() => {
    setFormState((current) => current.leagueId || current.leagueQualifierId
      ? { ...current, leagueId: '', leagueQualifierId: '' }
      : current);
  }, [
    formState.cityId,
    formState.clubId,
    formState.date,
    formState.formatId,
    formState.tournamentType,
  ]);

  function validate() {
    const errors: string[] = [];

    if (!formState.date) errors.push('Выберите дату.');
    if (!formState.cityId) errors.push('Выберите город.');
    if (!formState.clubId) errors.push('Выберите клуб.');
    if (!formState.formatId) errors.push('Выберите формат.');
    if (isMeleeImport) {
      if (!formState.meleeUrl?.trim()) {
        errors.push('Добавьте ссылку на турнир Melee.gg или его номер.');
      } else if (!isMeleeTournamentReference(formState.meleeUrl.trim())) {
        errors.push('Укажите ссылку вида melee.gg/Tournament/View/123 или номер турнира.');
      }
    } else {
      if (!formState.aetherhubUrl.trim() && !(formState.finalStandingsFile && formState.allRoundsFile)) {
        errors.push('Добавьте ссылку на Aetherhub или оба файла: стендинги и раунды.');
      } else if (formState.aetherhubUrl.trim() && !isAetherhubTournamentUrl(formState.aetherhubUrl.trim())) {
        errors.push(
          'Укажите полную ссылку на событие в разделе Tourney на Aetherhub.',
        );
      }
    }
    if (!formState.playerDecksText.trim()) {
      errors.push('Добавьте список игроков и колод.');
    } else {
      errors.push(...inputAnalysis.errors);
    }

    if (isMeleeImport && inputAnalysis.mode === 'ordered' && !formState.decksOrder) {
      errors.push('Выберите порядок колод.');
    }

    if (formState.tournamentType === 'tournament' && !isMeleeImport && !formState.noPlayoff) {
      if (!formState.playoffMatches?.length) errors.push('Добавьте матчи плей-офф или выберите турнир без плей-офф.');
      if (formState.playoffMatches?.some((match) => !match.playerA.trim() || !match.playerB.trim() || match.playerA.trim() === match.playerB.trim() || !Number.isInteger(match.playerAWins) || !Number.isInteger(match.playerBWins) || match.playerAWins < 0 || match.playerBWins < 0 || match.playerAWins === match.playerBWins || !Number.isInteger(match.draws ?? 0) || (match.draws ?? 0) < 0)) {
        errors.push('Для каждого матча топа укажите двух разных игроков и счёт с победителем.');
      }
      if (inputAnalysis.mode === 'ordered' && !formState.decksOrder) errors.push('Выберите порядок колод.');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    importMutation.mutate({
      ...formState,
      aetherhubUrl: formState.aetherhubUrl.trim(),
      meleeUrl: formState.meleeUrl?.trim(),
      playerDecksText: formState.playerDecksText.trim(),
    });
  }

  function retryImport() {
    importMutation.mutate({
      ...formState,
      aetherhubUrl: formState.aetherhubUrl.trim(),
      meleeUrl: formState.meleeUrl?.trim(),
      playerDecksText: formState.playerDecksText.trim(),
    });
  }

  function resetForm() {
    setFormState((current) => ({
      ...current,
      aetherhubUrl: '',
      meleeUrl: '',
      playerDecksText: '',
      leagueQualifierId: '',
      playoffMatches: [],
      noPlayoff: false,
      decksOrder: undefined,
      finalStandingsFile: undefined,
      allRoundsFile: undefined,
    }));
    formRef.current?.reset();
    setValidationErrors([]);
    importMutation.reset();
    formRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
  }

  if (citiesQuery.isLoading || formatsQuery.isLoading) {
    return <LoadingState description="Загружаем данные для формы." />;
  }

  if (citiesQuery.isError || formatsQuery.isError) {
    return (
      <ErrorState
        description={getErrorMessage(
          citiesQuery.error ?? formatsQuery.error,
          'Не получилось загрузить данные для формы.',
        )}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge
            key="access"
            variant="accent"
          >
            Доступно всем
          </Badge>,
          <Badge key="method">Aetherhub, файлы и Melee.gg</Badge>,
        ]}
        description="Добавьте событие из Aetherhub, файлов или Melee.gg и укажите колоды участников."
        eyebrow="Импорт события"
        title="Добавить"
      />

      <Card
        className="create-tournament-guide"
        tone="muted"
      >
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Как добавить событие</h2>
            <p className="section-header__description">
              Нужны данные события, источник результатов и список колод.
            </p>
          </div>
        </div>
        <ol className="flat-list">
          <li>
            <strong>Заполните данные события.</strong> Укажите дату, площадку, тип,
            формат и источник результатов. Melee.gg загрузит швейцарку и плей-офф автоматически.
          </li>
          <li>
            <strong>Добавьте колоды.</strong> Вставьте список с именами игроков или
            перечислите колоды по порядку мест. Для турнира с топом выберите итоговый порядок или порядок швейцарки.
          </li>
          <li>
            <strong>Добавьте и проверьте.</strong> После сохранения откройте событие
            и проверьте участников и колоды.
          </li>
        </ol>
      </Card>

      <Card>
        <form
          className="form-grid"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <div className="form-grid__full form-section">
            <h2 className="form-section__title">1. О событии</h2>
            <p className="form-section__description">
              Укажите основные данные и ссылку на страницу события.
            </p>
          </div>
          <Input
            label="Дата события"
            onChange={(event) => setField('date', event.target.value)}
            required
            type="date"
            value={formState.date}
          />
          <Select
            label="Город"
            onChange={(event) => {
              setField('cityId', event.target.value);
              setField('clubId', '');
            }}
            options={(citiesQuery.data?.items ?? []).map((city) => ({
              value: city.id,
              label: city.name,
            }))}
            required
            value={formState.cityId}
          />
          <div className="field-stack">
            <Select
              disabled={
                clubsQuery.isLoading ||
                clubsQuery.isError ||
                !formState.cityId
              }
              label="Клуб"
              onChange={(event) => setField('clubId', event.target.value)}
              options={[
                {
                  value: '',
                  label: clubsQuery.isLoading
                    ? 'Загружаем клубы…'
                    : clubsQuery.isError
                      ? 'Не удалось загрузить клубы'
                      : 'Выберите клуб',
                },
                ...(clubsQuery.data?.items ?? []).map((club) => ({
                  value: club.id,
                  label: club.name,
                })),
              ]}
              required
              value={formState.clubId}
            />
            {clubsQuery.isError ? (
              <div
                className="field-message field-message--error"
                role="alert"
              >
                <span>Не получилось загрузить клубы выбранного города.</span>
                <Button
                  onClick={() => {
                    void clubsQuery.refetch();
                  }}
                  type="button"
                  variant="ghost"
                >
                  Повторить
                </Button>
              </div>
            ) : null}
          </div>
          <Select
            label="Тип события"
            onChange={(event) =>
              setField('tournamentType', event.target.value as TournamentType)
            }
            options={[
              { value: 'daily', label: 'Дейлик' },
              { value: 'tournament', label: 'Турнир' },
            ]}
            required
            value={formState.tournamentType}
          />
          <Select
            label="Формат"
            onChange={(event) => setField('formatId', event.target.value)}
            options={[
              { value: '', label: 'Выберите формат' },
              ...(formatsQuery.data?.items ?? []).map((format) => ({
                value: format.id,
                label: format.name,
              })),
            ]}
            required
            value={formState.formatId}
          />
          <div className="field-stack">
              <Select
                disabled={
                  !formState.date ||
                  !formState.cityId ||
                  !formState.clubId ||
                  !formState.formatId ||
                  leagueOptionsQuery.isLoading ||
                  leagueOptionsQuery.isError
                }
                label={formState.tournamentType === 'daily' ? 'Лига' : 'Лига отбора'}
                onChange={(event) => {
                  setField('leagueId', event.target.value);
                  setField('leagueQualifierId', '');
                }}
                options={[
                  {
                    value: '',
                    label: !formState.date
                      ? 'Сначала выберите дату'
                      : leagueOptionsQuery.isLoading
                        ? 'Загружаем лиги…'
                        : leagueOptionsQuery.isError
                          ? 'Не удалось загрузить лиги'
                          : leagueOptionsQuery.data?.length
                            ? formState.tournamentType === 'daily'
                              ? 'Без лиги'
                              : 'Не связывать с отбором'
                            : 'Нет подходящих лиг',
                  },
                  ...(leagueOptionsQuery.data ?? []).map((league) => ({
                    value: league.id,
                    label: `${league.name} · ${formatDate(league.dateStart)}–${formatDate(league.dateEnd)}`,
                  })),
                ]}
                value={formState.leagueId ?? ''}
              />
              {leagueOptionsQuery.isError ? (
                <div className="field-message field-message--error" role="alert">
                  <span>Не получилось загрузить подходящие лиги.</span>
                  <Button
                    onClick={() => {
                      void leagueOptionsQuery.refetch();
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Повторить
                  </Button>
                </div>
              ) : null}
            </div>
          {formState.tournamentType === 'tournament' ? (
            <div className="field-stack">
              <Select
                disabled={
                  !formState.leagueId ||
                  leagueQualifierOptionsQuery.isLoading ||
                  leagueQualifierOptionsQuery.isError
                }
                helperText="Необязательно. Связывает турнир со строкой плана отбора лиги."
                label="Отборочный турнир"
                onChange={(event) => setField('leagueQualifierId', event.target.value)}
                options={[
                  {
                    value: '',
                    label: !formState.leagueId
                      ? 'Сначала выберите лигу'
                      : leagueQualifierOptionsQuery.isLoading
                        ? 'Загружаем отборочные…'
                        : leagueQualifierOptionsQuery.isError
                          ? 'Не удалось загрузить отборочные'
                          : leagueQualifierOptionsQuery.data?.length
                            ? 'Не связывать с отбором'
                            : 'Нет свободных отборочных',
                  },
                  ...(leagueQualifierOptionsQuery.data ?? []).map((qualifier) => ({
                    value: qualifier.id,
                    label: `${qualifier.title ?? 'Отборочный турнир'} · ${
                      qualifier.date ? formatDate(qualifier.date) : 'дата не задана'
                    } · мест: ${qualifier.slots}`,
                  })),
                ]}
                value={formState.leagueQualifierId ?? ''}
              />
              {leagueQualifierOptionsQuery.isError ? (
                <div className="field-message field-message--error" role="alert">
                  <span>Не получилось загрузить свободные отборочные.</span>
                  <Button
                    onClick={() => {
                      void leagueQualifierOptionsQuery.refetch();
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Повторить
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div aria-hidden="true" className="form-grid__spacer" />
          )}
          <div className="form-grid__full directory-help">
            Не нашли нужный город, клуб или формат?{' '}
            <a
              href="https://t.me/komarovNV"
              rel="noreferrer"
              target="_blank"
            >
              Напишите @komarovNV в Telegram
            </a>
            , и мы добавим недостающее значение в список.
          </div>
          {formState.tournamentType === 'tournament' ? (
            <div className="form-grid__full">
              <Select
                label="Источник результатов"
                onChange={(event) => setField(
                  'tournamentImportSource',
                  event.target.value as TournamentImportSource,
                )}
                options={[
                  { value: 'standard', label: 'Aetherhub или файлы' },
                  { value: 'melee', label: 'Melee.gg' },
                ]}
                value={formState.tournamentImportSource ?? 'standard'}
              />
            </div>
          ) : null}

          {isMeleeImport ? (
            <div className="form-grid__full">
              <Input
                helperText="Вставьте полную ссылку или только номер завершённого турнира. Загрузка может занять до 40 секунд."
                label="Ссылка или номер турнира Melee.gg"
                onChange={(event) => setField('meleeUrl', event.target.value)}
                placeholder="https://melee.gg/Tournament/View/12345"
                required
                type="text"
                value={formState.meleeUrl ?? ''}
              />
              <div className="input-numbering-note">
                <strong>Турнир должен быть завершён на Melee.gg.</strong>{' '}
                Пока событие идёт или результаты не опубликованы, импорт вернёт ошибку.
              </div>
            </div>
          ) : (
            <>
              <div className="form-grid__full">
                <Input
                  helperText="Вставьте ссылку на событие или загрузите оба файла ниже."
                  label="Ссылка на Aetherhub"
                  onChange={(event) => setField('aetherhubUrl', event.target.value)}
                  placeholder="https://aetherhub.com/Tourney/RoundTourney/100523"
                  type="url"
                  value={formState.aetherhubUrl}
                />
                <div className="aetherhub-club-directory">
                  <div>
                    <h3 className="aetherhub-club-directory__title">
                      Где найти событие на Aetherhub
                    </h3>
                    <p className="aetherhub-club-directory__description">
                      Откройте страницу нужного клуба, найдите своё событие и вставьте
                      ссылку на него в поле выше.
                    </p>
                  </div>
                  <div className="aetherhub-club-directory__grid">
                    {aetherhubClubLinks.map((item) => (
                      <a
                        className="aetherhub-club-link"
                        href={item.href}
                        key={item.club}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <strong>{item.club}</strong>
                        <span>{item.city} · открыть Aetherhub ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <Input label="Файл итоговых стендингов" type="file" onChange={(event) => setField('finalStandingsFile', event.target.files?.[0])} />
              <Input label="Файл всех раундов" type="file" onChange={(event) => setField('allRoundsFile', event.target.files?.[0])} />
              <label className="form-grid__full">
                <input type="checkbox" checked={formState.includeInMatchupMatrix ?? true} onChange={(event) => setField('includeInMatchupMatrix', event.target.checked)} /> Учитывать в матрице матчапов
              </label>
            </>
          )}
          {formState.tournamentType === 'tournament' && !isMeleeImport ? (
            <section className="form-grid__full form-section">
              <h2 className="form-section__title">Плей-офф</h2>
              <label><input type="checkbox" checked={formState.noPlayoff ?? false} onChange={(event) => setField('noPlayoff', event.target.checked)} /> Турнир без плей-офф</label>
              {!formState.noPlayoff ? <div className="playoff-editor">
                <div className="playoff-editor__intro">
                  <strong>Соберите сетку по стадиям</strong>
                  <span>Имена должны совпадать со стендингами. Порядок матчей сверху вниз задаёт пары следующей стадии.</span>
                </div>
                <div className="playoff-editor__actions">
                  {playoffStages.map((stage) => {
                    const matchesCount = (formState.playoffMatches ?? [])
                      .filter((match) => match.topN === stage.topN).length;

                    return (
                      <Button
                        disabled={matchesCount >= stage.maxMatches}
                        key={stage.topN}
                        onClick={() => addPlayoffMatch(stage.topN)}
                        type="button"
                        variant="secondary"
                      >
                        + {stage.matchTitle} · {matchesCount}/{stage.maxMatches}
                      </Button>
                    );
                  })}
                </div>
                {(formState.playoffMatches ?? []).length === 0 ? (
                  <div className="playoff-editor__empty">
                    Для топ-4 добавьте два полуфинала и финал. Для топ-8 — четыре четвертьфинала, два полуфинала и финал.
                  </div>
                ) : null}
                <div className="playoff-editor__stages">
                  {playoffStages.map((stage) => {
                    const stageMatches = (formState.playoffMatches ?? [])
                      .map((match, index) => ({ match, index }))
                      .filter(({ match }) => match.topN === stage.topN);

                    if (stageMatches.length === 0) return null;

                    return (
                      <section className="playoff-stage-editor" key={stage.topN}>
                        <div className="playoff-stage-editor__header">
                          <h3>{stage.title}</h3>
                          <span>{stageMatches.length} из {stage.maxMatches}</span>
                        </div>
                        <div className="playoff-stage-editor__matches">
                          {stageMatches.map(({ match, index }, stageIndex) => {
                            const matchLabel = `${stage.matchTitle} ${stageIndex + 1}`;

                            return (
                              <article className="playoff-match-editor" key={`${stage.topN}-${index}`}>
                                <div className="playoff-match-editor__header">
                                  <strong>{matchLabel}</strong>
                                  <Button
                                    onClick={() => setField('playoffMatches', formState.playoffMatches?.filter((_, matchIndex) => matchIndex !== index))}
                                    type="button"
                                    variant="ghost"
                                  >
                                    Удалить
                                  </Button>
                                </div>
                                <div className="playoff-match-editor__players">
                                  <div className="playoff-match-editor__competitor">
                                    <Input
                                      label={`Игрок A · ${matchLabel}`}
                                      onChange={(event) => updatePlayoffMatch(index, { playerA: event.target.value })}
                                      required
                                      type="text"
                                      value={match.playerA}
                                    />
                                    <Input
                                      id={`player-a-wins-${stage.topN}-${stageIndex}`}
                                      label="Победы"
                                      min={0}
                                      onChange={(event) => updatePlayoffMatch(index, { playerAWins: Number(event.target.value) })}
                                      required
                                      step={1}
                                      type="number"
                                      value={match.playerAWins}
                                    />
                                  </div>
                                  <span className="playoff-match-editor__versus">против</span>
                                  <div className="playoff-match-editor__competitor playoff-match-editor__competitor--reverse">
                                    <Input
                                      id={`player-b-wins-${stage.topN}-${stageIndex}`}
                                      label="Победы"
                                      min={0}
                                      onChange={(event) => updatePlayoffMatch(index, { playerBWins: Number(event.target.value) })}
                                      required
                                      step={1}
                                      type="number"
                                      value={match.playerBWins}
                                    />
                                    <Input
                                      label={`Игрок B · ${matchLabel}`}
                                      onChange={(event) => updatePlayoffMatch(index, { playerB: event.target.value })}
                                      required
                                      type="text"
                                      value={match.playerB}
                                    />
                                  </div>
                                </div>
                                <div className="playoff-match-editor__draws">
                                  <Input
                                    helperText="Обычно 0"
                                    label={`Ничьи · ${matchLabel}`}
                                    min={0}
                                    onChange={(event) => updatePlayoffMatch(index, { draws: Number(event.target.value) })}
                                    step={1}
                                    type="number"
                                    value={match.draws ?? 0}
                                  />
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
                {inputAnalysis.mode === 'ordered' ? (
                  <Select
                    helperText="Итоговые места учитывают плей-офф. Места швейцарки — положение игроков до начала топа."
                    label="Порядок колод"
                    value={formState.decksOrder ?? ''}
                    options={[{ value: '', label: 'Выберите порядок' }, { value: 'final', label: 'По итоговым местам' }, { value: 'swiss', label: 'По местам швейцарки' }]}
                    onChange={(event) => setField('decksOrder', event.target.value as FormState['decksOrder'])}
                  />
                ) : null}
              </div> : null}
            </section>
          ) : null}

          <div className="form-grid__full form-section">
            <h2 className="form-section__title">2. Игроки и колоды</h2>
            <p className="form-section__description">
              Одна строка соответствует одной колоде. Способ привязки определится
              автоматически.
            </p>
          </div>
          <details className="form-grid__full input-format-guide">
            <summary>
              <span>
                <strong>Как подготовить список игроков и колод</strong>
                <small>Два способа ввода и примеры</small>
              </span>
              <span
                aria-hidden="true"
                className="input-format-guide__action"
              />
            </summary>
            <div className="input-format-guide__body">
              <div>
                <h3 className="input-format-guide__title">
                  Поддерживаемые форматы ввода
                </h3>
                <p className="input-format-guide__description">
                  Выберите один способ и используйте его для всего списка.
                </p>
              </div>

              <div className="input-mode-grid">
                <section className="input-mode-card">
                  <h4>1. С именами игроков</h4>
                  <code className="input-mode-format">
                    Имя игрока - Название колоды
                  </code>
                  <p>
                    Отделяйте имя от колоды дефисом с пробелами. Порядок строк не
                    важен: колода будет привязана по имени игрока.
                  </p>
                  <strong>Корректный пример</strong>
                  <pre>{'Игрок 1 - Lands\nИгрок 2 - UW Phelia\nИгрок 3 - Grixis Reanimator'}</pre>
                  <p>
                    Небольшое отличие в имени будет отмечено для проверки. Повторы и
                    пустые названия нужно исправить до добавления.
                  </p>
                </section>

                <section className="input-mode-card">
                  <h4>2. Только колоды — по порядку мест</h4>
                  <code className="input-mode-format">Название колоды</code>
                  <p>
                    Первая строка относится к игроку на первом месте, вторая — ко
                    второму и так далее.
                  </p>
                  <strong>Корректный пример</strong>
                  <pre>{'Lands\nUW Phelia\nGrixis Reanimator'}</pre>
                  <p>
                    Число строк должно совпадать с числом игроков. После добавления
                    обязательно проверьте привязку колод.
                  </p>
                </section>
              </div>

              <div className="input-numbering-note">
                <strong>Нумерация необязательна.</strong> Можно начинать строки с{' '}
                <code>1.</code> или <code>1)</code>, но тогда номера должны идти строго
                подряд: 1, 2, 3 … N. Не используйте пропуски, повторы или перестановки.
              </div>

              <div className="input-separator-warning">
                <strong>
                  Если в строке указано имя, между именем игрока и колодой обязательно
                  должен стоять дефис.
                </strong>
                <p>Без дефиса вся строка будет воспринята как название колоды.</p>
                <p>
                  <strong>Нельзя:</strong>{' '}
                  <code>Игрок 1 White Weenie</code>
                </p>
                <p>
                  <strong>Правильно:</strong>{' '}
                  <code>Игрок 1 - White Weenie</code>
                </p>
              </div>

              <div>
                <h4 className="input-format-guide__subtitle">Так добавлять нельзя</h4>
                <ul className="flat-list">
                  <li>
                    <strong>
                      Используйте одно и то же название для одинаковых колод.
                    </strong>{' '}
                    Не смешивайте варианты «Grixis Reanimator», «Grixis Rean» и
                    «Гриксис Реаниматор»: статистика может посчитать их разными
                    колодами.
                  </li>
                  <li>
                    Не добавляйте заголовок таблицы, пояснения или посторонние строки.
                  </li>
                  <li>
                    Не смешивайте строки «Игрок - Колода» со списком только из
                    названий колод.
                  </li>
                  <li>
                    В режиме с именами не оставляйте имя игрока или название колоды
                    пустыми.
                  </li>
                  <li>
                    Не указывайте одного игрока несколько раз и не объединяйте
                    нескольких игроков в одной строке.
                  </li>
                  <li>
                    В режиме по местам используйте выбранный порядок: итоговые места
                    или места швейцарки для турнира с плей-офф.
                  </li>
                  <li>
                    Пустые строки между участниками можно оставлять — они будут
                    пропущены.
                  </li>
                </ul>
              </div>
            </div>
          </details>
          <div className="form-grid__full">
            <Textarea
              helperText={isMeleeImport
                ? 'Имена должны совпадать с Melee.gg. Можно перечислить только колоды по порядку мест.'
                : 'Одна строка соответствует одной колоде. Ниже появится выбранный способ привязки.'}
              label="Список игроков и колод"
              onChange={(event) => setField('playerDecksText', event.target.value)}
              placeholder={'Игрок 1 - Lands\nИгрок 2 - UW Phelia\nИгрок 3 - Grixis Reanimator'}
              rows={10}
              required
              value={formState.playerDecksText}
            />
          </div>
          {isMeleeImport && inputAnalysis.mode === 'ordered' ? (
            <div className="form-grid__full">
              <Select
                helperText="Итоговые места учитывают плей-офф. Места швейцарки — положение игроков до начала топа. Если топа нет, оба порядка совпадают."
                label="Порядок колод"
                onChange={(event) => setField(
                  'decksOrder',
                  event.target.value as FormState['decksOrder'],
                )}
                options={[
                  { value: '', label: 'Выберите порядок' },
                  { value: 'final', label: 'По итоговым местам' },
                  { value: 'swiss', label: 'По местам швейцарки' },
                ]}
                value={formState.decksOrder ?? ''}
              />
            </div>
          ) : null}
          {formState.playerDecksText.trim() ? (
            <div
              className={`form-grid__full input-mode-status ${
                inputAnalysis.errors.length
                  ? 'input-mode-status--error'
                  : inputAnalysis.warnings.length
                    ? 'input-mode-status--warning'
                    : 'input-mode-status--success'
              }`}
            >
              <strong>
                Определён режим:{' '}
                {inputAnalysis.mode === 'named'
                  ? 'с именами игроков'
                  : 'колоды по порядку мест'}{' '}
                · строк: {playerDeckLinesCount}
              </strong>
              {inputAnalysis.errors.length ? (
                <ul className="flat-list">
                  {inputAnalysis.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
              {!inputAnalysis.errors.length &&
              inputAnalysis.warnings.length ? (
                <ul className="flat-list">
                  {inputAnalysis.warnings.map((warning) => (
                    <li key={warning}>{formState.tournamentType === 'tournament' && (isMeleeImport || !formState.noPlayoff) && inputAnalysis.mode === 'ordered' ? 'Колоды будут сопоставлены по выбранному порядку мест. После добавления проверьте привязку.' : warning}</li>
                  ))}
                </ul>
              ) : null}
              {!inputAnalysis.errors.length &&
              !inputAnalysis.warnings.length ? (
                <span>Список выглядит корректно.</span>
              ) : null}
            </div>
          ) : null}

          <div className="form-grid__full form-section">
            <h2 className="form-section__title">3. Проверка и отправка</h2>
            <p className="form-section__description">
              Проверьте данные и число строк. После добавления откройте событие и
              сверьте колоды участников.
            </p>
          </div>

          {validationErrors.length ? (
            <div
              className="form-grid__full form-validation-summary"
              role="alert"
            >
              <strong>Перед добавлением исправьте:</strong>
              <ul className="flat-list">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="form-grid__full import-summary">
            <strong>Перед отправкой</strong>
            <span>
              {formState.tournamentType === 'daily'
                ? 'Дейлик'
                : isMeleeImport
                  ? 'Турнир из Melee.gg'
                  : 'Турнир'}{' '}
              ·{' '}
              {formState.date
                ? formatDate(formState.date)
                : 'дата не выбрана'}{' '}
              ·{' '}
              {selectedCity?.name ?? 'город не выбран'} ·{' '}
              {selectedClub?.name ?? 'клуб не выбран'} ·{' '}
              {selectedFormat?.name ?? 'формат не выбран'} ·{' '}
              {formState.tournamentType === 'daily'
                ? `${selectedLeague?.name ?? 'без лиги'} · `
                : selectedLeagueQualifier
                  ? `${selectedLeagueQualifier.title ?? 'отборочный турнир'} · `
                  : ''}
              {playerDeckLinesCount}{' '}
              {playerDeckLinesCount === 1 ? 'строка' : 'строк'}
            </span>
          </div>

          <div className="form-grid__full form-actions">
            <Button
              disabled={
                importMutation.isPending ||
                clubsQuery.isLoading ||
                clubsQuery.isError
              }
              type="submit"
            >
              {importMutation.isPending
                ? isMeleeImport
                  ? 'Загружаем с Melee.gg…'
                  : 'Добавляем...'
                : 'Добавить'}
            </Button>
          </div>
        </form>
      </Card>

      {importMutation.isError ? (
        <Card
          className="state-card state-card--error"
          role="alert"
        >
          <h2 className="state-card__title">Не удалось добавить событие</h2>
          <p className="state-card__description">
            {importError?.details.length
              ? 'Импорт остановлен. Исправьте перечисленные ошибки и отправьте форму ещё раз.'
              : getErrorMessage(
                  importMutation.error,
                  'Не удалось добавить событие. Проверьте данные и попробуйте ещё раз.',
                )}
          </p>
          <ImportFeedbackList
            items={importError?.details ?? []}
            title="Что нужно исправить"
            tone="error"
          />
          <ImportFeedbackList
            items={importError?.warnings ?? []}
            title="Дополнительные предупреждения"
            tone="warning"
          />
          {importError?.code === 'MELEE_UNSUPPORTED_TOURNAMENT' ||
          importError?.details.some((item) => item.code === 'MELEE_UNSUPPORTED_TOURNAMENT') ? (
            <div className="directory-help">
              Такой тип турнира нельзя загрузить автоматически с Melee.gg. Переключитесь
              на обычный импорт и добавьте результаты через Aetherhub или файлы.
            </div>
          ) : null}
          <div className="state-card__actions">
            {importError?.code === 'MELEE_UNSUPPORTED_TOURNAMENT' ||
            importError?.details.some((item) => item.code === 'MELEE_UNSUPPORTED_TOURNAMENT') ? (
              <Button
                onClick={() => {
                  setField('tournamentImportSource', 'standard');
                  formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                }}
                variant="primary"
              >
                Перейти к обычному импорту
              </Button>
            ) : null}
            <Button
              onClick={retryImport}
              variant="secondary"
            >
              Попробовать ещё раз
            </Button>
          </div>
        </Card>
      ) : null}

      {importMutation.isSuccess ? (
        <Card tone="success">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Событие добавлено</h2>
              <p className="section-header__description">{importMutation.data.message}</p>
            </div>
          </div>
          {importMutation.data.warnings?.length ? (
            <ImportFeedbackList
              items={importMutation.data.warnings}
              title="Событие добавлено, но обратите внимание"
              tone="warning"
            />
          ) : null}
          <div className="form-actions">
            <Link
              className="button button--primary section-link"
              to={{
                pathname: `/tournaments/${importMutation.data.tournamentId}`,
                search: eventFilterSearch,
              }}
            >
              Открыть событие
            </Link>
            <Link
              className="button button--ghost section-link"
              to={{
                pathname:
                  formState.tournamentType === 'daily'
                    ? '/dailies'
                    : '/tournaments',
                search: eventFilterSearch,
              }}
            >
              К списку
            </Link>
            <Button
              onClick={resetForm}
              type="button"
              variant="ghost"
            >
              Добавить ещё
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
