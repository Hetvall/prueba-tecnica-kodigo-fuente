import { FormEvent, useState } from 'react';
import { useCategories, useCreatePromotion, useProducts } from '../hooks/usePromotions';
import type { DiscountType } from '../types';
import { ApiError } from '../api/client';

type AssociationType = 'product' | 'category';

const initialState = {
  name: '',
  associationType: 'product' as AssociationType,
  productId: '',
  categoryId: '',
  discountType: 'PERCENTAGE' as DiscountType,
  discountValue: '',
  startDate: '',
  endDate: '',
};

export function PromotionForm() {
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createPromotion = useCreatePromotion();

  const [form, setForm] = useState(initialState);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const discountValue = Number(form.discountValue);

    try {
      await createPromotion.mutateAsync({
        name: form.name,
        discountType: form.discountType,
        discountValue,
        startDate: form.startDate,
        endDate: form.endDate,
        productId: form.associationType === 'product' ? form.productId : undefined,
        categoryId: form.associationType === 'category' ? form.categoryId : undefined,
      });
      setForm(initialState);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.');
    }
  }

  return (
    <form className="promotion-form" onSubmit={handleSubmit} aria-label="Crear promoción">
      <h2>Nueva promoción</h2>

      <label htmlFor="name">Nombre</label>
      <input
        id="name"
        type="text"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        required
      />

      <fieldset>
        <legend>Asociar a</legend>
        <label>
          <input
            type="radio"
            name="associationType"
            checked={form.associationType === 'product'}
            onChange={() => update('associationType', 'product')}
          />
          Producto
        </label>
        <label>
          <input
            type="radio"
            name="associationType"
            checked={form.associationType === 'category'}
            onChange={() => update('associationType', 'category')}
          />
          Categoría
        </label>
      </fieldset>

      {form.associationType === 'product' ? (
        <>
          <label htmlFor="productId">Producto</label>
          <select
            id="productId"
            value={form.productId}
            onChange={(e) => update('productId', e.target.value)}
            required
          >
            <option value="">Selecciona un producto</option>
            {products?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <label htmlFor="categoryId">Categoría</label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="discountType">Tipo de descuento</label>
      <select
        id="discountType"
        value={form.discountType}
        onChange={(e) => update('discountType', e.target.value as DiscountType)}
      >
        <option value="PERCENTAGE">Porcentaje</option>
        <option value="FIXED">Monto fijo</option>
      </select>

      <label htmlFor="discountValue">
        Valor del descuento {form.discountType === 'PERCENTAGE' ? '(1-100)' : ''}
      </label>
      <input
        id="discountValue"
        type="number"
        min={form.discountType === 'PERCENTAGE' ? 1 : 0.01}
        max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
        step="0.01"
        value={form.discountValue}
        onChange={(e) => update('discountValue', e.target.value)}
        required
      />

      <label htmlFor="startDate">Fecha de inicio</label>
      <input
        id="startDate"
        type="date"
        value={form.startDate}
        onChange={(e) => update('startDate', e.target.value)}
        required
      />

      <label htmlFor="endDate">Fecha de fin</label>
      <input
        id="endDate"
        type="date"
        value={form.endDate}
        onChange={(e) => update('endDate', e.target.value)}
        required
      />

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <button type="submit" disabled={createPromotion.isPending}>
        {createPromotion.isPending ? 'Guardando…' : 'Crear promoción'}
      </button>
    </form>
  );
}
