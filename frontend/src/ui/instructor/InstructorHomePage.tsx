import { useState, type FormEvent } from 'react'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { CourseList } from '../components/CourseList'
import { StatusMessage } from '../components/StatusMessage'
import { TextField } from '../components/TextField'
import { useAction } from '../hooks/useAction'
import { useAsync } from '../hooks/useAsync'
import { rememberCourse } from '../myCourses'
import { navigate } from '../router'
import { useSession } from '../session'
import { loadInstructorCourses } from './loadInstructorCourses'

function CreateCourseForm({ userId }: { userId: number }) {
  const api = useApi()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { message, busy, run, fail } = useAction()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return fail('Enter a title.')
    const course = await run(() => api.courses.create({ title: title.trim(), description }))
    if (course) {
      rememberCourse(window.localStorage, userId, course.id)
      navigate(`/instructor/courses/${course.id}`)
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Create a course</h2>
      <TextField id="course-title" label="Title" value={title} onChange={setTitle} />
      <TextField id="course-description" label="Description" value={description} onChange={setDescription} multiline />
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Create course
      </button>
    </form>
  )
}

export function InstructorHomePage() {
  const api = useApi()
  const { session } = useSession()
  const userId = session?.userId ?? 0
  const role = session?.role ?? 'instructor'
  const result = useAsync(
    () => loadInstructorCourses(api, userId, role, window.localStorage),
    [api, userId, role],
  )
  return (
    <section>
      <h1>Your courses</h1>
      <p className="hint">
        Published courses you own are listed from the server. Drafts and archived courses appear here
        only if you created them in this browser, because the API cannot list them yet.
      </p>
      <AsyncView
        result={result}
        isEmpty={(courses) => courses.length === 0}
        emptyMessage="You have no courses yet. Create one below."
      >
        {(courses) => <CourseList courses={courses} linkFor={(course) => `/instructor/courses/${course.id}`} />}
      </AsyncView>
      <CreateCourseForm userId={userId} />
    </section>
  )
}
