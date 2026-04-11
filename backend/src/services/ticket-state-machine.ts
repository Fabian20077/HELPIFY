// ============================================================================
// Helpify — Máquina de Estados del Ticket
// Sección 3.3 del Documento Técnico
// ============================================================================
// Estado origen      → Estados destino permitidos
// open               → in_progress, closed
// in_progress        → waiting, resolved, closed
// waiting            → in_progress, resolved, closed
// resolved           → in_progress, closed
// closed             → (ninguno) — estado terminal
// ============================================================================

import { TicketStatus } from '../generated/prisma/client';

/**
 * Mapa de transiciones válidas según la máquina de estados.
 * Cada clave es un estado de origen, y el valor es un array con los
 * estados de destino permitidos.
 */
export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: [TicketStatus.in_progress, TicketStatus.closed],
  in_progress: [TicketStatus.waiting, TicketStatus.resolved, TicketStatus.closed],
  waiting: [TicketStatus.in_progress, TicketStatus.resolved, TicketStatus.closed],
  resolved: [TicketStatus.in_progress, TicketStatus.closed],
  closed: [], // Estado terminal — no puede cambiar (RN-11)
};

/**
 * Error de validación para transiciones inválidas.
 */
export class ValidationError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Valida si una transición de estado es permitida.
 * @param currentStatus - Estado actual del ticket
 * @param newStatus - Estado al que se quiere transicionar
 * @throws ValidationError si la transición no es válida
 * @returns true si la transición es válida
 */
export function validateTransition(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  const allowedTargets = VALID_TRANSITIONS[currentStatus];

  if (!allowedTargets || allowedTargets.length === 0) {
    throw new ValidationError(
      `No se puede cambiar el estado desde "${currentStatus}". Es un estado terminal.`
    );
  }

  if (!allowedTargets.includes(newStatus)) {
    throw new ValidationError(
      `Transición inválida: "${currentStatus}" → "${newStatus}". ` +
      `Transiciones permitidas desde "${currentStatus}": [${allowedTargets.join(', ')}]`
    );
  }

  return true;
}

/**
 * Verifica si un ticket está en estado terminal.
 */
export function isTerminalState(status: TicketStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/**
 * Determina si la transición implica una reapertura (resolved → in_progress).
 * Según RN-04: al reabrir, resolvedAt se limpia.
 */
export function isReopening(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  return currentStatus === TicketStatus.resolved && newStatus === TicketStatus.in_progress;
}

/**
 * Determina si la transición marca como resuelto.
 * Según RN-04: al pasar a resolved se registra resolvedAt.
 */
export function isResolving(newStatus: TicketStatus): boolean {
  return newStatus === TicketStatus.resolved;
}
