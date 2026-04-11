import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { cleanDb, createUser, createDepartment, createTicket } from '../helpers/seed';

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

async function changeStatus(ticketId: string, status: string, token: string) {
  return request(app)
    .patch(`/api/tickets/${ticketId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status });
}

async function setup(initialStatus = 'open') {
  const dept = await createDepartment();
  const customer = await createUser('customer', { departmentId: dept.id });
  const agent = await createUser('agent', { departmentId: dept.id });
  const data: any = { status: initialStatus, assignedToId: agent.id, departmentId: dept.id };
  if (initialStatus === 'resolved') data.resolvedAt = new Date();
  const ticket = await createTicket(customer.id, data);
  const token = await loginUser(agent.email, agent.password);
  return { dept, customer, agent, ticket, token };
}

describe('State Machine', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Transiciones válidas', () => {
    it('open → in_progress', async () => {
      const { ticket, token } = await setup();
      const res = await changeStatus(ticket.id, 'in_progress', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('open → closed', async () => {
      const { ticket, token } = await setup();
      const res = await changeStatus(ticket.id, 'closed', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
    });

    it('in_progress → waiting', async () => {
      const { ticket, token } = await setup('in_progress');
      const res = await changeStatus(ticket.id, 'waiting', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('waiting');
    });

    it('in_progress → resolved', async () => {
      const { ticket, token } = await setup('in_progress');
      const res = await changeStatus(ticket.id, 'resolved', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
      expect(new Date(res.body.data.resolvedAt)).toBeInstanceOf(Date);
    });

    it('in_progress → closed', async () => {
      const { ticket, token } = await setup('in_progress');
      const res = await changeStatus(ticket.id, 'closed', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
    });

    it('waiting → in_progress', async () => {
      const { ticket, token } = await setup('waiting');
      const res = await changeStatus(ticket.id, 'in_progress', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('waiting → resolved', async () => {
      const { ticket, token } = await setup('waiting');
      const res = await changeStatus(ticket.id, 'resolved', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
    });

    it('waiting → closed', async () => {
      const { ticket, token } = await setup('waiting');
      const res = await changeStatus(ticket.id, 'closed', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
    });

    it('resolved → in_progress (reapertura)', async () => {
      const { ticket, token } = await setup('resolved');
      const res = await changeStatus(ticket.id, 'in_progress', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('resolved → closed', async () => {
      const { ticket, token } = await setup('resolved');
      const res = await changeStatus(ticket.id, 'closed', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
    });
  });

  describe('Transiciones inválidas', () => {
    it('open → in_progress ya hecho → no se permite', async () => {
      const { ticket, token } = await setup('in_progress');
      const res = await changeStatus(ticket.id, 'in_progress', token);
      expect(res.status).toBe(400);
    });

    it('open → resolved no es válida', async () => {
      const { ticket, token } = await setup();
      const res = await changeStatus(ticket.id, 'resolved', token);
      expect(res.status).toBe(400);
    });

    it('in_progress → open no es válida', async () => {
      const { ticket, token } = await setup('in_progress');
      const res = await changeStatus(ticket.id, 'open', token);
      expect(res.status).toBe(400);
    });

    it('waiting → open no es válida', async () => {
      const { ticket, token } = await setup('waiting');
      const res = await changeStatus(ticket.id, 'open', token);
      expect(res.status).toBe(400);
    });

    it('resolved → open no es válida', async () => {
      const { ticket, token } = await setup('resolved');
      const res = await changeStatus(ticket.id, 'open', token);
      expect(res.status).toBe(400);
    });

    it('resolved → waiting no es válida', async () => {
      const { ticket, token } = await setup('resolved');
      const res = await changeStatus(ticket.id, 'waiting', token);
      expect(res.status).toBe(400);
    });
  });

  describe('Estado terminal: closed', () => {
    it('closed → cualquier estado retorna 400', async () => {
      const { ticket, token } = await setup('closed');
      const targets = ['open', 'in_progress', 'waiting', 'resolved'];
      for (const target of targets) {
        const res = await changeStatus(ticket.id, target, token);
        expect(res.status).toBe(400);
      }
    });
  });

  describe('Reapertura limpia resolvedAt', () => {
    it('resolved → in_progress limpia resolvedAt', async () => {
      const { ticket, token } = await setup('resolved');
      const before = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(before!.resolvedAt).not.toBeNull();

      const res = await changeStatus(ticket.id, 'in_progress', token);
      expect(res.status).toBe(200);

      const after = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(after!.resolvedAt).toBeNull();
    });
  });
});
