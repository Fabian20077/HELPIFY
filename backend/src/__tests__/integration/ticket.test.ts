import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';

describe('Ticket Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;
  let agentToken: string;
  let deptId: string;
  let catId: string;
  let customerId: string;

  beforeAll(async () => {
    // Limpieza profunda de la BD de test
    await prisma.ticketHistory.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    // Setup base
    const dept = await prisma.department.create({
      data: { name: 'Support', description: 'Main support' },
    });
    deptId = dept.id;

    const cat = await prisma.category.create({
      data: { name: 'Technical', departmentId: deptId },
    });
    catId = cat.id;

    const admin = await prisma.user.create({
      data: { name: 'Admin', email: 'admin@t.com', passwordHash: 'pw', role: 'admin' },
    });
    const agent = await prisma.user.create({
      data: { name: 'Agent', email: 'agent@t.com', passwordHash: 'pw', role: 'agent', departmentId: deptId },
    });
    const customer = await prisma.user.create({
      data: { name: 'Cust', email: 'cust@t.com', passwordHash: 'pw', role: 'customer' },
    });
    customerId = customer.id;

    adminToken = signToken({ id: admin.id, role: 'admin', departmentId: null });
    agentToken = signToken({ id: agent.id, role: 'agent', departmentId: deptId });
    customerToken = signToken({ id: customer.id, role: 'customer', departmentId: null });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Workflows de Tickets', () => {
    let ticketId: string;

    it('un cliente debería crear un ticket exitosamente', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'My PC is broken',
          description: 'It does not turn on since this morning',
          departmentId: deptId,
          categoryId: catId,
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('open');
      ticketId = response.body.data.id;
    });

    it('un agente debería ver el ticket con su score de urgencia', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      const ticket = response.body.data.find((t: any) => t.id === ticketId);
      expect(ticket).toBeDefined();
      expect(ticket.urgencyScore).toBeDefined();
    });

    it('un agente debería poder cambiar el estado a in_progress', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('un cliente NO debería poder cambiar el estado directamente (RBAC)', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'resolved' });

      expect(response.status).toBe(403);
    });

    it('un agente debería poder agregar una nota interna invisible para el cliente', async () => {
      // Nota interna por el agente
      await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ body: 'This customer seems angry', isInternal: true });

      // Ver como agente (debe verla)
      const resAgent = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      
      expect(resAgent.body.data.comments.some((c: any) => c.isInternal)).toBe(true);

      // Ver como cliente (NO debe verla)
      const resCust = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(resCust.body.data.comments.some((c: any) => c.isInternal)).toBe(false);
    });

    it('debería registrar el historial de cambios correctamente', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.history.length).toBeGreaterThan(0);
      expect(response.body.data.history[0].fieldName).toBe('status');
    });
  });
});
