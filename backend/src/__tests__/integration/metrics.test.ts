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

describe('Metrics - Group 6', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Authentication', () => {
    it('GET /api/metrics sin token retorna 401', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(401);
    });
  });

  describe('Customer receives only their own data', () => {
    it('customer con 2 tickets tiene total=2 y byStatus.open=2', async () => {
      const dept = await createDepartment();
      const { email, password, id: customerId } = await createUser('customer', { departmentId: dept.id });
      const token = await loginUser(email, password);

      const t1 = await createTicket(customerId, { status: 'open', departmentId: dept.id });
      const t2 = await createTicket(customerId, { status: 'open', departmentId: dept.id });

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.byStatus.open).toBe(2);
      expect(res.body.data.byStatus.in_progress).toBe(0);
      expect(res.body.data.byStatus.resolved).toBe(0);
      expect(res.body.data.byStatus.closed).toBe(0);
      expect(res.body.data.byStatus.waiting).toBe(0);
    });

    it('customer no ve tickets de otros customers', async () => {
      const dept = await createDepartment();
      const { email, password, id: myId } = await createUser('customer', { departmentId: dept.id });
      const other = await createUser('customer', { departmentId: dept.id });
      const token = await loginUser(email, password);

      await createTicket(myId, { departmentId: dept.id });
      await createTicket(myId, { departmentId: dept.id });
      await createTicket(other.id, { departmentId: dept.id });
      await createTicket(other.id, { departmentId: dept.id });

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
    });

    it('customer con tickets en distintos statuses tiene conteos exactos', async () => {
      const dept = await createDepartment();
      const { email, password, id } = await createUser('customer', { departmentId: dept.id });
      const token = await loginUser(email, password);

      await createTicket(id, { status: 'open', departmentId: dept.id });
      await createTicket(id, { status: 'in_progress', departmentId: dept.id });
      await createTicket(id, { status: 'resolved', departmentId: dept.id });
      await createTicket(id, { status: 'closed', departmentId: dept.id });

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.byStatus.open).toBe(1);
      expect(res.body.data.byStatus.in_progress).toBe(1);
      expect(res.body.data.byStatus.resolved).toBe(1);
      expect(res.body.data.byStatus.closed).toBe(1);
    });
  });

  describe('Agent receives assigned tickets data', () => {
    it('agent con 3 tickets asignados tiene totalAssigned=3', async () => {
      const dept = await createDepartment();
      const c1 = await createUser('customer', { departmentId: dept.id });
      const c2 = await createUser('customer', { departmentId: dept.id });
      const { email, password, id: agentId } = await createUser('agent', { departmentId: dept.id });
      const token = await loginUser(email, password);

      await createTicket(c1.id, { assignedToId: agentId, departmentId: dept.id });
      await createTicket(c1.id, { assignedToId: agentId, departmentId: dept.id });
      await createTicket(c2.id, { assignedToId: agentId, departmentId: dept.id });

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAssigned).toBe(3);
      expect(res.body.data.byStatus.open).toBe(3);
    });

    it('agent no recibe tickets de otros agentes', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const { email, password, id: myId } = await createUser('agent', { departmentId: dept.id });
      const other = await createUser('agent', { departmentId: dept.id });
      const token = await loginUser(email, password);

      await createTicket(customer.id, { assignedToId: myId, departmentId: dept.id });
      await createTicket(customer.id, { assignedToId: other.id, departmentId: dept.id });

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAssigned).toBe(1);
    });

    it('agent sin tickets asignados tiene totalAssigned=0', async () => {
      const dept = await createDepartment();
      const { email, password } = await createUser('agent', { departmentId: dept.id });
      const token = await loginUser(email, password);

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAssigned).toBe(0);
    });
  });

  describe('Admin receives global metrics', () => {
    it('admin ve total de TODOS los tickets del sistema', async () => {
      const dept = await createDepartment();
      const c1 = await createUser('customer', { departmentId: dept.id });
      const c2 = await createUser('customer', { departmentId: dept.id });
      const a1 = await createUser('agent', { departmentId: dept.id });
      const a2 = await createUser('agent', { departmentId: dept.id });
      await createUser('admin', { departmentId: dept.id });

      await createTicket(c1.id, { departmentId: dept.id });
      await createTicket(c1.id, { departmentId: dept.id });
      await createTicket(c2.id, { departmentId: dept.id });
      await createTicket(a1.id, { departmentId: dept.id });
      await createTicket(a2.id, { departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(5);
    });

    it('admin con tickets sin asignar tiene unassigned > 0', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });

      await createTicket(customer.id, { departmentId: dept.id });
      await createTicket(customer.id, { departmentId: dept.id, assignedToId: agent.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.unassigned).toBe(1);
    });

    it('admin con tickets resueltos tiene avgResolutionHours mayor a 0', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });

      const t1 = await createTicket(customer.id, { status: 'resolved', departmentId: dept.id });
      const t2 = await createTicket(customer.id, { status: 'resolved', departmentId: dept.id });

      const fresh1 = await prisma.ticket.findUnique({ where: { id: t1.id } });
      const fresh2 = await prisma.ticket.findUnique({ where: { id: t2.id } });
      await prisma.ticket.update({
        where: { id: t1.id },
        data: { resolvedAt: new Date(fresh1!.createdAt.getTime() + 2 * 60 * 60 * 1000) },
      });
      await prisma.ticket.update({
        where: { id: t2.id },
        data: { resolvedAt: new Date(fresh2!.createdAt.getTime() + 4 * 60 * 60 * 1000) },
      });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.resolvedCount).toBe(2);
      expect(res.body.data.avgResolutionHours).toBeGreaterThan(0);
    });

    it('admin sin tickets resueltos tiene avgResolutionHours=0', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      await createTicket(customer.id, { status: 'open', departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.resolvedCount).toBe(0);
      expect(res.body.data.avgResolutionHours).toBe(0);
    });

    it('admin recibe conteos por status exactos', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });

      await createTicket(customer.id, { status: 'open', departmentId: dept.id });
      await createTicket(customer.id, { status: 'open', departmentId: dept.id });
      await createTicket(customer.id, { status: 'resolved', departmentId: dept.id });
      await createTicket(customer.id, { status: 'closed', departmentId: dept.id });

      const admin = await createUser('admin', { departmentId: dept.id });
      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.byStatus.open).toBe(2);
      expect(res.body.data.byStatus.resolved).toBe(1);
      expect(res.body.data.byStatus.closed).toBe(1);
    });
  });
});
