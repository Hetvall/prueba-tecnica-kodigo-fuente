import type {
  Category,
  CreatePromotionInput,
  Product,
  Promotion,
  PromotionStatus,
  PromotionSummary,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    let message = `Error ${response.status} al consultar ${path}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // sin cuerpo JSON, se mantiene el mensaje genérico
    }
    throw new ApiError(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  listPromotions: () => request<Promotion[]>('/promotions'),
  getSummary: () => request<PromotionSummary>('/promotions/summary'),
  createPromotion: (input: CreatePromotionInput) =>
    request<Promotion>('/promotions', { method: 'POST', body: JSON.stringify(input) }),
  changeStatus: (id: string, status: PromotionStatus) =>
    request<Promotion>(`/promotions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deletePromotion: (id: string) => request<void>(`/promotions/${id}`, { method: 'DELETE' }),
  listCategories: () => request<Category[]>('/categories'),
  listProducts: () => request<Product[]>('/products'),
};
