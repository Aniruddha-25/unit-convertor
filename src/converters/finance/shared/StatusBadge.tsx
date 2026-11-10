import { STATUS_LABEL, type LiveStatus } from './status.ts'
import './StatusBadge.css'

/** Live / Offline pill shared by the Currency and Gold converters. Shows "Loading" only while nothing is confirmed yet. */
export default function StatusBadge({ status, loading = false }: { status: LiveStatus | null; loading?: boolean }) {
  if (status) return <span className={`status-badge status-${status}`}>{STATUS_LABEL[status]}</span>
  return loading ? <span className="status-badge status-none">Loading</span> : null
}
