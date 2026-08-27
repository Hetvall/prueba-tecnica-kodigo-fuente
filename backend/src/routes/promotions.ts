import { Router } from 'express';
import { ValidationError } from '../domain/validation';
import { ConflictError, NotFoundError, PromotionService } from '../services/promotion.service';

function handleError(error: unknown, res: import('express').Response): void {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof ConflictError) {
    res.status(409).json({ error: error.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
}

export function promotionsRouter(service: PromotionService): Router {
  const router = Router();

  router.get('/promotions', async (_req, res) => {
    const promotions = await service.list();
    res.json(promotions);
  });

  router.get('/promotions/summary', async (_req, res) => {
    const summary = await service.summary();
    res.json(summary);
  });

  router.post('/promotions', async (req, res) => {
    try {
      const promotion = await service.create(req.body);
      res.status(201).json(promotion);
    } catch (error) {
      handleError(error, res);
    }
  });

  router.patch('/promotions/:id/status', async (req, res) => {
    try {
      const promotion = await service.changeStatus(req.params.id, req.body?.status);
      res.json(promotion);
    } catch (error) {
      handleError(error, res);
    }
  });

  router.delete('/promotions/:id', async (req, res) => {
    try {
      await service.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
}
