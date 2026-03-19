// ============================================================================
// Helpify — Unit Tests: Score de Urgencia
// Documento Técnico Sección 3.4 + Sección 9.3
// ============================================================================

import {
  calculateUrgencyScore,
  getUrgencyColor,
  getUrgencyLabel,
  UrgencyFactors,
} from '../../services/urgency-score';

describe('Urgency Score Calculator', () => {
  // ── Ticket nuevo sin actividad ───────────────────────────────────────────
  describe('Ticket recién creado', () => {
    it('retorna score 0 para un ticket con 0 horas sin actividad', () => {
      const factors: UrgencyFactors = {
        hoursSinceLastActivity: 0,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      };
      const result = calculateUrgencyScore(factors);
      expect(result.total).toBe(0);
    });
  });

  // ── Factor: Tiempo sin respuesta (max 35 puntos) ────────────────────────
  describe('Factor: Tiempo sin respuesta', () => {
    it('12 horas sin actividad da ~17.5 puntos (mitad del máximo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 12,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      expect(result.factors.timeSinceLastActivity).toBeCloseTo(17.5, 0);
    });

    it('24 horas sin actividad da exactamente 35 puntos (máximo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 24,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      expect(result.factors.timeSinceLastActivity).toBe(35);
    });

    it('48 horas sin actividad NO supera 35 puntos (techo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 48,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      expect(result.factors.timeSinceLastActivity).toBe(35);
    });
  });

  // ── Factor: Reaperturas (max 25 puntos) ─────────────────────────────────
  describe('Factor: Reaperturas previas', () => {
    it('1 reapertura da 10 puntos', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 0,
        reopenCount: 1,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      expect(result.factors.reopens).toBe(10);
    });

    it('3 reaperturas da el máximo de 25 puntos (no 30)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 0,
        reopenCount: 3,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      expect(result.factors.reopens).toBe(25);
    });
  });

  // ── Factor: Historial del usuario (max 20 puntos) ───────────────────────
  describe('Factor: Historial del usuario', () => {
    it('5 tickets recientes da 10 puntos (mitad del máximo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 0,
        reopenCount: 0,
        userRecentTicketCount: 5,
        hoursInWaiting: 0,
      });
      expect(result.factors.userHistory).toBe(10);
    });

    it('10 tickets recientes da 20 puntos (máximo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 0,
        reopenCount: 0,
        userRecentTicketCount: 10,
        hoursInWaiting: 0,
      });
      expect(result.factors.userHistory).toBe(20);
    });
  });

  // ── Factor: Tiempo en waiting (max 20 puntos) ──────────────────────────
  describe('Factor: Tiempo en waiting', () => {
    it('24 horas en waiting da 10 puntos (mitad del máximo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 0,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 24,
      });
      expect(result.factors.waitingTime).toBe(10);
    });

    it('48 horas en waiting da 20 puntos (máximo)', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 0,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 48,
      });
      expect(result.factors.waitingTime).toBe(20);
    });
  });

  // ── Score combinado ─────────────────────────────────────────────────────
  describe('Score combinado', () => {
    it('ticket con 3 reaperturas tiene score mayor que uno nuevo', () => {
      const ticketNuevo = calculateUrgencyScore({
        hoursSinceLastActivity: 1,
        reopenCount: 0,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      const ticketReabierto = calculateUrgencyScore({
        hoursSinceLastActivity: 1,
        reopenCount: 3,
        userRecentTicketCount: 0,
        hoursInWaiting: 0,
      });
      expect(ticketReabierto.total).toBeGreaterThan(ticketNuevo.total);
    });

    it('caso extremo: todos los factores al máximo da 100', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 48,
        reopenCount: 5,
        userRecentTicketCount: 20,
        hoursInWaiting: 96,
      });
      expect(result.total).toBe(100);
    });

    it('no supera 100 incluso con valores extremos', () => {
      const result = calculateUrgencyScore({
        hoursSinceLastActivity: 999,
        reopenCount: 999,
        userRecentTicketCount: 999,
        hoursInWaiting: 999,
      });
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });

  // ── Helpers de UI ───────────────────────────────────────────────────────
  describe('Helpers de UI', () => {
    it('color verde para score bajo (0-25)', () => {
      expect(getUrgencyColor(10)).toBe('#22c55e');
    });

    it('color amarillo para score medio (26-50)', () => {
      expect(getUrgencyColor(40)).toBe('#eab308');
    });

    it('color naranja para score alto (51-75)', () => {
      expect(getUrgencyColor(60)).toBe('#f97316');
    });

    it('color rojo para score crítico (76-100)', () => {
      expect(getUrgencyColor(90)).toBe('#ef4444');
    });

    it('etiqueta "Baja" para score 0-25', () => {
      expect(getUrgencyLabel(20)).toBe('Baja');
    });

    it('etiqueta "Crítica" para score 76-100', () => {
      expect(getUrgencyLabel(85)).toBe('Crítica');
    });
  });
});
