import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

it('opens a direct lazy route and navigates to the changelog and import form', async () => {
  window.history.replaceState({}, '', '/digest');
  const fetchMock = vi.fn().mockImplementation(async () => new Response('[]'));
  vi.stubGlobal('fetch', fetchMock);
  const { App } = await import('@/app/App');
  const { router } = await import('@/app/router/router');
  const view = render(<App />);
  const user = userEvent.setup();

  try {
    expect(await screen.findByRole('heading', { name: 'Дайджест' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: /Что нового/ }));
    expect(await screen.findByRole('heading', { name: 'Что нового' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: 'Добавить' }));
    expect(await screen.findByLabelText(/Ссылка на Aetherhub/)).toBeInTheDocument();
    await act(() => router.navigate('/digest?cityId=moscow&formatId=&top=7'));
    const matrixLink = screen.getByRole('link', { name: 'Матрица матчапов' });
    expect(matrixLink).toHaveAttribute('href', '/matchups?cityId=moscow&formatId=');
    expect(screen.getByRole('link', { name: 'Лиги' })).toHaveAttribute('href', '/leagues?cityId=moscow&formatId=');
    await user.click(matrixLink);
    expect(await screen.findByRole('heading', { name: 'Матрица матчапов' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Выберите формат' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => new URL(url).pathname.endsWith('/matchups'))).toBe(false);
  } finally {
    view.unmount();
    router.dispose();
    window.history.replaceState({}, '', '/');
  }
});
