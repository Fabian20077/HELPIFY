// ============================================================================
// Helpify — Unit Tests: Máquina de Estados del Ticket
// Documento Técnico Sección 3.3 + Sección 9.3
// ============================================================================

import {
  validateTransition,
  isTerminalState,
  isReopening,
  isResolving,
  ValidationError,
  VALID_TRANSITIONS,
} from '../../services/ticket-state-machine';
import { TicketStatus } from '../../generated/prisma/client';

describe('Ticket State Machine', () => {
  // ── Transiciones válidas ─────────────────────────────────────────────────
  describe('Transiciones válidas', () => {
    const validCases: [TicketStatus, TicketStatus][] = [
      // Desde open
      ['open', 'in_progress'],
      ['open', 'closed'],
      // Desde in_progress
      ['in_progress', 'waiting'],
      ['in_progress', 'resolved'],
      ['in_progress', 'closed'],
      // Desde waiting
      ['waiting', 'in_progress'],
      ['waiting', 'resolved'],
      ['waiting', 'closed'],
      // Desde resolved
      ['resolved', 'in_progress'], // Reapertura
      ['resolved', 'closed'],
    ];

    it.each(validCases)(
      'permite la transición %s → %s',
      (from, to) => {
        expect(validateTransition(from, to)).toBe(true);
      }
    );
  });

  // ── Transiciones inválidas ───────────────────────────────────────────────
  describe('Transiciones inválidas', () => {
    it('lanza ValidationError al intentar open → resolved', () => {
      expect(() => validateTransition('open', 'resolved')).toThrow(ValidationError);
    });

    it('lanza ValidationError al intentar open → waiting', () => {
      expect(() => validateTransition('open', 'waiting')).toThrow(ValidationError);
    });

    it('lanza ValidationError al intentar in_progress → open', () => {
      expect(() => validateTransition('in_progress', 'open')).toThrow(ValidationError);
    });

    it('lanza ValidationError al intentar waiting → open', () => {
      expect(() => validateTransition('waiting', 'open')).toThrow(ValidationError);
    });

    it('lanza ValidationError al intentar resolved → open', () => {
      expect(() => validateTransition('resolved', 'open')).toThrow(ValidationError);
    });

    it('lanza ValidationError al intentar resolved → waiting', () => {
      expect(() => validateTransition('resolved', 'waiting')).toThrow(ValidationError);
    });
  });

  // ── Estado terminal: closed ──────────────────────────────────────────────
  describe('Estado terminal (closed)', () => {
    it('no se puede salir de closed → open', () => {
      expect(() => validateTransition('closed', 'open')).toThrow(ValidationError);
    });

    it('no se puede salir de closed → in_progress', () => {
      expect(() => validateTransition('closed', 'in_progress')).toThrow(ValidationError);
    });

    it('no se puede salir de closed → waiting', () => {
      expect(() => validateTransition('closed', 'waiting')).toThrow(ValidationError);
    });

    it('no se puede salir de closed → resolved', () => {
      expect(() => validateTransition('closed', 'resolved')).toThrow(ValidationError);
    });

    it('no se puede salir de closed → closed', () => {
      expect(() => validateTransition('closed', 'closed')).toThrow(ValidationError);
    });

    it('isTerminalState retorna true para closed', () => {
      expect(isTerminalState('closed')).toBe(true);
    });

    it('isTerminalState retorna false para open', () => {
      expect(isTerminalState('open')).toBe(false);
    });
  });

  // ── Reapertura ───────────────────────────────────────────────────────────
  describe('Reapertura (resolved → in_progress)', () => {
    it('detecta correctamente una reapertura', () => {
      expect(isReopening('resolved', 'in_progress')).toBe(true);
    });

    it('no marca como reapertura una transición normal', () => {
      expect(isReopening('open', 'in_progress')).toBe(false);
    });

    it('no marca como reapertura resolved → closed', () => {
      expect(isReopening('resolved', 'closed')).toBe(false);
    });
  });

  // ── Resolución ───────────────────────────────────────────────────────────
  describe('Resolución', () => {
    it('isResolving retorna true para resolved', () => {
      expect(isResolving('resolved')).toBe(true);
    });

    it('isResolving retorna false para in_progress', () => {
      expect(isResolving('in_progress')).toBe(false);
    });

    it('isResolving retorna false para closed', () => {
      expect(isResolving('closed')).toBe(false);
    });
  });

  // ── Mensajes de error claros ─────────────────────────────────────────────
  describe('Mensajes de error', () => {
    it('incluye los estados permitidos en el mensaje de error', () => {
      try {
        validateTransition('open', 'resolved');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('in_progress');
        expect((error as ValidationError).message).toContain('closed');
        expect((error as ValidationError).statusCode).toBe(400);
      }
    });

    it('indica estado terminal en el mensaje de error desde closed', () => {
      try {
        validateTransition('closed', 'open');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('terminal');
      }
    });
  });
});
