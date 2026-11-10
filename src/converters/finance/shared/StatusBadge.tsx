import { STATUS_LABEL, type RateStatus } from './status.ts'
import './StatusBadge.css'

/** Live / Cached / Outdated pill shared by the Currency and Gold converters. */
export default function StatusBadge({ status, loading = false }: { status: RateStatus | null; loading?: boolean }) {
  if (status) return <span className={`status-badge status-${status}`}>{STATUS_LABEL[status]}</span>
  return <span className="status-badge status-none">{loading ? 'Loading' : 'Unavailable'}</span>
}
