import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { cleanDb, createUser, createDepartment, createTicket } from '../helpers/seed';
import os from 'os';
import path from 'path';
import fs from 'fs';

let tmpDir: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

function tmpFile(name: string, content: Buffer): string {
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('Attachments - Group 5', () => {
  beforeAll(() => {
    tmpDir = os.tmpdir();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  describe('Upload to own ticket', () => {
    it('JPG válido con magic bytes correctos retorna 201 y metadatos correctos', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const jpgContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xEE, 0x01, 0x02, 0x03]);
      const filePath = tmpFile('photo.jpg', jpgContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.filename).toBe('photo.jpg');
      expect(res.body.data.mimeType).toBe('image/jpeg');
      expect(res.body.data.ticketId).toBe(ticket.id);
    });

    it('PNG válido retorna 201', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const pngContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const filePath = tmpFile('diagram.png', pngContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(201);
      expect(res.body.data.mimeType).toBe('image/png');
    });

    it('PDF válido retorna 201', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const pdfContent = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const filePath = tmpFile('document.pdf', pdfContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(201);
      expect(res.body.data.mimeType).toBe('application/pdf');
    });
  });

  describe('File size limit', () => {
    it('archivo mayor a 10MB retorna 413', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const largeContent = Buffer.alloc(11 * 1024 * 1024, 0x42);
      const filePath = tmpFile('large.jpg', largeContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(413);
    }, 30000);
  });

  describe('MIME type validation', () => {
    it('contenido sin magic bytes reconocidos retorna 400', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const textContent = Buffer.from('Este es solo texto plano, no es un archivo real');
      const filePath = tmpFile('file.jpg', textContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(400);
    });

    it('EXE renombrado como PDF retorna 400 (magic bytes MZ = 4D5A)', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const exeContent = Buffer.from([
        0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
        0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
      ]);
      const filePath = tmpFile('document.pdf', exeContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(400);
    });

    it('extensión no permitida retorna 400', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { departmentId: dept.id });
      const token = await loginUser(customer.email, customer.password);

      const content = Buffer.from([0xFF, 0xD8, 0xFF, 0xEE]);
      const filePath = tmpFile('script.exe', content);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(400);
    });
  });

  describe('Authentication and authorization', () => {
    it('sin token retorna 401', async () => {
      const res = await request(app)
        .post('/api/attachments/ticket/00000000-0000-0000-0000-000000000000')
        .field('file', 'fake');

      expect(res.status).toBe(401);
    });

    it('customer sube a ticket de otro retorna 403', async () => {
      const dept = await createDepartment();
      const owner = await createUser('customer', { departmentId: dept.id });
      const intruder = await createUser('customer', { departmentId: dept.id });
      const ticket = await createTicket(owner.id, { departmentId: dept.id });
      const token = await loginUser(intruder.email, intruder.password);

      const jpgContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xEE]);
      const filePath = tmpFile('photo.jpg', jpgContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(403);
    });

    it('agent puede subir a ticket asignado aunque no sea owner', async () => {
      const dept = await createDepartment();
      const customer = await createUser('customer', { departmentId: dept.id });
      const agent = await createUser('agent', { departmentId: dept.id });
      const ticket = await createTicket(customer.id, { assignedToId: agent.id, departmentId: dept.id });
      const token = await loginUser(agent.email, agent.password);

      const jpgContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xEE]);
      const filePath = tmpFile('photo.jpg', jpgContent);

      const res = await request(app)
        .post(`/api/attachments/ticket/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath);

      expect(res.status).toBe(201);
    });
  });
});
