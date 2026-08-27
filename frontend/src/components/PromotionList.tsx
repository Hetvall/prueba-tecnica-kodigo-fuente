import { useState } from 'react';
import { useChangeStatus, useDeletePromotion, usePromotions } from '../hooks/usePromotions';
import { NEXT_STATUS, STATUS_LABELS, type PromotionStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { ApiError } from '../api/client';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es');
}

function formatDiscount(type: 'PERCENTAGE' | 'FIXED', value: string): string {
  return type === 'PERCENTAGE' ? `${value}%` : `$${Number(value).toFixed(2)}`;
}

export function PromotionList() {
  const { data: promotions, isLoading, isError } = usePromotions();
  const changeStatus = useChangeStatus();
  const deletePromotion = useDeletePromotion();
  const [rowError, setRowError] = useState<string | null>(null);

  if (isLoading) return <p role="status">Cargando promociones…</p>;
  if (isError || !promotions) return <p role="alert">No se pudieron cargar las promociones.</p>;

  async function handleAdvance(id: string, next: PromotionStatus) {
    setRowError(null);
    try {
      await changeStatus.mutateAsync({ id, status: next });
    } catch (error) {
      setRowError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado.');
    }
  }

  async function handleDelete(id: string) {
    setRowError(null);
    try {
      await deletePromotion.mutateAsync(id);
    } catch (error) {
      setRowError(error instanceof ApiError ? error.message : 'No se pudo eliminar la promoción.');
    }
  }

  return (
    <section aria-label="Listado de promociones">
      <h2>Promociones</h2>
      {rowError && (
        <p role="alert" className="form-error">
          {rowError}
        </p>
      )}
      {promotions.length === 0 ? (
        <p>No hay promociones registradas todavía.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Producto / Categoría</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => {
              const next = NEXT_STATUS[promotion.status];
              return (
                <tr key={promotion.id}>
                  <td>{promotion.name}</td>
                  <td>{promotion.product?.name ?? promotion.category?.name ?? '—'}</td>
                  <td>{formatDiscount(promotion.discountType, promotion.discountValue)}</td>
                  <td>
                    {formatDate(promotion.startDate)} — {formatDate(promotion.endDate)}
                  </td>
                  <td>
                    <StatusBadge status={promotion.status} />
                  </td>
                  <td className="actions">
                    {next && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(promotion.id, next)}
                        disabled={changeStatus.isPending}
                      >
                        Marcar como {STATUS_LABELS[next]}
                      </button>
                    )}
                    {promotion.status === 'SCHEDULED' && (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(promotion.id)}
                        disabled={deletePromotion.isPending}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
