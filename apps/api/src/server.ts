import app from './app';
import { config } from './config';
import { prisma } from './config/database';
import { logger } from './utils/logger';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Start server
    app.listen(config.PORT, () => {
      logger.info(`🚀 TalentIQ API running on port ${config.PORT}`);
      logger.info(`📝 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${config.PORT}/api/health`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
