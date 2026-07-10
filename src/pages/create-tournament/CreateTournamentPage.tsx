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

    if (!formState.date) errors.push('Дата турнира обязательна.');
    if (!formState.cityId) errors.push('Город обязателен.');
    if (!formState.clubId) errors.push('Клуб обязателен.');
    if (!formState.tournamentType) errors.push('Тип турнира обязателен.');
    if (!formState.formatId) errors.push('Формат обязателен.');
    if (!formState.finalStandingsFile) errors.push('CSV со стендингами обязателен.');
    if (!formState.allRoundsFile) errors.push('CSV со всеми раундами обязателен.');
    if (!formState.playerDecksText.trim()) errors.push('Текст player -> deck обязателен.');

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
        finalStandingsFile: formState.finalStandingsFile!,
        allRoundsFile: formState.allRoundsFile!,
        playerDecksText: formState.playerDecksText,
      });
    } catch {
      return;
    }
  }

  if (citiesQuery.isLoading || formatsQuery.isLoading) {
    return <LoadingState description="Подгружаем справочники для формы импорта." />;
  }

  if (citiesQuery.isError || formatsQuery.isError) {
    return (
      <ErrorState
        description={getErrorMessage(
          citiesQuery.error ?? formatsQuery.error,
          'Не удалось загрузить справочники для формы.',
        )}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="route" variant="warning">
            Admin route
          </Badge>,
          <Badge key="multipart">multipart/form-data</Badge>,
        ]}
        description="Ручной MVP-импорт турнира с зависимыми справочниками города и клуба."
        eyebrow="Импорт турнира"
        title="Добавить турнир"
      />

      {validationErrors.length > 0 ? (
        <Card tone="muted">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Проверьте форму</h2>
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
        <ErrorState description={getErrorMessage(importMutation.error, 'Не удалось импортировать турнир.')} />
      ) : null}

      {importMutation.isSuccess ? (
        <Card tone="accent">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Импорт завершён</h2>
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
              { value: '', label: clubsQuery.isLoading ? 'Загрузка клубов...' : 'Выберите клуб' },
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
            <Textarea
              helperText="По одной строке: Имя игрока -> Колода"
              label="Список player -> deck"
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
              {importMutation.isPending ? 'Импортируем...' : 'Импортировать турнир'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
