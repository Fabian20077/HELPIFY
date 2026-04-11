import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import type { User, Ticket, Department, Category } from '../../generated/prisma/client';

const COST_FACTOR = 10;

export async function cleanDb(): Promise<void> {
  await prisma.notification.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
}

export async function createDepartment(overrides: Partial<Department> = {}): Promise<Department> {
  return prisma.department.create({
    data: {
      name: `Dept-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description: 'Test department',
      ...overrides,
    },
  });
}

export async function createUser(
  role: 'customer' | 'agent' | 'admin',
  overrides: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'>> = {}
): Promise<User & { password: string }> {
  const rawPassword = `TestPass${Date.now()}`;
  const passwordHash = await bcrypt.hash(rawPassword, COST_FACTOR);

  const user = await prisma.user.create({
    data: {
      name: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`,
      passwordHash,
      role,
      isActive: true,
      ...overrides,
    },
  });

  return { ...user, password: rawPassword };
}

export async function createCategory(
  departmentId: string,
  overrides: Partial<Omit<Category, 'id' | 'departmentId' | 'createdAt' | 'updatedAt'>> = {}
): Promise<Category> {
  return prisma.category.create({
    data: {
      name: `Category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      color: '#6366f1',
      departmentId,
      ...overrides,
    },
  });
}

export async function createTicket(
  createdById: string,
  overrides: Partial<Omit<Ticket, 'id' | 'createdById' | 'createdAt' | 'updatedAt'>> = {}
): Promise<Ticket> {
  return prisma.ticket.create({
    data: {
      title: `Ticket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description: 'Test ticket description',
      status: 'open',
      priority: 'medium',
      createdById,
      ...overrides,
    },
  });
}

export async function createTicketWithHistory(
  ticketId: string,
  changedBy: string,
  entries: Array<{
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }>
): Promise<void> {
  for (const entry of entries) {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        changedBy,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
      },
    });
  }
}
