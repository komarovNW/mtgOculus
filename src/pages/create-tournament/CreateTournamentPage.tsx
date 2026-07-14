import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTournament } from '@/entities/admin-tournament/api';
import { getCities, getClubs, getFormats } from '@/entities/dictionaries/api';
import { AppError } from '@/shared/api/client';
import type { ApiErrorDetail, CreateTournamentPayload, TournamentType } from '@/shared/api/types';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { analyzePlayerDecksInput } from '@/shared/lib/playerDecksInput';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import { Input } from '@/shared/ui/Input';

type FormState = {
  date: string;
  cityId: string;
  clubId: string;
  tournamentType: TournamentType;
  formatId: string;
  aetherhubUrl: string;
  playerDecksText: string;
};

const initialState: FormState = {
  date: '',
  cityId: 'moscow',
  clubId: '',
  tournamentType: 'daily',
  formatId: 'legacy',
  aetherhubUrl: '',
  playerDecksText: '',
};

const importSourceLabels: Record<string, string> = {
  playerDecksText: 'Список игроков и колод',
  aetherhubUrl: 'Ссылка на Aetherhub',
  metadata: 'Данные турнира',
  body: 'Форма',
  cityId: 'Город',
  clubId: 'Клуб',
  date: 'Дата турнира',
  tournamentType: 'Тип турнира',
  formatId: 'Формат',
};

function formatImportIssue(detail: ApiErrorDetail) {
  const sourceLabel = detail.source ? importSourceLabels[detail.source] : undefined;
  const fieldLabel = detail.field ? importSourceLabels[detail.field] : undefined;
  const label = sourceLabel ?? fieldLabel;

  return label ? `${label}: ${detail.message}` : detail.message;
}

function dedupeIssueMessages(items: string[]) {
  return [...new Set(items)];
}

function getImportErrorDetails(error: unknown) {
  if (!(error instanceof AppError) || !error.details?.length) {
    return [];
  }

  return dedupeIssueMessages(error.details.map(formatImportIssue));
}

function getImportWarningDetails(error: unknown) {
  if (!(error instanceof AppError) || !error.warnings?.length) {
    return [];
  }

  return dedupeIssueMessages(error.warnings.map(formatImportIssue));
}

