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
        badges={[<Badge key="access">Доступно всем</Badge>]}
        description="Добавьте сыгранный дейлик или турнир по ссылке Aetherhub и укажите колоды участников."
        eyebrow="Новое событие"
        title="Добавить"
      />

      <Card tone="muted">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Что понадобится</h2>
            <p className="section-header__description">
              Ссылка на событие в Aetherhub и список колод. Можно указать пары
              «Игрок - Колода» или перечислить колоды по порядку итоговых мест.
            </p>
          </div>
        </div>
        <ul className="flat-list">
          <li><code>Игрок 1 - Название колоды</code></li>
          <li><code>Игрок 2 - Название колоды</code></li>
          <li>Либо по одной колоде на строку в порядке мест.</li>
        </ul>
      </Card>

      <Card>
        <form
          className="form-grid"
          onSubmit={handleSubmit}
        >
          <Input
            label="Дата"
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
          <div className="form-grid__full">
            <Input
              helperText="Полная ссылка на страницу события."
              label="Ссылка на Aetherhub"
              onChange={(event) => setField('aetherhubUrl', event.target.value)}
              placeholder="https://aetherhub.com/Tourney/..."
              required
              type="url"
              value={formState.aetherhubUrl}
            />
          </div>
          <div className="form-grid__full">
            <Textarea
              helperText={
                inputAnalysis.errors[0] ??
                inputAnalysis.warnings[0] ??
                'Одна строка соответствует одной колоде.'
              }
              label="Игроки и колоды"
              onChange={(event) => setField('playerDecksText', event.target.value)}
              placeholder={'Игрок 1 - Lands\nИгрок 2 - Painter'}
              rows={10}
              value={formState.playerDecksText}
            />
          </div>

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

      <p className="muted-text">
        Не нашли нужный город, клуб или формат?{' '}
        <a
          href="https://github.com/komarovNW/mtgOculus/issues/new"
          rel="noreferrer"
          target="_blank"
        >
          Создайте задачу в GitHub Issues
        </a>.
      </p>
    </div>
  );
}
