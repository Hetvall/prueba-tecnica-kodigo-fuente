import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CreatePromotionInput, PromotionStatus } from '../types';

const PROMOTIONS_KEY = ['promotions'];
const SUMMARY_KEY = ['promotions', 'summary'];
const CATEGORIES_KEY = ['categories'];
const PRODUCTS_KEY = ['products'];

export function usePromotions() {
  return useQuery({ queryKey: PROMOTIONS_KEY, queryFn: api.listPromotions });
}

export function useSummary() {
  return useQuery({ queryKey: SUMMARY_KEY, queryFn: api.getSummary });
}

export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: api.listCategories });
}

export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_KEY, queryFn: api.listProducts });
}

function useInvalidatePromotions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PROMOTIONS_KEY });
    queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
  };
}

export function useCreatePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (input: CreatePromotionInput) => api.createPromotion(input),
    onSuccess: invalidate,
  });
}

export function useChangeStatus() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PromotionStatus }) =>
      api.changeStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeletePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (id: string) => api.deletePromotion(id),
    onSuccess: invalidate,
  });
}
