import { Prisma, PrismaClient } from '@prisma/client';
import {
  PromotionInput,
  PromotionStatus,
  ValidationError,
  canTransition,
  isCurrentlyInRange,
  isValidStatus,
  validatePromotionInput,
} from '../domain/validation';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

const promotionInclude = {
  product: { include: { category: true } },
  category: true,
} satisfies Prisma.PromotionInclude;

export class PromotionService {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    return this.prisma.promotion.findMany({
      include: promotionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: PromotionInput) {
    const data = validatePromotionInput(input);

    if (data.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
      if (!product) throw new ValidationError('El producto indicado no existe.');
    }
    if (data.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new ValidationError('La categoría indicada no existe.');
    }

    return this.prisma.promotion.create({
      data: {
        name: data.name,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        productId: data.productId,
        categoryId: data.categoryId,
        status: 'SCHEDULED',
      },
      include: promotionInclude,
    });
  }

  async changeStatus(id: string, nextStatus: unknown) {
    if (!isValidStatus(nextStatus)) {
      throw new ValidationError('Estado inválido. Debe ser SCHEDULED, ACTIVE o FINISHED.');
    }

    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion) throw new NotFoundError('Promoción no encontrada.');

    const currentStatus = promotion.status as PromotionStatus;
    if (currentStatus === 'FINISHED') {
      throw new ConflictError('Una promoción Finalizada no puede modificarse.');
    }
    if (!canTransition(currentStatus, nextStatus)) {
      throw new ConflictError(
        `Transición no permitida: ${currentStatus} -> ${nextStatus}. El flujo es Programada -> Activa -> Finalizada.`,
      );
    }

    return this.prisma.promotion.update({
      where: { id },
      data: { status: nextStatus },
      include: promotionInclude,
    });
  }

  async remove(id: string) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion) throw new NotFoundError('Promoción no encontrada.');
    if (promotion.status !== 'SCHEDULED') {
      throw new ConflictError('Solo se pueden eliminar promociones en estado Programada.');
    }
    await this.prisma.promotion.delete({ where: { id } });
  }

  async summary() {
    const promotions = await this.prisma.promotion.findMany({
      select: { status: true, startDate: true, endDate: true },
    });

    const counts: Record<PromotionStatus, number> = {
      SCHEDULED: 0,
      ACTIVE: 0,
      FINISHED: 0,
    };
    let vigentesHoy = 0;
    const now = new Date();

    for (const promotion of promotions) {
      counts[promotion.status as PromotionStatus] += 1;
      if (isCurrentlyInRange(promotion.startDate, promotion.endDate, now)) {
        vigentesHoy += 1;
      }
    }

    return {
      total: promotions.length,
      porEstado: counts,
      vigentesHoy,
    };
  }
}
