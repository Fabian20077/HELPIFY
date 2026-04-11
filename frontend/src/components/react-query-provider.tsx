'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Datos frescos por 5 minutos (evita refetch en cada navegación)
            staleTime: 1000 * 60 * 5,
            // Mantener en caché por 10 minutos
            gcTime: 1000 * 60 * 10,
            // No refetchear al volver a la ventana
            refetchOnWindowFocus: false,
            // Reintentar solo una vez en caso de error
            retry: 1,
            // Timeout de 10 segundos
            retryDelay: 1000,
          },
          mutations: {
            // Reintentar mutaciones POST/PUT/PATCH solo una vez
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
