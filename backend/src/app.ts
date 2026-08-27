import express, { Express } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { healthRouter } from './routes/health';
import { catalogRouter } from './routes/catalog';
import { promotionsRouter } from './routes/promotions';
import { PromotionService } from './services/promotion.service';

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  const promotionService = new PromotionService(prisma);

  app.use(cors());
  app.use(express.json());

  app.use(healthRouter(prisma));
  app.use('/api', catalogRouter(prisma));
  app.use('/api', promotionsRouter(promotionService));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
  });

  return app;
}
