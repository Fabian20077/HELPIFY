import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';

describe('Department Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    // Limpiar BD en orden correcto de dependencias
    await prisma.ticketHistory.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    // Crear usuarios de prueba
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin-test@helpify.com',
        passwordHash: 'fake-hash',
        role: 'admin',
      },
    });

    const customer = await prisma.user.create({
      data: {
        name: 'Customer',
        email: 'cust-test@helpify.com',
        passwordHash: 'fake-hash',
        role: 'customer',
      },
    });

    adminToken = signToken({ id: admin.id, role: 'admin', departmentId: null });
    customerToken = signToken({ id: customer.id, role: 'customer', departmentId: null });
  });

  afterAll(async () => {
    await prisma.ticketHistory.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/departments', () => {
    it('debería permitir a un ADMIN crear un departamento', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'IT Support',
          description: 'Technical support department',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('IT Support');
    });

    it('debería denegar el acceso a un CUSTOMER para crear departamentos', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Illegal Dept',
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('debería fallar si falta el nombre (Zod)', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'No name here',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/departments', () => {
    it('debería listar los departamentos para cualquier usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
