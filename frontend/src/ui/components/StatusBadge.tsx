import { STATUS_LABELS, type CourseStatus } from '../../types/models'

export function StatusBadge({ status }: { status: CourseStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
}
