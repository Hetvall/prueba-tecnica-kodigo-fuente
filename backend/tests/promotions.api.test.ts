import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

/**
 * Pruebas de integración contra una base de datos real (definida por DATABASE_URL).
 * Se ejecutan en CI contra un contenedor de PostgreSQL de servicio.
 * Si no hay base de datos disponible localmente, omite este archivo.
 */
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)('API de promociones', () => {
  let app: Express;
  let prisma: PrismaClient;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.promotion.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    const category = await prisma.category.create({ data: { name: 'Categoría Test' } });
    categoryId = category.id;
    const product = await prisma.product.create({
      data: { name: 'Producto Test', categoryId },
    });
    productId = product.id;
  });

  it('GET /health responde 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('crea una promoción válida', async () => {
    const response = await request(app).post('/api/promotions').send({
      name: 'Promo Producto',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      productId,
    });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('SCHEDULED');
  });

  it('rechaza crear promoción sin nombre', async () => {
    const response = await request(app).post('/api/promotions').send({
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      productId,
    });
    expect(response.status).toBe(400);
  });

  it('lista promociones', async () => {
    await request(app).post('/api/promotions').send({
      name: 'Promo Categoría',
      discountType: 'FIXED',
      discountValue: 1000,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      categoryId,
    });
    const response = await request(app).get('/api/promotions');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('cambia el estado siguiendo el flujo permitido', async () => {
    const created = await request(app).post('/api/promotions').send({
      name: 'Promo Flujo',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      productId,
    });
    const id = created.body.id;

    const toActive = await request(app)
      .patch(`/api/promotions/${id}/status`)
      .send({ status: 'ACTIVE' });
    expect(toActive.status).toBe(200);
    expect(toActive.body.status).toBe('ACTIVE');

    const skipToScheduled = await request(app)
      .patch(`/api/promotions/${id}/status`)
      .send({ status: 'SCHEDULED' });
    expect(skipToScheduled.status).toBe(409);

    const toFinished = await request(app)
      .patch(`/api/promotions/${id}/status`)
      .send({ status: 'FINISHED' });
    expect(toFinished.status).toBe(200);

    const afterFinished = await request(app)
      .patch(`/api/promotions/${id}/status`)
      .send({ status: 'ACTIVE' });
    expect(afterFinished.status).toBe(409);
  });

  it('solo permite eliminar promociones en estado Programada', async () => {
    const created = await request(app).post('/api/promotions').send({
      name: 'Promo Eliminar',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      productId,
    });
    const id = created.body.id;

    await request(app).patch(`/api/promotions/${id}/status`).send({ status: 'ACTIVE' });
    const deleteActive = await request(app).delete(`/api/promotions/${id}`);
    expect(deleteActive.status).toBe(409);
  });

  it('GET /api/promotions/summary devuelve contadores y vigentes hoy', async () => {
    await request(app)
      .post('/api/promotions')
      .send({
        name: 'Promo Vigente',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        productId,
      });

    const response = await request(app).get('/api/promotions/summary');
    expect(response.status).toBe(200);
    expect(response.body.porEstado.SCHEDULED).toBe(1);
    expect(response.body.vigentesHoy).toBe(1);
  });
});
