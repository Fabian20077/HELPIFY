import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';

describe('Notification Integration Tests', () => {
  let customerToken: string;
  let customerId: string;
  let notificationId: string;

  beforeAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();

    const customer = await prisma.user.create({
      data: { name: 'Cust', email: 'notif@u.com', passwordHash: 'pw', role: 'customer' }
    });
    customerId = customer.id;
    customerToken = signToken({ id: customer.id, role: 'customer', departmentId: null });

    // Crear un ticket para la notificación
    const dept = await prisma.department.create({ data: { name: 'Notif Dept' } });
    const ticket = await prisma.ticket.create({
      data: {
        title: 'Test Ticket',
        description: 'Test',
        createdById: customerId,
        departmentId: dept.id
      }
    });

    // Crear notificación manual
    const notif = await prisma.notification.create({
      data: {
        userId: customerId,
        ticketId: ticket.id,
        type: 'status_changed',
        message: 'Your ticket status has changed'
      }
    });
    notificationId = notif.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debería listar mis notificaciones', async () => {
    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].message).toContain('status has changed');
  });

  it('debería marcar una notificación como leída', async () => {
    const response = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isRead).toBe(true);
  });
});
