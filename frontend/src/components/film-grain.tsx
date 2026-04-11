'use client';

import { usePathname } from 'next/navigation';

/**
 * Film grain overlay - se oculta automáticamente en el dashboard
 * para mejorar el rendimiento (evita repaints constantes durante scroll).
 */
export function FilmGrainOverlay() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  // Ocultar film-grain en dashboard para mejorar performance
  if (isDashboard) return null;

  return (
    <div
      className="film-grain-overlay"
      aria-hidden="true"
    />
  );
}
