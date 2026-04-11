// ============================================================================
// Helpify — Prisma Config (Prisma 7.x)
// Configura la conexión de BD para CLI (migraciones, seed, studio)
// ============================================================================

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Ubicación del schema
  schema: "prisma/schema.prisma",

  // Migraciones y seed
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  // Conexión a la base de datos
  datasource: {
    url: env("DATABASE_URL"),
  },
});
