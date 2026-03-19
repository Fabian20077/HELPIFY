// ============================================================================
// Helpify — Database Seed
// Sección 7.6 del Documento Técnico — Usuarios de prueba
// ============================================================================

import { UserRole } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';


async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ── Crear Departamentos ──────────────────────────────────────────────────
  const depTI = await prisma.department.upsert({
    where: { name: 'Tecnología' },
    update: {},
    create: {
      name: 'Tecnología',
      description: 'Departamento de soporte técnico y desarrollo',
    },
  });

  const depSoporte = await prisma.department.upsert({
    where: { name: 'Soporte General' },
    update: {},
    create: {
      name: 'Soporte General',
      description: 'Atención al cliente y soporte general',
    },
  });

  const depAdmin = await prisma.department.upsert({
    where: { name: 'Administración' },
    update: {},
    create: {
      name: 'Administración',
      description: 'Departamento administrativo',
    },
  });

  console.log('  ✅ Departamentos creados');

  // ── Crear Categorías ─────────────────────────────────────────────────────
  await prisma.category.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Error de Software', color: '#ef4444', departmentId: depTI.id },
      { name: 'Solicitud de Acceso', color: '#3b82f6', departmentId: depTI.id },
      { name: 'Problema de Red', color: '#f97316', departmentId: depTI.id },
      { name: 'Consulta General', color: '#22c55e', departmentId: depSoporte.id },
      { name: 'Queja', color: '#eab308', departmentId: depSoporte.id },
      { name: 'Facturación', color: '#8b5cf6', departmentId: depAdmin.id },
    ],
  });

  console.log('  ✅ Categorías creadas');

  // ── Crear Usuarios (Sección 7.6) ─────────────────────────────────────────
  const COST_FACTOR = 12;

  const users = [
    {
      name: 'Admin Sistema',
      email: 'admin@helpify.com',
      password: 'Admin123!',
      role: UserRole.admin,
      departmentId: depAdmin.id,
    },
    {
      name: 'Ana García',
      email: 'ana@helpify.com',
      password: 'Agent123!',
      role: UserRole.agent,
      departmentId: depTI.id,
    },
    {
      name: 'Carlos López',
      email: 'carlos@helpify.com',
      password: 'Agent123!',
      role: UserRole.agent,
      departmentId: depSoporte.id,
    },
    {
      name: 'María Rodríguez',
      email: 'maria@example.com',
      password: 'Customer123!',
      role: UserRole.customer,
      departmentId: null,
    },
    {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'Customer123!',
      role: UserRole.customer,
      departmentId: null,
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, COST_FACTOR);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  }

  console.log('  ✅ Usuarios creados');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Usuarios de prueba disponibles:                    ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  admin@helpify.com    | Admin123!  | admin          ║');
  console.log('║  ana@helpify.com      | Agent123!  | agent          ║');
  console.log('║  carlos@helpify.com   | Agent123!  | agent          ║');
  console.log('║  maria@example.com    | Customer123! | customer     ║');
  console.log('║  juan@example.com     | Customer123! | customer     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🌱 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
