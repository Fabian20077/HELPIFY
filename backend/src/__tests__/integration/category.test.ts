import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';

describe('Category Integration Tests', () => {
  let adminToken: string;
  let deptId: string;

  beforeAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    const dept = await prisma.department.create({
      data: { name: 'Category Dept' }
    });
    deptId = dept.id;

    const admin = await prisma.user.create({
      data: { name: 'Admin', email: 'admin@cat.com', passwordHash: 'pw', role: 'admin' }
    });
    adminToken = signToken({ id: admin.id, role: 'admin', departmentId: null });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debería permitir crear una categoría con color', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Critical Bugs',
        color: '#ff0000',
        departmentId: deptId
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Critical Bugs');
    expect(response.body.data.color).toBe('#ff0000');
  });

  it('debería listar las categorías del departamento', async () => {
    const response = await request(app)
      .get(`/api/categories?departmentId=${deptId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
