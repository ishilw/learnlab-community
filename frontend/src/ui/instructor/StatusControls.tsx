import { STATUS_LABELS, TRANSITION_TARGETS, type Course, type CourseStatus } from '../../types/models'
import { useApi } from '../apiContext'
import { StatusBadge } from '../components/StatusBadge'
import { StatusMessage } from '../components/StatusMessage'
import { useAction } from '../hooks/useAction'

const ACTION_LABELS: Record<CourseStatus, string> = {
  draft: 'Move to draft',
  published: 'Publish',
  unpublished: 'Unpublish',
  archived: 'Archive course',
}

const ARCHIVE_WARNING = 'Archive this course? It becomes read-only and cannot be changed back.'

interface ActionButtonsProps {
  targets: CourseStatus[]
  busy: boolean
  onChange: (target: CourseStatus) => void
}

function ActionButtons({ targets, busy, onChange }: ActionButtonsProps) {
  if (targets.length === 0) return <p>Archived courses cannot change state.</p>
  return (
    <div className="actions">
      {targets.map((target) => (
        <button key={target} type="button" disabled={busy} onClick={() => onChange(target)}>
          {ACTION_LABELS[target]}
        </button>
      ))}
    </div>
  )
}

interface StatusControlsProps {
  course: Course
  onChanged: (course: Course) => void
}

/** Shows the lifecycle actions for the current state. The backend rejects invalid transitions. */
export function StatusControls({ course, onChanged }: StatusControlsProps) {
  const api = useApi()
  const { message, busy, run } = useAction()

  async function change(target: CourseStatus) {
    if (target === 'archived' && !window.confirm(ARCHIVE_WARNING)) return
    const successText = `Course is now ${STATUS_LABELS[target]}.`
    const updated = await run(() => api.courses.transition(course.id, target), successText)
    if (updated) onChanged(updated)
  }

  return (
    <div>
      <p>
        Current status: <StatusBadge status={course.status} />
      </p>
      <ActionButtons targets={TRANSITION_TARGETS[course.status]} busy={busy} onChange={change} />
      <StatusMessage message={message} />
    </div>
  )
}
