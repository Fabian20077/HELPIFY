import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { cleanDb, createUser, createDepartment } from '../helpers/seed';

describe('Auth', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/auth/login', () => {
    it('retorna JWT con credenciales válidas', async () => {
      const dept = await createDepartment();
      const { password } = await createUser('customer', { email: 'login@test.com', departmentId: dept.id });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.length).toBeGreaterThan(20);
    });

    it('retorna 401 con credenciales inválidas (password incorrecta)', async () => {
      const dept = await createDepartment();
      await createUser('customer', { email: 'badpw@test.com', departmentId: dept.id });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'badpw@test.com', password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('retorna 401 con cuenta desactivada', async () => {
      const dept = await createDepartment();
      const { password } = await createUser('agent', { email: 'inactive@test.com', isActive: false, departmentId: dept.id });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inactive@test.com', password });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('retorna 401 sin token de autenticación', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('retorna 401 con token malformado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(response.status).toBe(401);
    });

    it('retorna el usuario correcto con token válido', async () => {
      const dept = await createDepartment();
      const { password, ...user } = await createUser('agent', { email: 'me@test.com', name: 'Agent Me', departmentId: dept.id });

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'me@test.com', password });

      const token = login.body.data.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe('me@test.com');
      expect(response.body.data.name).toBe('Agent Me');
      expect(response.body.data.role).toBe('agent');
    });
  });

});
