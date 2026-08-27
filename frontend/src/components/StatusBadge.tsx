import type { PromotionStatus } from '../types';
import { STATUS_LABELS } from '../types';

const STATUS_CLASS: Record<PromotionStatus, string> = {
  SCHEDULED: 'badge badge--scheduled',
  ACTIVE: 'badge badge--active',
  FINISHED: 'badge badge--finished',
};

export function StatusBadge({ status }: { status: PromotionStatus }) {
  return <span className={STATUS_CLASS[status]}>{STATUS_LABELS[status]}</span>;
}
