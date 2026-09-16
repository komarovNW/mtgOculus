import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { router } from '@/app/router/router';
import { LoadingState } from '@/shared/ui/LoadingState';

export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} fallbackElement={<LoadingState description="Открываем страницу." />} />
    </QueryProvider>
  );
}
