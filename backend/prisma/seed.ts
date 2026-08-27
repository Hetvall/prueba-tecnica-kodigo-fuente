import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existingCategories = await prisma.category.count();
  if (existingCategories > 0) {
    console.log('Seed omitido: ya existen datos.');
    return;
  }

  const bebidas = await prisma.category.create({ data: { name: 'Bebidas' } });
  const snacks = await prisma.category.create({ data: { name: 'Snacks' } });

  const cocaCola = await prisma.product.create({
    data: { name: 'Coca-Cola 400ml', categoryId: bebidas.id },
  });
  const papasFritas = await prisma.product.create({
    data: { name: 'Papas Fritas 150g', categoryId: snacks.id },
  });

  const today = new Date();
  const inFiveDays = new Date(today);
  inFiveDays.setDate(today.getDate() + 5);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  await prisma.promotion.create({
    data: {
      name: 'Descuento Coca-Cola vigente',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      startDate: yesterday,
      endDate: inFiveDays,
      status: 'ACTIVE',
      productId: cocaCola.id,
    },
  });

  await prisma.promotion.create({
    data: {
      name: 'Snacks fin de mes',
      discountType: 'FIXED',
      discountValue: 500,
      startDate: nextMonth,
      endDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0),
      status: 'SCHEDULED',
      categoryId: snacks.id,
    },
  });

  await prisma.promotion.create({
    data: {
      name: 'Promo Bebidas pasada',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate: lastMonth,
      endDate: yesterday,
      status: 'FINISHED',
      categoryId: bebidas.id,
    },
  });

  await prisma.promotion.create({
    data: {
      name: 'Papas Fritas 2x1',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      startDate: yesterday,
      endDate: inFiveDays,
      status: 'ACTIVE',
      productId: papasFritas.id,
    },
  });

  console.log('Seed completado.');
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
