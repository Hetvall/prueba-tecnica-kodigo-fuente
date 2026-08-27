import { useSummary } from '../hooks/usePromotions';
import { STATUS_LABELS } from '../types';

export function SummaryCards() {
  const { data, isLoading, isError } = useSummary();

  if (isLoading) return <p role="status">Cargando resumen…</p>;
  if (isError || !data) return <p role="alert">No se pudo cargar el resumen.</p>;

  return (
    <section className="summary" aria-label="Resumen de promociones">
      <div className="summary__card">
        <span className="summary__value">{data.porEstado.SCHEDULED}</span>
        <span className="summary__label">{STATUS_LABELS.SCHEDULED}</span>
      </div>
      <div className="summary__card">
        <span className="summary__value">{data.porEstado.ACTIVE}</span>
        <span className="summary__label">{STATUS_LABELS.ACTIVE}</span>
      </div>
      <div className="summary__card">
        <span className="summary__value">{data.porEstado.FINISHED}</span>
        <span className="summary__label">{STATUS_LABELS.FINISHED}</span>
      </div>
      <div className="summary__card summary__card--highlight">
        <span className="summary__value">{data.vigentesHoy}</span>
        <span className="summary__label">Vigentes hoy</span>
      </div>
    </section>
  );
}
