import { useState } from 'react'
import type { Course, Role } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { StatusBadge } from '../components/StatusBadge'
import { StatusMessage, type Message } from '../components/StatusMessage'
import { errorText } from '../errors'
import { useAsync } from '../hooks/useAsync'
import { Link } from '../router'
import { useSession } from '../session'

function EnrollPanel({ course }: { course: Course }) {
  const api = useApi()
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)

  async function enroll() {
    setBusy(true)
    try {
      await api.courses.enroll(course.id)
      setMessage({ kind: 'ok', text: 'You are enrolled.' })
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="actions">
      <button type="button" onClick={enroll} disabled={busy}>
        Enroll
      </button>
      <Link to={`/courses/${course.id}/learn`}>Go to course content</Link>
      <StatusMessage message={message} />
    </div>
  )
}

function CourseDetail({ course, role }: { course: Course; role: Role }) {
  return (
    <article>
      <h1>{course.title}</h1>
      <StatusBadge status={course.status} />
      <p>{course.description}</p>
      {role === 'learner' ? (
        <EnrollPanel course={course} />
      ) : (
        <Link to={`/instructor/courses/${course.id}`}>Manage this course</Link>
      )}
    </article>
  )
}

export function CourseDetailPage({ courseId }: { courseId: number }) {
  const api = useApi()
  const { session } = useSession()
  const result = useAsync(() => api.courses.get(courseId), [api, courseId])
  return (
    <AsyncView result={result}>
      {(course) => <CourseDetail course={course} role={session?.role ?? 'learner'} />}
    </AsyncView>
  )
}
