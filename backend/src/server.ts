// ============================================================================
// Helpify — Server Entry Point
// Inicia el servidor Express y conecta a la base de datos
// ============================================================================

import app from './app';
import prisma from './lib/prisma';
import logger from './lib/logger';

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    logger.info('✅ Conectado a la base de datos MySQL');

    app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`🚀 Helpify Backend corriendo en http://0.0.0.0:${PORT}`);
      logger.info(`📋 Health check: http://0.0.0.0:${PORT}/api/health`);
      logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Apagando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Apagando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
