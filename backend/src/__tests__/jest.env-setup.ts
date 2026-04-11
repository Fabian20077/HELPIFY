// Este archivo corre con `setupFiles` (ANTES de que cualquier módulo sea importado),
// lo que garantiza que DATABASE_URL apunte a la BD de test ANTES de que Prisma
// inicialice el singleton del cliente con la conexión del .env de desarrollo.
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });
