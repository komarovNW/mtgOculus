import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import type { AuthSession } from '@/shared/auth/model';

export function TestProviders({
  children,
  initialEntry = '/',
  initialSession,
}: PropsWithChildren<{ initialEntry?: string; initialSession?: AuthSession | null }>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={client}>
      <AuthProvider initialSession={initialSession}>
        <MemoryRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
          initialEntries={[initialEntry]}
        >
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
