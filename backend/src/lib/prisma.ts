import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Extract database URL from the environment
const connectionString = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/helpify';

// Create the Prisma driver adapter passing the connection string directly
const adapter = new PrismaMariaDb(connectionString);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
