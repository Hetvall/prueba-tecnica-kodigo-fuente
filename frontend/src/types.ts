export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type PromotionStatus = 'SCHEDULED' | 'ACTIVE' | 'FINISHED';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: Category;
}

export interface Promotion {
  id: string;
  name: string;
  discountType: DiscountType;
  discountValue: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  productId: string | null;
  categoryId: string | null;
  product: Product | null;
  category: Category | null;
  createdAt: string;
}

export interface PromotionSummary {
  total: number;
  porEstado: Record<PromotionStatus, number>;
  vigentesHoy: number;
}

export interface CreatePromotionInput {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  productId?: string;
  categoryId?: string;
}

export const STATUS_LABELS: Record<PromotionStatus, string> = {
  SCHEDULED: 'Programada',
  ACTIVE: 'Activa',
  FINISHED: 'Finalizada',
};

export const NEXT_STATUS: Record<PromotionStatus, PromotionStatus | null> = {
  SCHEDULED: 'ACTIVE',
  ACTIVE: 'FINISHED',
  FINISHED: null,
};
