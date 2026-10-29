import { errorText } from '../errors'
import type { AsyncResult } from '../hooks/useAsync'
import type { Progress } from '../../types/models'

/** Integer course progress, as the backend reports it (completed lessons over total, rounded down). */
export function ProgressBanner({ result }: { result: AsyncResult<Progress> }) {
  if (result.status === 'loading') return <p role="status">Loading progress…</p>
  if (result.status === 'error') return <p role="alert">{errorText(result.error)}</p>
  const { percent, completed_lessons: done, total_lessons: total } = result.data
  return (
    <div className="progress">
      <progress max={100} value={percent} aria-label="Course progress" />
      <span>{`${percent}% complete (${done} of ${total} lessons)`}</span>
    </div>
  )
}
