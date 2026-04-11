import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../utils/jwt';
import path from 'path';
import fs from 'fs';

describe('Attachment Integration Tests', () => {
  let customerToken: string;
  let customerId: string;
  let ticketId: string;
  let attachmentId: string;

  beforeAll(async () => {
    // Limpieza total en orden de dependencias
    await prisma.attachment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    const dept = await prisma.department.create({ data: { name: 'Assets Dept' } });
    
    const customer = await prisma.user.create({
      data: { name: 'User', email: 'assets@u.com', passwordHash: 'pw', role: 'customer' }
    });
    customerId = customer.id;
    customerToken = signToken({ id: customer.id, role: 'customer', departmentId: null });

    const ticket = await prisma.ticket.create({
      data: {
        title: 'Ticket with Files',
        description: 'Testing uploads',
        createdById: customerId,
        departmentId: dept.id
      }
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    // Limpiar archivos físicos creados por los tests
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (file.includes('test-file')) {
          fs.unlinkSync(path.join(uploadDir, file));
        }
      }
    }
    await prisma.$disconnect();
  });

  it('debería subir un archivo JPG válido', async () => {
    // Crear un buffer que parezca un JPG (Magic bytes: FF D8 FF)
    const jpgContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xEE, 0x01, 0x02, 0x03]);
    const filePath = path.join(__dirname, 'test-file.jpg');
    fs.writeFileSync(filePath, jpgContent);

    const response = await request(app)
      .post(`/api/attachments/ticket/${ticketId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', filePath);

    fs.unlinkSync(filePath); // Limpiar buffer temporal

    expect(response.status).toBe(201);
    expect(response.body.data.filename).toBe('test-file.jpg');
    attachmentId = response.body.data.id;
  });

  it('debería rechazar un archivo con extensión falsa (Magic Bytes Check)', async () => {
    // Un archivo .jpg que en realidad es un binario desconocido (o texto)
    const fakeFileContent = Buffer.from('Este no es un JPG real, es solo texto');
    const filePath = path.join(__dirname, 'test-fake.jpg');
    fs.writeFileSync(filePath, fakeFileContent);

    const response = await request(app)
      .post(`/api/attachments/ticket/${ticketId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', filePath);

    fs.unlinkSync(filePath);

    // Debería fallar por validación de Magic Bytes (bloqueado por seguridad)
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Archivo corrupto o sospechoso');
  });

  it('debería descargar un archivo adjunto', async () => {
    const response = await request(app)
      .get(`/api/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    // Verificar que enviamos un archivo (stream)
    expect(response.header['content-type']).toBeDefined();
  });

  it('debería permitir eliminar su propio adjunto', async () => {
    const response = await request(app)
      .delete(`/api/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(204);

    // Verificar que ya no existe en la BD
    const check = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    expect(check).toBeNull();
  });
});
