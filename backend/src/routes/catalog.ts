import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export function catalogRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/categories', async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  });

  router.get('/products', async (_req, res) => {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  });

  return router;
}
