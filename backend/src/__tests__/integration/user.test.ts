import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';

describe('User Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Limpieza
    await prisma.ticketHistory.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
      data: { name: 'Admin', email: 'admin@u.com', passwordHash: 'pw', role: 'admin' },
    });
    const customer = await prisma.user.create({
      data: { name: 'Cust', email: 'cust@u.com', passwordHash: 'pw', role: 'customer' },
    });
    testUserId = customer.id;

    adminToken = signToken({ id: admin.id, role: 'admin', departmentId: null });
    customerToken = signToken({ id: customer.id, role: 'customer', departmentId: null });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/users/me', () => {
    it('debería retornar el perfil del usuario actual', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('cust@u.com');
    });
  });

  describe('GET /api/users (Admin Only)', () => {
    it('un admin debería poder listar todos los usuarios', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results).toBeGreaterThanOrEqual(2);
    });

    it('un customer NO debería poder listar usuarios', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id (Admin Only)', () => {
    it('un admin debería poder cambiar el rol de un usuario', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'agent' });

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('agent');
    });
  });
});
