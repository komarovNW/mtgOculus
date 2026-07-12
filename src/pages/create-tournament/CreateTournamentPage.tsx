import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTournament } from '@/entities/admin-tournament/api';
import { getCities, getClubs, getFormats } from '@/entities/dictionaries/api';
import type { CreateTournamentPayload, TournamentType } from '@/shared/api/types';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FileInput } from '@/shared/ui/FileInput';
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
  finalStandingsFile: File | null;
  allRoundsFile: File | null;
  playerDecksText: string;
};

const initialState: FormState = {
  date: '',
  cityId: 'moscow',
  clubId: '',
  tournamentType: 'daily',
  formatId: 'legacy',
  aetherhubUrl: '',
  finalStandingsFile: null,
  allRoundsFile: null,
  playerDecksText: '',
};

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
    if (!formState.finalStandingsFile) errors.push('Добавьте CSV с итоговыми стендингами.');
    if (!formState.allRoundsFile) errors.push('Добавьте CSV со всеми раундами.');
    if (!formState.playerDecksText.trim()) errors.push('Добавьте список игроков и колод.');

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
        aetherhubUrl: formState.aetherhubUrl.trim() || undefined,
        finalStandingsFile: formState.finalStandingsFile!,
        allRoundsFile: formState.allRoundsFile!,
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
        description="Пока турнир загружается вручную: по двум CSV и списку колод. Ссылку на Aetherhub можно добавить сразу, чтобы позже перейти к импорту по ссылке."
        eyebrow="Импорт турнира"
        title="Добавить турнир"
      />

      <Card tone="muted">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Что подготовить</h2>
            <p className="section-header__description">
              Турнир пока собирается по CSV, поэтому лучше заранее держать всё под рукой.
            </p>
          </div>
        </div>
        <ul className="flat-list">
          <li>Дата, город, клуб, тип турнира и формат.</li>
          <li>Ссылка на Aetherhub, если она уже есть.</li>
          <li>CSV с итоговыми стендингами.</li>
          <li>CSV со всеми раундами.</li>
          <li>Список игроков и колод в простом текстовом виде.</li>
        </ul>
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
        <ErrorState
          description={getErrorMessage(importMutation.error, 'Не удалось загрузить турнир. Проверьте файлы и попробуйте ещё раз.')}
        />
      ) : null}

      {importMutation.isSuccess ? (
        <Card tone="success">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Турнир загружен</h2>
              <p className="section-header__description">{importMutation.data.message}</p>
            </div>
          </div>
          <p className="muted-text">ID турнира: {importMutation.data.tournamentId}</p>
          {importMutation.data.warnings?.length ? (
            <ul className="flat-list">
              {importMutation.data.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <form
          className="form-grid"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="form-grid__full form-section">
            <h2 className="form-section__title">1. О турнире</h2>
            <p className="form-section__description">Заполните дату, площадку, формат и, если есть, ссылку на турнир.</p>
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
          <div className="form-grid__full">
            <Input
              helperText="Поле пока необязательное. Сейчас турнир всё ещё загружается по CSV, но ссылку можно сохранить уже сейчас."
              label="Ссылка на Aetherhub"
              onChange={(event) => setField('aetherhubUrl', event.target.value)}
              placeholder="https://aetherhub.com/..."
              type="url"
              value={formState.aetherhubUrl}
            />
          </div>

          <div className="form-grid__full form-section">
            <h2 className="form-section__title">2. Файлы</h2>
            <p className="form-section__description">Нужны два отдельных CSV: один с итогами, второй с раундами.</p>
          </div>

          <FileInput
            accept=".csv,text/csv"
            helperText={formState.finalStandingsFile?.name}
            label="CSV итоговых стендингов"
            onChange={(event) => setField('finalStandingsFile', event.target.files?.[0] ?? null)}
          />
          <FileInput
            accept=".csv,text/csv"
            helperText={formState.allRoundsFile?.name}
            label="CSV всех раундов"
            onChange={(event) => setField('allRoundsFile', event.target.files?.[0] ?? null)}
          />

          <div className="form-grid__full">
            <div className="form-section">
              <h2 className="form-section__title">3. Игроки и колоды</h2>
              <p className="form-section__description">
                Добавьте простой список вида «Игрок -&gt; Колода». Этого достаточно, чтобы собрать участников турнира.
              </p>
            </div>
            <Textarea
              helperText="По одной строке: Имя игрока -> Колода"
              label="Список игроков и колод"
              onChange={(event) => setField('playerDecksText', event.target.value)}
              placeholder={'Терехов Александр -> Lands\nРадченко Фёдор -> UW Phelia'}
              rows={8}
              value={formState.playerDecksText}
            />
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
    </div>
  );
}
