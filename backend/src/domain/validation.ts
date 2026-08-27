export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type PromotionStatus = 'SCHEDULED' | 'ACTIVE' | 'FINISHED';

export interface PromotionInput {
  name?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  productId?: unknown;
  categoryId?: unknown;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Transiciones de estado permitidas: solo hacia adelante, un paso a la vez.
 * Programada -> Activa -> Finalizada.
 */
const ALLOWED_TRANSITIONS: Record<PromotionStatus, PromotionStatus[]> = {
  SCHEDULED: ['ACTIVE'],
  ACTIVE: ['FINISHED'],
  FINISHED: [],
};

export function canTransition(from: PromotionStatus, to: PromotionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isValidDiscountType(value: unknown): value is DiscountType {
  return value === 'PERCENTAGE' || value === 'FIXED';
}

export function isValidStatus(value: unknown): value is PromotionStatus {
  return value === 'SCHEDULED' || value === 'ACTIVE' || value === 'FINISHED';
}

/**
 * Valida los datos de creación de una promoción según las reglas de negocio.
 * Lanza ValidationError con un mensaje descriptivo ante el primer incumplimiento.
 */
export function validatePromotionInput(input: PromotionInput): {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  productId: string | null;
  categoryId: string | null;
} {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw new ValidationError('El nombre de la promoción es obligatorio.');
  }

  const productId =
    typeof input.productId === 'string' && input.productId.trim() ? input.productId : null;
  const categoryId =
    typeof input.categoryId === 'string' && input.categoryId.trim() ? input.categoryId : null;

  if (!productId && !categoryId) {
    throw new ValidationError('Debe asociar la promoción a un producto o a una categoría.');
  }
  if (productId && categoryId) {
    throw new ValidationError(
      'Solo se puede asociar la promoción a un producto o a una categoría, no ambos.',
    );
  }

  if (!isValidDiscountType(input.discountType)) {
    throw new ValidationError('El tipo de descuento debe ser "PERCENTAGE" o "FIXED".');
  }

  const discountValue = Number(input.discountValue);
  if (
    input.discountValue === undefined ||
    input.discountValue === null ||
    Number.isNaN(discountValue)
  ) {
    throw new ValidationError('El valor del descuento es obligatorio y debe ser numérico.');
  }
  if (discountValue <= 0) {
    throw new ValidationError('El valor del descuento debe ser mayor que 0.');
  }
  if (input.discountType === 'PERCENTAGE' && (discountValue < 1 || discountValue > 100)) {
    throw new ValidationError(
      'Si el tipo de descuento es Porcentaje, el valor debe estar entre 1 y 100.',
    );
  }

  const startDate = new Date(String(input.startDate));
  const endDate = new Date(String(input.endDate));
  if (!input.startDate || Number.isNaN(startDate.getTime())) {
    throw new ValidationError('La fecha de inicio es obligatoria y debe ser válida.');
  }
  if (!input.endDate || Number.isNaN(endDate.getTime())) {
    throw new ValidationError('La fecha de fin es obligatoria y debe ser válida.');
  }
  if (endDate <= startDate) {
    throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio.');
  }

  return {
    name,
    discountType: input.discountType,
    discountValue,
    startDate,
    endDate,
    productId,
    categoryId,
  };
}

/** Determina si hoy cae dentro del rango de vigencia [startDate, endDate]. */
export function isCurrentlyInRange(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): boolean {
  return now >= startDate && now <= endDate;
}
