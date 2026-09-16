import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function TestProviders({
  children,
  initialEntry = '/',
  queryGcTime = 0,
}: PropsWithChildren<{ initialEntry?: string; queryGcTime?: number }>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: queryGcTime,
      },
    },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
        initialEntries={[initialEntry]}
      >
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}