export function CreateTournamentPage() {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const citiesQuery = useQuery({
    queryKey: ['admin', 'cities'],
    queryFn: getCities,
  });
  const formatsQuery = useQuery({
    queryKey: ['admin', 'formats'],
    queryFn: getFormats,
  });
  const clubsQuery = useQuery({
    queryKey: ['admin', 'clubs', formState.cityId],
    queryFn: () => getClubs(formState.cityId),
    enabled: Boolean(formState.cityId),
  });

  const importMutation = useMutation({
    mutationFn: (payload: CreateTournamentPayload) => createTournament(payload),
  });

  const importErrorDetails = importMutation.isError ? getImportErrorDetails(importMutation.error) : [];
  const importWarningDetails = importMutation.isError ? getImportWarningDetails(importMutation.error) : [];
  const playerDecksInputAnalysis = analyzePlayerDecksInput(formState.playerDecksText);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateForm() {
    const errors: string[] = [];

    if (!formState.date) errors.push('Выберите дату турнира.');
    if (!formState.cityId) errors.push('Выберите город.');
    if (!formState.clubId) errors.push('Выберите клуб.');
    if (!formState.tournamentType) errors.push('Выберите тип турнира.');
    if (!formState.formatId) errors.push('Выберите формат.');
    if (!formState.aetherhubUrl.trim()) errors.push('Добавьте ссылку на турнир в Aetherhub.');
    if (!formState.playerDecksText.trim()) {
      errors.push('Добавьте список игроков и колод.');
    } else {
      errors.push(...playerDecksInputAnalysis.errors);
    }

    setValidationErrors(errors);

    return errors.length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await importMutation.mutateAsync({
        date: formState.date,
        cityId: formState.cityId,
        clubId: formState.clubId,
        tournamentType: formState.tournamentType,
        formatId: formState.formatId,
        aetherhubUrl: formState.aetherhubUrl.trim(),
        playerDecksText: formState.playerDecksText,
      });
    } catch {
      return;
    }
  }

  if (citiesQuery.isLoading || formatsQuery.isLoading) {
    return <LoadingState description="Подгружаем города, клубы и форматы для формы." />;
  }

  if (citiesQuery.isError || formatsQuery.isError) {
    return (
      <ErrorState
        description={getErrorMessage(
          citiesQuery.error ?? formatsQuery.error,
          'Не получилось загрузить данные для формы. Попробуйте обновить страницу.',
        )}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="route" variant="warning">
            Служебный раздел
          </Badge>,
          <Badge key="multipart">Ручная загрузка</Badge>,
        ]}
        description="Турнир загружается по ссылке на Aetherhub и списку игроков и колод. Все обязательные поля отмечены в инструкции ниже."
        eyebrow="Импорт турнира"
        title="Добавить турнир"
      />

      <Card tone="muted">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Как добавить турнир</h2>
            <p className="section-header__description">
              Заполните форму по шагам. После успешной загрузки появится ссылка на страницу созданного турнира.
            </p>
          </div>
        </div>
        <ol className="flat-list create-tournament-guide">
          <li>
            <strong>Укажите данные турнира.</strong> Выберите дату, город, клуб, тип и формат. Все эти поля обязательны.
          </li>
          <li>
            <strong>Добавьте ссылку на Aetherhub.</strong> Это обязательное поле: без ссылки турнир нельзя сохранить.
          </li>
          <li>
            <strong>Вставьте список колод.</strong> Используйте один из двух форматов ниже: с именами игроков или только
            названия колод по порядку мест.
          </li>
          <li>
            <strong>Нажмите «Загрузить турнир».</strong> Если в данных есть ошибка, форма покажет, что именно нужно
            исправить. Не закрывайте страницу до завершения загрузки.
          </li>
          <li>
            <strong>Проверьте результат.</strong> После сохранения откройте турнир по появившейся ссылке и проверьте
            участников и названия колод.
          </li>
        </ol>
      </Card>

      <Card>
        <form
          className="form-grid"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="form-grid__full form-section">
            <h2 className="form-section__title">1. О турнире</h2>
            <p className="form-section__description">Заполните дату, площадку, формат и обязательную ссылку на турнир.</p>
          </div>

          <Input
            label="Дата турнира"
            onChange={(event) => setField('date', event.target.value)}
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
            value={formState.cityId}
          />
          <Select
            label="Клуб"
            onChange={(event) => setField('clubId', event.target.value)}
            options={[
              { value: '', label: clubsQuery.isLoading ? 'Загружаем клубы...' : 'Выберите клуб' },
              ...(clubsQuery.data?.items ?? []).map((club) => ({
                value: club.id,
                label: club.name,
              })),
            ]}
            value={formState.clubId}
          />
          <Select
            label="Тип турнира"
            onChange={(event) => setField('tournamentType', event.target.value as TournamentType)}
            options={[
              { value: 'daily', label: 'Дейлик' },
              { value: 'tournament', label: 'Турнир' },
            ]}
            value={formState.tournamentType}
          />
          <Select
            label="Формат"
            onChange={(event) => setField('formatId', event.target.value)}
            options={(formatsQuery.data?.items ?? []).map((format) => ({
              value: format.id,
              label: format.name,
            }))}
            value={formState.formatId}
          />
          <div className="form-grid__spacer" />
          <div className="form-grid__full directory-help">
            Не нашли нужный город, клуб или формат? Напишите <strong>komarovNV</strong> — он добавит недостающее значение
            в список.
          </div>
          <div className="form-grid__full">
            <Input
              helperText="Обязательное поле. Вставьте полную ссылку на страницу турнира в Aetherhub."
              label="Ссылка на Aetherhub"
              onChange={(event) => setField('aetherhubUrl', event.target.value)}
              placeholder="https://aetherhub.com/Tourney/RoundTourney/100523"
              required
              type="url"
              value={formState.aetherhubUrl}
            />
          </div>

          <div className="form-grid__full">
            <div className="form-section">
              <h2 className="form-section__title">2. Игроки и колоды</h2>
              <p className="form-section__description">
                Список обязателен. Одна непустая строка соответствует одной колоде; режим привязки определяется
                автоматически по содержимому.
              </p>
            </div>

            <div className="input-format-guide">
              <h3 className="input-format-guide__title">Поддерживаемые форматы ввода</h3>
              <p className="input-format-guide__description">
                Ничего переключать не нужно: парсер сам выбирает режим. Не смешивайте два формата в одном списке.
              </p>

              <div className="input-mode-grid">
                <section className="input-mode-card">
                  <h4>1. С именами игроков</h4>
                  <div className="input-format-guide__format">
                    <code>Имя игрока - Название колоды</code>
                  </div>
                  <p>
                    Используйте дефис или тире с пробелами с обеих сторон. Режим включается, если такой разделитель
                    есть минимум у половины строк. Порядок строк не важен: колода привязывается по имени игрока.
                  </p>
                  <div className="input-format-guide__example">
                    <div className="input-format-guide__example-title">Корректный пример</div>
                    <pre>{'Терехов Александр - Lands\nРадченко Фёдор — UW Phelia\nИванов Иван - Grixis Reanimator'}</pre>
                  </div>
                  <p>
                    Если имя отличается незначительно, импорт попробует найти близкое совпадение и покажет
                    предупреждение. Лишний игрок, повтор игрока или отсутствие колоды у участника заблокируют импорт.
                  </p>
                </section>

                <section className="input-mode-card">
                  <h4>2. Только колоды — по порядку мест</h4>
                  <div className="input-format-guide__format">
                    <code>Название колоды</code>
                  </div>
                  <p>
                    Если разделитель встречается менее чем у половины строк, имена не используются. Первая колода
                    назначается игроку на первом месте в Aetherhub, вторая — игроку на втором месте и так далее.
                  </p>
                  <div className="input-format-guide__example">
                    <div className="input-format-guide__example-title">Корректный пример</div>
                    <pre>{'Lands\nUW Phelia\nGrixis Reanimator'}</pre>
                  </div>
                  <p>
                    Количество строк должно точно совпадать с количеством игроков. После импорта обязательно сверьте
                    привязку вручную: сервер всегда выдаёт предупреждение для этого режима.
                  </p>
                </section>
              </div>

              <div className="input-numbering-note">
                <strong>Нумерация необязательна.</strong> Можно начинать строки с <code>1.</code> или <code>1)</code>, но
                тогда номера должны идти строго подряд: <code>1, 2, 3 … N</code>. Не используйте пропуски, повторы или
                перестановки.
              </div>

              <div className="input-separator-warning">
                <strong>Если в строке указано ФИО, между именем игрока и колодой обязательно должен стоять дефис.</strong>
                Без дефиса парсер посчитает всю строку названием колоды.
                <div className="input-separator-warning__examples">
                  <div>
                    <span>Нельзя:</span> <code>Дорофеев Александр White Weenie</code>
                  </div>
                  <div>
                    <span>Правильно:</span> <code>Дорофеев Александр - White Weenie</code>
                  </div>
                </div>
              </div>

              <h4 className="input-format-guide__subtitle">Так добавлять нельзя</h4>
              <ul className="flat-list input-format-guide__rules">
                <li>
                  <strong>Используйте одно и то же название для одинаковых колод.</strong> Например, не смешивайте
                  варианты «Grixis Reanimator», «Grixis Rean» и «Гриксис Реаниматор»: статистика может посчитать их
                  разными колодами.
                </li>
                <li>Не добавляйте заголовок таблицы, пояснения или посторонние строки.</li>
                <li>Не смешивайте строки «Игрок - Колода» со списком только из названий колод.</li>
                <li>В режиме с именами не оставляйте имя игрока или название колоды пустыми.</li>
                <li>Не указывайте одного игрока несколько раз и не объединяйте нескольких игроков в одной строке.</li>
                <li>В режиме по местам не меняйте порядок колод относительно финальных мест в Aetherhub.</li>
                <li>Пустые строки между участниками можно оставлять — они будут пропущены.</li>
              </ul>
            </div>
            <Textarea
              helperText="Если указываете ФИО, обязательно поставьте дефис: «Игрок - Колода». Без дефиса вся строка будет считаться названием колоды."
              label="Список игроков и колод"
              onChange={(event) => setField('playerDecksText', event.target.value)}
              placeholder={'Терехов Александр - Lands\nРадченко Фёдор - UW Phelia'}
              rows={8}
              value={formState.playerDecksText}
            />
            {formState.playerDecksText.trim() ? (
              <div className={playerDecksInputAnalysis.errors.length ? 'input-mode-status input-mode-status--error' : 'input-mode-status'}>
                <strong>Распознан режим:</strong>{' '}
                {playerDecksInputAnalysis.mode === 'named' ? 'с именами игроков' : 'только колоды по порядку мест'}.
                {playerDecksInputAnalysis.errors.length
                  ? ` Проверьте список: ${playerDecksInputAnalysis.errors.join(' ')}`
                  : playerDecksInputAnalysis.warnings.length
                    ? ` Обратите внимание: ${playerDecksInputAnalysis.warnings.join(' ')}`
                    : ' Формат выглядит корректно.'}
              </div>
            ) : null}
          </div>

          <div className="form-actions">
            <Button
              disabled={importMutation.isPending}
              type="submit"
            >
              {importMutation.isPending ? 'Загружаем...' : 'Загрузить турнир'}
            </Button>
          </div>
        </form>
      </Card>

      {validationErrors.length > 0 ? (
        <Card tone="muted">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Не хватает нескольких полей</h2>
              <p className="section-header__description">Перед загрузкой проверьте форму. Сейчас не заполнено вот что:</p>
            </div>
          </div>
          <ul className="flat-list">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {importMutation.isError ? (
        <Card className="state-card state-card--error">
          <h2 className="state-card__title">Турнир не загружен</h2>
          <p className="state-card__description">
            {importErrorDetails.length
              ? 'Мы нашли ошибки в данных импорта. Исправьте их и попробуйте загрузить турнир ещё раз.'
              : getErrorMessage(importMutation.error, 'Не удалось загрузить турнир. Проверьте данные и попробуйте ещё раз.')}
          </p>

          {importErrorDetails.length ? (
            <ul className="flat-list">
              {importErrorDetails.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}

          {importWarningDetails.length ? (
            <>
              <p className="muted-text">Также пришли предупреждения, которые могут помочь понять, что именно пошло не так:</p>
              <ul className="flat-list">
                {importWarningDetails.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      ) : null}

      {importMutation.isSuccess ? (
        <Card tone="success">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Турнир загружен</h2>
              <p className="section-header__description">
                {importMutation.data.message} Турнир добавлен в базу и теперь должен появиться в общем списке.
              </p>
            </div>
          </div>
          <ul className="flat-list">
            <li>ID турнира: {importMutation.data.tournamentId}</li>
            <li>После загрузки его можно открыть в списке турниров и проверить итоговые места, пары и колоды.</li>
            <li>Ссылка на Aetherhub была передана вместе с импортом.</li>
          </ul>

          <div className="form-actions">
            <Link
              className="button button--primary section-link"
              to={`/tournaments/${importMutation.data.tournamentId}`}
            >
              Открыть турнир
            </Link>
            <Link
              className="button button--ghost section-link"
              to="/tournaments"
            >
              Ко всем турнирам
            </Link>
          </div>

          {importMutation.data.warnings?.length ? (
            <>
              <p className="muted-text">Турнир загружен, но есть несколько предупреждений, на которые стоит обратить внимание:</p>
              <ul className="flat-list">
                {importMutation.data.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
