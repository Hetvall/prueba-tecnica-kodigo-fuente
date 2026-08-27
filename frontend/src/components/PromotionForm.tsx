import { FormEvent, KeyboardEvent, useState } from 'react';
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

type FieldErrors = Partial<Record<keyof typeof initialState, string>>;

export function PromotionForm() {
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createPromotion = useCreatePromotion();

  const [form, setForm] = useState(initialState);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function updateDiscountValue(value: string) {
    // No se permiten signos negativos: se descarta cualquier "-" ingresado.
    update('discountValue', value.replace(/-/g, ''));
  }

  function blockNegativeKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault();
    }
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!form.name.trim()) {
      errors.name = 'El nombre de la promoción es obligatorio.';
    }

    if (form.associationType === 'product' && !form.productId) {
      errors.productId = 'Debe seleccionar un producto.';
    }
    if (form.associationType === 'category' && !form.categoryId) {
      errors.categoryId = 'Debe seleccionar una categoría.';
    }

    const discountValue = Number(form.discountValue);
    if (!form.discountValue || Number.isNaN(discountValue)) {
      errors.discountValue = 'El valor del descuento es obligatorio y debe ser numérico.';
    } else if (discountValue <= 0) {
      errors.discountValue = 'El valor del descuento debe ser mayor que 0.';
    } else if (form.discountType === 'PERCENTAGE' && (discountValue < 1 || discountValue > 100)) {
      errors.discountValue =
        'Si el tipo de descuento es Porcentaje, el valor debe estar entre 1 y 100.';
    }

    if (!form.startDate) {
      errors.startDate = 'La fecha de inicio es obligatoria y debe ser válida.';
    }
    if (!form.endDate) {
      errors.endDate = 'La fecha de fin es obligatoria y debe ser válida.';
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

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
      setFieldErrors({});
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.');
    }
  }

  return (
    <form
      className="promotion-form"
      onSubmit={handleSubmit}
      aria-label="Crear promoción"
      noValidate
    >
      <h2>Nueva promoción</h2>

      <label htmlFor="name">Nombre</label>
      <input
        id="name"
        type="text"
        className={fieldErrors.name ? 'input-error' : undefined}
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        required
      />
      {fieldErrors.name && (
        <p role="alert" className="field-error">
          {fieldErrors.name}
        </p>
      )}

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
            className={fieldErrors.productId ? 'input-error' : undefined}
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
          {fieldErrors.productId && (
            <p role="alert" className="field-error">
              {fieldErrors.productId}
            </p>
          )}
        </>
      ) : (
        <>
          <label htmlFor="categoryId">Categoría</label>
          <select
            id="categoryId"
            className={fieldErrors.categoryId ? 'input-error' : undefined}
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
          {fieldErrors.categoryId && (
            <p role="alert" className="field-error">
              {fieldErrors.categoryId}
            </p>
          )}
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
        className={fieldErrors.discountValue ? 'input-error' : undefined}
        min={form.discountType === 'PERCENTAGE' ? 1 : 0.01}
        max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
        step="0.01"
        value={form.discountValue}
        onChange={(e) => updateDiscountValue(e.target.value)}
        onKeyDown={blockNegativeKey}
        required
      />
      {fieldErrors.discountValue && (
        <p role="alert" className="field-error">
          {fieldErrors.discountValue}
        </p>
      )}

      <label htmlFor="startDate">Fecha de inicio</label>
      <input
        id="startDate"
        type="date"
        className={fieldErrors.startDate ? 'input-error' : undefined}
        value={form.startDate}
        onChange={(e) => update('startDate', e.target.value)}
        required
      />
      {fieldErrors.startDate && (
        <p role="alert" className="field-error">
          {fieldErrors.startDate}
        </p>
      )}

      <label htmlFor="endDate">Fecha de fin</label>
      <input
        id="endDate"
        type="date"
        className={fieldErrors.endDate ? 'input-error' : undefined}
        value={form.endDate}
        onChange={(e) => update('endDate', e.target.value)}
        required
      />
      {fieldErrors.endDate && (
        <p role="alert" className="field-error">
          {fieldErrors.endDate}
        </p>
      )}

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
