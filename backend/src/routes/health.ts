import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export function healthRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', database: 'up' });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        database: 'down',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  });

  return router;
}
