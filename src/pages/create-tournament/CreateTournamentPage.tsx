import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createTournament } from '@/entities/admin-tournament/api';
import { getCities, getClubs, getFormats } from '@/entities/dictionaries/api';
import type { CreateTournamentPayload, TournamentType } from '@/shared/api/types';
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

const initialState: FormState = {
  date: '',
  cityId: 'moscow',
  clubId: '',
  tournamentType: 'daily',
  formatId: 'legacy',
  aetherhubUrl: '',
  playerDecksText: '',
};

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

export function CreateTournamentPage() {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const citiesQuery = useQuery({
    queryKey: ['create-event', 'cities'],
    queryFn: getCities,
  });
  const formatsQuery = useQuery({
    queryKey: ['create-event', 'formats'],
    queryFn: getFormats,
  });
  const clubsQuery = useQuery({
    queryKey: ['create-event', 'clubs', formState.cityId],
    queryFn: () => getClubs(formState.cityId),
    enabled: Boolean(formState.cityId),
  });
  const importMutation = useMutation({
    mutationFn: createTournament,
  });

  const inputAnalysis = analyzePlayerDecksInput(formState.playerDecksText);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const errors: string[] = [];

    if (!formState.date) errors.push('Выберите дату.');
    if (!formState.cityId) errors.push('Выберите город.');
    if (!formState.clubId) errors.push('Выберите клуб.');
    if (!formState.formatId) errors.push('Выберите формат.');
    if (!formState.aetherhubUrl.trim()) errors.push('Добавьте ссылку на Aetherhub.');
    if (!formState.playerDecksText.trim()) {
      errors.push('Добавьте список игроков и колод.');
    } else {
      errors.push(...inputAnalysis.errors);
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
      playerDecksText: formState.playerDecksText.trim(),
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
            variant="warning"
          >
            Служебный раздел
          </Badge>,
          <Badge key="method">Ручная загрузка</Badge>,
        ]}
        description="Событие загружается по ссылке на Aetherhub и списку игроков и колод. Все обязательные поля отмечены в инструкции ниже."
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
              Заполните форму по шагам. После успешной загрузки появится ссылка на
              страницу созданного события.
            </p>
          </div>
        </div>
        <ol className="flat-list">
          <li>
            <strong>Укажите данные события.</strong> Выберите дату, город, клуб, тип и
            формат. Все эти поля обязательны.
          </li>
          <li>
            <strong>Добавьте ссылку на Aetherhub.</strong> Без ссылки событие нельзя
            сохранить.
          </li>
          <li>
            <strong>Вставьте список колод.</strong> Используйте один из двух форматов
            ниже: с именами игроков или только названия колод по порядку мест.
          </li>
          <li>
            <strong>Нажмите «Добавить».</strong> Если в данных есть ошибка, форма
            покажет, что именно нужно исправить. Не закрывайте страницу до завершения
            загрузки.
          </li>
          <li>
            <strong>Проверьте результат.</strong> После сохранения откройте событие по
            появившейся ссылке и проверьте участников и названия колод.
          </li>
        </ol>
      </Card>

      <Card>
        <form
          className="form-grid"
          onSubmit={handleSubmit}
        >
          <div className="form-grid__full form-section">
            <h2 className="form-section__title">1. О событии</h2>
            <p className="form-section__description">
              Заполните дату, площадку, тип, формат и обязательную ссылку на событие.
            </p>
          </div>
          <Input
            label="Дата события"
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
              { value: '', label: clubsQuery.isLoading ? 'Загружаем...' : 'Выберите клуб' },
              ...(clubsQuery.data?.items ?? []).map((club) => ({
                value: club.id,
                label: club.name,
              })),
            ]}
            value={formState.clubId}
          />
          <Select
            label="Тип события"
            onChange={(event) =>
              setField('tournamentType', event.target.value as TournamentType)
            }
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
          <div
            aria-hidden="true"
            className="form-grid__spacer"
          />
          <div className="form-grid__full directory-help">
            Не нашли нужный город, клуб или формат?{' '}
            <a
              href="https://github.com/komarovNW/mtgOculus/issues/new"
              rel="noreferrer"
              target="_blank"
            >
              Создайте задачу в GitHub Issues
            </a>
            , и мы добавим недостающее значение в список.
          </div>
          <div className="form-grid__full">
            <Input
              helperText="Обязательное поле. Вставьте полную ссылку на страницу события в Aetherhub."
              label="Ссылка на Aetherhub"
              onChange={(event) => setField('aetherhubUrl', event.target.value)}
              placeholder="https://aetherhub.com/Tourney/RoundTourney/100523"
              required
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

          <div className="form-grid__full form-section">
            <h2 className="form-section__title">2. Игроки и колоды</h2>
            <p className="form-section__description">
              Список обязателен. Одна непустая строка соответствует одной колоде;
              режим привязки определяется автоматически по содержимому.
            </p>
          </div>
          <details className="form-grid__full input-format-guide">
            <summary>
              <span>
                <strong>Как подготовить список игроков и колод</strong>
                <small>Нажмите, чтобы раскрыть полное описание и примеры</small>
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
                  Ничего переключать не нужно: формат определяется автоматически. Не
                  смешивайте два формата в одном списке.
                </p>
              </div>

              <div className="input-mode-grid">
                <section className="input-mode-card">
                  <h4>1. С именами игроков</h4>
                  <code className="input-mode-format">
                    Имя игрока - Название колоды
                  </code>
                  <p>
                    Используйте дефис, длинное тире или среднее тире с пробелами с
                    обеих сторон. Этот режим включается, если разделитель есть минимум
                    у половины строк. Порядок строк не важен: колода привязывается по
                    имени игрока.
                  </p>
                  <strong>Корректный пример</strong>
                  <pre>{'Игрок 1 - Lands\nИгрок 2 - UW Phelia\nИгрок 3 - Grixis Reanimator'}</pre>
                  <p>
                    Если имя отличается незначительно, импорт попробует найти близкое
                    совпадение и покажет предупреждение. Лишний игрок, повтор игрока
                    или отсутствие колоды у участника заблокируют импорт.
                  </p>
                </section>

                <section className="input-mode-card">
                  <h4>2. Только колоды — по порядку мест</h4>
                  <code className="input-mode-format">Название колоды</code>
                  <p>
                    Если разделитель встречается менее чем у половины строк, имена не
                    используются. Первая колода назначается игроку на первом месте в
                    Aetherhub, вторая — игроку на втором месте и так далее.
                  </p>
                  <strong>Корректный пример</strong>
                  <pre>{'Lands\nUW Phelia\nGrixis Reanimator'}</pre>
                  <p>
                    Количество строк должно точно совпадать с количеством игроков.
                    После импорта обязательно сверьте привязку вручную: сервер всегда
                    выдаёт предупреждение для этого режима.
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
                <p>Без дефиса парсер посчитает всю строку названием колоды.</p>
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
                    В режиме по местам не меняйте порядок колод относительно
                    финальных мест в Aetherhub.
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
              helperText="Одна строка соответствует одной колоде. Перед отправкой проверьте определённый режим ниже."
              label="Список игроков и колод"
              onChange={(event) => setField('playerDecksText', event.target.value)}
              placeholder={'Игрок 1 - Lands\nИгрок 2 - UW Phelia\nИгрок 3 - Grixis Reanimator'}
              rows={10}
              value={formState.playerDecksText}
            />
          </div>
          {formState.playerDecksText.trim() ? (
            <div className="form-grid__full input-mode-status">
              <strong>
                Определён режим:{' '}
                {inputAnalysis.mode === 'named'
                  ? 'с именами игроков'
                  : 'колоды по порядку мест'}
              </strong>
              {inputAnalysis.errors[0] ? <span>{inputAnalysis.errors[0]}</span> : null}
              {!inputAnalysis.errors.length && inputAnalysis.warnings[0] ? (
                <span>{inputAnalysis.warnings[0]}</span>
              ) : null}
            </div>
          ) : null}

          <div className="form-grid__full form-actions">
            <Button
              disabled={importMutation.isPending}
              type="submit"
            >
              {importMutation.isPending ? 'Добавляем...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Card>

      {validationErrors.length ? (
        <Card tone="muted">
          <h2 className="state-card__title">Проверьте форму</h2>
          <ul className="flat-list">
            {validationErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </Card>
      ) : null}

      {importMutation.isError ? (
        <ErrorState
          description={getErrorMessage(
            importMutation.error,
            'Не удалось добавить событие. Проверьте данные и попробуйте ещё раз.',
          )}
          onRetry={() => importMutation.reset()}
        />
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
            <ul className="flat-list">
              {importMutation.data.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          <div className="form-actions">
            <Link
              className="button button--primary section-link"
              to={`/tournaments/${importMutation.data.tournamentId}`}
            >
              Открыть событие
            </Link>
            <Link
              className="button button--ghost section-link"
              to={formState.tournamentType === 'daily' ? '/dailies' : '/tournaments'}
            >
              К списку
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
