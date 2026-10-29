import { useState } from 'react'
import type { Course } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { StatusBadge } from '../components/StatusBadge'
import { useAsync } from '../hooks/useAsync'
import { ContentManager } from './ContentManager'
import { EditCourseForm } from './EditCourseForm'
import { ProgressReport } from './ProgressReport'
import { StatusControls } from './StatusControls'

function CourseEditor({ initial }: { initial: Course }) {
  const [course, setCourse] = useState(initial)
  return (
    <article>
      <h1>{course.title}</h1>
      <StatusBadge status={course.status} />
      <section>
        <h2>Edit course</h2>
        <EditCourseForm course={course} onSaved={setCourse} />
      </section>
      <section>
        <h2>Course status</h2>
        <StatusControls course={course} onChanged={setCourse} />
      </section>
      <section>
        <h2>Content</h2>
        <ContentManager courseId={course.id} archived={course.status === 'archived'} />
      </section>
      <section>
        <h2>Learner progress</h2>
        <ProgressReport courseId={course.id} />
      </section>
    </article>
  )
}

export function InstructorCoursePage({ courseId }: { courseId: number }) {
  const api = useApi()
  const result = useAsync(() => api.courses.get(courseId), [api, courseId])
  return <AsyncView result={result}>{(course) => <CourseEditor initial={course} />}</AsyncView>
}
