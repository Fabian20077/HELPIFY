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

describe('Ticket Creation & Listing', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Customer crea ticket → aparece en su lista', () => {
    it('el ticket creado por customer aparece en GET /api/tickets', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Mi ticket', description: 'Descripción', departmentId: dept.id });

      expect(createRes.status).toBe(201);
      const ticketId = createRes.body.data.id;

      const listRes = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      const ids = listRes.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticketId);
    });
  });

  describe('Customer no ve tickets de otros', () => {
    it('customer no ve tickets de otro customer', async () => {
      const dept = await createDepartment();
      const other = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(other.id, { departmentId: dept.id });

      const intruder = await createUser('customer', { departmentId: dept.id });
      const token = await loginUser(intruder.email, intruder.password);

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).not.toContain(ticket.id);
    });
  });

  describe('Admin ve todos los tickets', () => {
    it('admin ve tickets de cualquier customer', async () => {
      const dept = await createDepartment();
      const c1 = await createUser('customer', { departmentId: dept.id });
      const c2 = await createUser('customer', { departmentId: dept.id });
      const t1 = await createTicket(c1.id, { departmentId: dept.id });
      const t2 = await createTicket(c2.id, { departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(t1.id);
      expect(ids).toContain(t2.id);
    });
  });

  describe('Filtro por status funciona', () => {
    it('?status=open filtra correctamente', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const open = await createTicket(customer.id, { status: 'open', departmentId: dept.id });
      await createTicket(customer.id, { status: 'closed', departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const tickets = res.body.data;
      expect(tickets.every((t: any) => t.status === 'open')).toBe(true);
      expect(tickets.map((t: any) => t.id)).toContain(open.id);
    });

    it('?status=resolved filtra correctamente', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      await createTicket(customer.id, { status: 'open', departmentId: dept.id });
      const resolved = await createTicket(customer.id, { status: 'resolved', departmentId: dept.id, resolvedAt: new Date() });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/tickets?status=resolved')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const tickets = res.body.data;
      expect(tickets.every((t: any) => t.status === 'resolved')).toBe(true);
      expect(tickets.map((t: any) => t.id)).toContain(resolved.id);
    });

    it('?status=closed filtra correctamente', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const closed = await createTicket(customer.id, { status: 'closed', departmentId: dept.id });
      await createTicket(customer.id, { status: 'open', departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/tickets?status=closed')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const tickets = res.body.data;
      expect(tickets.every((t: any) => t.status === 'closed')).toBe(true);
      expect(tickets.map((t: any) => t.id)).toContain(closed.id);
    });
  });

  describe('Filtro por priority funciona', () => {
    it('?priority=high filtra correctamente', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const high = await createTicket(customer.id, { priority: 'high', departmentId: dept.id });
      await createTicket(customer.id, { priority: 'low', departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/tickets?priority=high')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const tickets = res.body.data;
      expect(tickets.every((t: any) => t.priority === 'high')).toBe(true);
      expect(tickets.map((t: any) => t.id)).toContain(high.id);
    });
  });
});
