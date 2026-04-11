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

describe('Permissions', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Customer cannot change ticket status', () => {
    it('retorna 403 cuando customer intenta cambiar estado', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id });

      const token = await loginUser(customer.email, customer.password);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(403);
    });
  });

  describe('Customer cannot see another customer\'s ticket', () => {
    it('retorna 403 cuando customer intenta ver ticket de otro', async () => {
      const dept = await createDepartment();
      const other = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(other.id, { assignedToId: agent.id, departmentId: dept.id });

      const intruder = await createUser('customer', { departmentId: dept.id });
      const token = await loginUser(intruder.email, intruder.password);

      const res = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('customer puede ver su propio ticket', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });

      const token = await loginUser(customer.email, customer.password);

      const res = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(ticket.id);
    });
  });

  describe('Agent cannot delete tickets', () => {
    it('retorna 403 cuando agent intenta eliminar ticket', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });

      const token = await loginUser(agent.email, agent.password);

      const res = await request(app)
        .delete(`/api/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Customer cannot see internal comments', () => {
    it('internal comments no aparecen en respuesta para customer', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const category = await createCategory(dept.id);
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id, categoryId: category.id });

      await prisma.comment.createMany({
        data: [
          { ticketId: ticket.id, authorId: agent.id, body: 'Visible comment', isInternal: false },
          { ticketId: ticket.id, authorId: agent.id, body: 'Internal comment', isInternal: true },
        ],
      });

      const token = await loginUser(customer.email, customer.password);

      const res = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const comments = res.body.data.comments;
      expect(comments.length).toBe(1);
      expect(comments[0].body).toBe('Visible comment');
    });

    it('agent puede ver comentarios internos', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const category = await createCategory(dept.id);
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id, categoryId: category.id });

      await prisma.comment.createMany({
        data: [
          { ticketId: ticket.id, authorId: agent.id, body: 'Visible comment', isInternal: false },
          { ticketId: ticket.id, authorId: agent.id, body: 'Internal comment', isInternal: true },
        ],
      });

      const token = await loginUser(agent.email, agent.password);

      const res = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const comments = res.body.data.comments;
      expect(comments.length).toBe(2);
    });
  });

  describe('Admin can delete tickets', () => {
    it('admin elimina ticket → 204', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const admin = await createUser('admin', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });

      const token = await loginUser(admin.email, admin.password);

      const res = await request(app)
        .delete(`/api/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const deleted = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(deleted).toBeNull();
    });
  });
});
