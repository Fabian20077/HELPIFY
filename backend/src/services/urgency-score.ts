// ============================================================================
// Helpify — Score de Urgencia Calculado
// Sección 3.4 del Documento Técnico
// ============================================================================
// Factor                    | Peso máximo | Descripción
// Tiempo sin respuesta      | 35 puntos   | Cada hora sin actividad suma. Máximo a 24h.
// Reaperturas previas       | 25 puntos   | Cada reapertura acumulada suma puntos.
// Historial del usuario     | 20 puntos   | Muchos tickets recientes = urgencia real.
// Tiempo en waiting         | 20 puntos   | Horas esperando respuesta del cliente.
// ============================================================================
// RN-12: Se calcula en runtime al consultar el ticket. NO se persiste en BD.
// ============================================================================

export interface UrgencyFactors {
  /** Horas transcurridas desde la última actividad en el ticket */
  hoursSinceLastActivity: number;
  /** Número de veces que el ticket fue reabierto (resolved → in_progress) */
  reopenCount: number;
  /** Número de tickets abiertos por el mismo usuario en los últimos 30 días */
  userRecentTicketCount: number;
  /** Horas que el ticket ha estado en estado "waiting" */
  hoursInWaiting: number;
}

export interface UrgencyBreakdown {
  /** Score total (0-100) */
  total: number;
  /** Desglose por factor */
  factors: {
    timeSinceLastActivity: number;
    reopens: number;
    userHistory: number;
    waitingTime: number;
  };
}

// ── Constantes de configuración ──────────────────────────────────────────────
const MAX_SCORE = 100;
const WEIGHTS = {
  TIME_SINCE_LAST_ACTIVITY: 35,
  REOPENS: 25,
  USER_HISTORY: 20,
  WAITING_TIME: 20,
} as const;

// ── Umbrales ─────────────────────────────────────────────────────────────────
/** Horas sin actividad para alcanzar el máximo del factor */
const MAX_HOURS_NO_ACTIVITY = 24;
/** Cada reapertura suma este porcentaje del máximo */
const POINTS_PER_REOPEN = 10;
/** Tickets recientes para alcanzar el máximo del factor */
const MAX_RECENT_TICKETS = 10;
/** Horas en waiting para alcanzar el máximo del factor */
const MAX_HOURS_WAITING = 48;

/**
 * Calcula el score de urgencia (0-100) basado en factores objetivos.
 * @param factors - Los factores para calcular el score
 * @returns Objeto con el score total y el desglose por factor
 */
export function calculateUrgencyScore(factors: UrgencyFactors): UrgencyBreakdown {
  // Factor 1: Tiempo sin respuesta (0-35 puntos)
  const timeFactor = Math.min(
    (factors.hoursSinceLastActivity / MAX_HOURS_NO_ACTIVITY) * WEIGHTS.TIME_SINCE_LAST_ACTIVITY,
    WEIGHTS.TIME_SINCE_LAST_ACTIVITY
  );

  // Factor 2: Reaperturas previas (0-25 puntos)
  const reopenFactor = Math.min(
    factors.reopenCount * POINTS_PER_REOPEN,
    WEIGHTS.REOPENS
  );

  // Factor 3: Historial del usuario (0-20 puntos)
  const historyFactor = Math.min(
    (factors.userRecentTicketCount / MAX_RECENT_TICKETS) * WEIGHTS.USER_HISTORY,
    WEIGHTS.USER_HISTORY
  );

  // Factor 4: Tiempo en waiting (0-20 puntos)
  const waitingFactor = Math.min(
    (factors.hoursInWaiting / MAX_HOURS_WAITING) * WEIGHTS.WAITING_TIME,
    WEIGHTS.WAITING_TIME
  );

  const total = Math.round(
    Math.min(timeFactor + reopenFactor + historyFactor + waitingFactor, MAX_SCORE)
  );

  return {
    total,
    factors: {
      timeSinceLastActivity: Math.round(timeFactor * 10) / 10,
      reopens: Math.round(reopenFactor * 10) / 10,
      userHistory: Math.round(historyFactor * 10) / 10,
      waitingTime: Math.round(waitingFactor * 10) / 10,
    },
  };
}

/**
 * Retorna el color CSS asociado al score para la UI.
 * Verde (bajo) → Amarillo (medio) → Rojo (alto)
 */
export function getUrgencyColor(score: number): string {
  if (score <= 25) return '#22c55e'; // green-500
  if (score <= 50) return '#eab308'; // yellow-500
  if (score <= 75) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * Retorna la etiqueta legible del nivel de urgencia.
 */
export function getUrgencyLabel(score: number): string {
  if (score <= 25) return 'Baja';
  if (score <= 50) return 'Media';
  if (score <= 75) return 'Alta';
  return 'Crítica';
}
