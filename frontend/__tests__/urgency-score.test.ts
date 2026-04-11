import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { computeUrgencyScore, sortByUrgency, getUrgencyColor } from '@/lib/urgency';
import type { Ticket } from '@/lib/types';

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'test-1',
    title: 'Test Ticket',
    description: 'Description',
    status: 'open',
    priority: 'medium',
    createdById: 'user-1',
    assignedToId: null,
    departmentId: null,
    categoryId: null,
    dueDate: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString(),
    history: [],
    comments: [],
    attachments: [],
    observers: [],
    ...overrides,
  } as Ticket;
}

describe('computeUrgencyScore', () => {
  it('returns 0 for a fresh ticket with no history', () => {
    const ticket = makeTicket({
      createdAt: new Date().toISOString(),
      history: [],
    });
    const score = computeUrgencyScore(ticket);
    expect(score).toBe(0);
  });

  it('increases score based on hours without activity', () => {
    const ticket = makeTicket({
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      history: [],
    });
    const score = computeUrgencyScore(ticket);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('increases score for reopened tickets', () => {
    const ticket = makeTicket({
      history: [
        { id: 'h1', ticketId: 't1', changedBy: 'agent-1', fieldName: 'status', oldValue: 'resolved', newValue: 'in_progress', changedAt: new Date().toISOString() } as any,
        { id: 'h2', ticketId: 't1', changedBy: 'agent-1', fieldName: 'status', oldValue: 'resolved', newValue: 'in_progress', changedAt: new Date().toISOString() } as any,
      ],
      createdAt: new Date().toISOString(),
    });
    const score = computeUrgencyScore(ticket);
    expect(score).toBeGreaterThanOrEqual(20); // 2 reopenings = 20 points
  });

  it('caps score at 100', () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const ticket = makeTicket({
      createdAt: oldDate,
      history: [
        { id: 'h1', ticketId: 't1', changedBy: 'agent-1', fieldName: 'status', oldValue: 'resolved', newValue: 'in_progress', changedAt: new Date().toISOString() } as any,
        { id: 'h2', ticketId: 't1', changedBy: 'agent-1', fieldName: 'status', oldValue: 'resolved', newValue: 'in_progress', changedAt: new Date().toISOString() } as any,
        { id: 'h3', ticketId: 't1', changedBy: 'agent-1', fieldName: 'status', oldValue: 'resolved', newValue: 'in_progress', changedAt: new Date().toISOString() } as any,
      ],
    });
    const score = computeUrgencyScore(ticket);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('sortByUrgency', () => {
  it('sorts tickets by urgency score descending', () => {
    const tickets = [
      makeTicket({ id: '1', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }),
      makeTicket({ id: '2', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }),
      makeTicket({ id: '3', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }),
    ];
    const sorted = sortByUrgency(tickets);
    expect(sorted[0].id).toBe('2'); // oldest first = highest urgency
  });
});

describe('getUrgencyColor', () => {
  it('returns red for high urgency', () => {
    expect(getUrgencyColor(80)).toBe('text-red-500');
  });
  it('returns amber for medium urgency', () => {
    expect(getUrgencyColor(50)).toBe('text-amber-500');
  });
  it('returns green for low urgency', () => {
    expect(getUrgencyColor(10)).toBe('text-green-500');
  });
});
