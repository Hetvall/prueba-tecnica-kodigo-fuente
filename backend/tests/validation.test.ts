import { describe, expect, it } from 'vitest';
import {
  ValidationError,
  canTransition,
  isCurrentlyInRange,
  validatePromotionInput,
} from '../src/domain/validation';

const baseInput = {
  name: 'Promo Test',
  discountType: 'PERCENTAGE' as const,
  discountValue: 10,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  productId: 'prod-1',
};

describe('validatePromotionInput', () => {
  it('acepta un input válido', () => {
    const result = validatePromotionInput(baseInput);
    expect(result.name).toBe('Promo Test');
    expect(result.discountValue).toBe(10);
  });

  it('rechaza sin nombre', () => {
    expect(() => validatePromotionInput({ ...baseInput, name: '' })).toThrow(ValidationError);
  });

  it('rechaza sin producto ni categoría', () => {
    const { productId: _omit, ...rest } = baseInput;
    expect(() => validatePromotionInput(rest)).toThrow(ValidationError);
  });

  it('rechaza si tiene producto Y categoría a la vez', () => {
    expect(() => validatePromotionInput({ ...baseInput, categoryId: 'cat-1' })).toThrow(
      ValidationError,
    );
  });

  it('rechaza sin valor de descuento', () => {
    const { discountValue: _omit, ...rest } = baseInput;
    expect(() => validatePromotionInput(rest)).toThrow(ValidationError);
  });

  it('rechaza fecha de fin anterior o igual a la de inicio', () => {
    expect(() =>
      validatePromotionInput({ ...baseInput, startDate: '2026-01-10', endDate: '2026-01-01' }),
    ).toThrow(ValidationError);
    expect(() =>
      validatePromotionInput({ ...baseInput, startDate: '2026-01-10', endDate: '2026-01-10' }),
    ).toThrow(ValidationError);
  });

  it('rechaza porcentaje fuera de rango 1-100', () => {
    expect(() => validatePromotionInput({ ...baseInput, discountValue: 0 })).toThrow(
      ValidationError,
    );
    expect(() => validatePromotionInput({ ...baseInput, discountValue: 101 })).toThrow(
      ValidationError,
    );
  });

  it('acepta monto fijo mayor a 100', () => {
    const result = validatePromotionInput({
      ...baseInput,
      discountType: 'FIXED',
      discountValue: 5000,
    });
    expect(result.discountValue).toBe(5000);
  });
});

describe('canTransition', () => {
  it('permite SCHEDULED -> ACTIVE', () => {
    expect(canTransition('SCHEDULED', 'ACTIVE')).toBe(true);
  });
  it('permite ACTIVE -> FINISHED', () => {
    expect(canTransition('ACTIVE', 'FINISHED')).toBe(true);
  });
  it('no permite SCHEDULED -> FINISHED (saltar paso)', () => {
    expect(canTransition('SCHEDULED', 'FINISHED')).toBe(false);
  });
  it('no permite retroceder ACTIVE -> SCHEDULED', () => {
    expect(canTransition('ACTIVE', 'SCHEDULED')).toBe(false);
  });
  it('no permite ninguna transición desde FINISHED', () => {
    expect(canTransition('FINISHED', 'ACTIVE')).toBe(false);
    expect(canTransition('FINISHED', 'SCHEDULED')).toBe(false);
  });
});

describe('isCurrentlyInRange', () => {
  it('devuelve true si hoy está dentro del rango', () => {
    const now = new Date('2026-01-05');
    expect(isCurrentlyInRange(new Date('2026-01-01'), new Date('2026-01-10'), now)).toBe(true);
  });
  it('devuelve false si hoy es anterior al inicio', () => {
    const now = new Date('2025-12-31');
    expect(isCurrentlyInRange(new Date('2026-01-01'), new Date('2026-01-10'), now)).toBe(false);
  });
  it('devuelve false si hoy es posterior al fin', () => {
    const now = new Date('2026-01-11');
    expect(isCurrentlyInRange(new Date('2026-01-01'), new Date('2026-01-10'), now)).toBe(false);
  });
});
