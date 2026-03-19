import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Auth Integration Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    // Limpiar usuarios de prueba y sus dependencias
    const users = await prisma.user.findMany({ where: { email: testUser.email } });
    const userIds = users.map(u => u.id);
    await prisma.ticketHistory.deleteMany({ where: { changedBy: { in: userIds } } });
    await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.ticket.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({ where: { email: testUser.email } });
    const userIds = users.map(u => u.id);
    await prisma.ticketHistory.deleteMany({ where: { changedBy: { in: userIds } } });
    await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.ticket.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('debería fallar si el email ya existe', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('ya está registrado');
    });

    it('debería fallar si el email es inválido (Zod validation)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión exitosamente con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
    });

    it('debería fallar con una contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
});
