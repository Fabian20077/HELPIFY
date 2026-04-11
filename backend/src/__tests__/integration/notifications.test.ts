import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { cleanDb, createUser, createDepartment, createTicket, createCategory } from '../helpers/seed';

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

async function getNotifications(token: string) {
  return request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${token}`);
}

describe('Notifications - Group 7', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Authentication', () => {
    it('GET /api/notifications sin token retorna 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('User only sees their own notifications', () => {
    it('usuario A no ve notificaciones del usuario B', async () => {
      const dept = await createDepartment();
      const userA = await createUser('customer', { departmentId: dept.id });
      const userB = await createUser('customer', { departmentId: dept.id });
      const ticketA = await createTicket(userA.id, { departmentId: dept.id });
      const ticketB = await createTicket(userB.id, { departmentId: dept.id });

      await prisma.notification.create({
        data: { userId: userA.id, ticketId: ticketA.id, type: 'ticket_assigned', message: 'Notificación de A' }
      });
      await prisma.notification.create({
        data: { userId: userB.id, ticketId: ticketB.id, type: 'ticket_assigned', message: 'Notificación de B' }
      });

      const tokenA = await loginUser(userA.email, userA.password);
      const res = await getNotifications(tokenA);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data[0].message).toBe('Notificación de A');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('marca notificación como leída y retorna 200', async () => {
      const dept = await createDepartment();
      const user = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(user.id, { departmentId: dept.id });
      const token = await loginUser(user.email, user.password);

      const notif = await prisma.notification.create({
        data: { userId: user.id, ticketId: ticket.id, type: 'ticket_assigned', message: 'Test', isRead: false }
      });

      const res = await request(app)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);

      const updated = await prisma.notification.findUnique({ where: { id: notif.id } });
      expect(updated!.isRead).toBe(true);
    });

    it('usuario no puede marcar notificación de otro como leída', async () => {
      const dept = await createDepartment();
      const userA = await createUser('customer', { departmentId: dept.id });
      const userB = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(userA.id, { departmentId: dept.id });

      const notif = await prisma.notification.create({
        data: { userId: userA.id, ticketId: ticket.id, type: 'ticket_assigned', message: 'Test', isRead: false }
      });

      const tokenB = await loginUser(userB.email, userB.password);

      const res = await request(app)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('marca todas las notificaciones como leídas', async () => {
      const dept = await createDepartment();
      const user = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(user.id, { departmentId: dept.id });
      const token = await loginUser(user.email, user.password);

      await prisma.notification.createMany({
        data: [
          { userId: user.id, ticketId: ticket.id, type: 'ticket_assigned', message: 'N1', isRead: false },
          { userId: user.id, ticketId: ticket.id, type: 'ticket_assigned', message: 'N2', isRead: false },
          { userId: user.id, ticketId: ticket.id, type: 'ticket_assigned', message: 'N3', isRead: false },
        ]
      });

      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('leídas');

      const unread = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
      expect(unread).toBe(0);
    });
  });

  describe('Assignment generates notification', () => {
    it('PATCH /api/tickets/:id/assign genera notificación al agente asignado', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });

      const tokenAgent = await loginUser(agent.email, agent.password);
      const beforeAgent = (await getNotifications(tokenAgent)).body.results;

      const assignRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/assign`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .send({ assignedToId: agent.id });

      expect(assignRes.status).toBe(200);

      const afterAgent = (await getNotifications(tokenAgent)).body;
      expect(afterAgent.results).toBe(beforeAgent + 1);
      expect(afterAgent.data[0].type).toBe('ticket_assigned');
    });
  });

  describe('Status change generates notifications', () => {
    it('PATCH /api/tickets/:id/status genera notificación al creador (agente no se notifica a sí mismo)', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id });

      const tokenAgent = await loginUser(agent.email, agent.password);
      const tokenCustomer = await loginUser(customer.email, customer.password);

      const beforeAgent = (await getNotifications(tokenAgent)).body.results;
      const beforeCustomer = (await getNotifications(tokenCustomer)).body.results;

      const statusRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .send({ status: 'in_progress' });

      expect(statusRes.status).toBe(200);

      const afterAgent = (await getNotifications(tokenAgent)).body;
      const afterCustomer = (await getNotifications(tokenCustomer)).body;

      expect(afterAgent.results).toBe(beforeAgent);
      expect(afterCustomer.results).toBe(beforeCustomer + 1);
    });

    it('el agente que cambia el estado NO se notifica a sí mismo por ese cambio', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id });

      const tokenAgent = await loginUser(agent.email, agent.password);
      const beforeAgent = (await getNotifications(tokenAgent)).body.results;

      await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .send({ status: 'in_progress' });

      const afterAgent = (await getNotifications(tokenAgent)).body;
      expect(afterAgent.results).toBe(beforeAgent);
    });
  });

  describe('Comment generates notification', () => {
    it('POST /api/tickets/:id/comments genera notificación al creador del ticket', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const category = await createCategory(dept.id);
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id, categoryId: category.id });

      const tokenAgent = await loginUser(agent.email, agent.password);
      const tokenCustomer = await loginUser(customer.email, customer.password);
      const beforeCustomer = (await getNotifications(tokenCustomer)).body.results;

      const commentRes = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .send({ body: 'Esto es una respuesta', isInternal: false });

      expect(commentRes.status).toBe(201);

      const afterCustomer = (await getNotifications(tokenCustomer)).body;
      expect(afterCustomer.results).toBe(beforeCustomer + 1);
      expect(afterCustomer.data[0].type).toBe('commented');
    });

    it('el autor del comentario NO se notifica a sí mismo', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const category = await createCategory(dept.id);
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id, categoryId: category.id });

      const tokenAgent = await loginUser(agent.email, agent.password);
      const beforeAgent = (await getNotifications(tokenAgent)).body.results;

      await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .send({ body: 'Mi propio comentario', isInternal: false });

      const afterAgent = (await getNotifications(tokenAgent)).body;
      expect(afterAgent.results).toBe(beforeAgent);
    });

    it('comentario interno no genera notificación', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const category = await createCategory(dept.id);
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id, categoryId: category.id });

      const tokenAgent = await loginUser(agent.email, agent.password);
      const tokenCustomer = await loginUser(customer.email, customer.password);
      const beforeCustomer = (await getNotifications(tokenCustomer)).body.results;

      await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .send({ body: 'Nota interna', isInternal: true });

      const afterCustomer = (await getNotifications(tokenCustomer)).body;
      expect(afterCustomer.results).toBe(beforeCustomer);
    });
  });
});
