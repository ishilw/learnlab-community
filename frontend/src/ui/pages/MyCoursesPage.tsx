import type { Course } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { ProgressBanner } from '../components/ProgressBanner'
import { useAsync } from '../hooks/useAsync'
import { Link } from '../router'

function EnrolledCourse({ course }: { course: Course }) {
  const api = useApi()
  const progress = useAsync(() => api.progress.course(course.id), [api, course.id])
  return (
    <article className="card">
      <h2>
        <Link to={`/courses/${course.id}/learn`}>{course.title}</Link>
      </h2>
      <ProgressBanner result={progress} />
    </article>
  )
}

export function MyCoursesPage() {
  const api = useApi()
  const result = useAsync(() => api.courses.enrollments(), [api])
  return (
    <section>
      <h1>My courses</h1>
      <AsyncView
        result={result}
        isEmpty={(courses) => courses.length === 0}
        emptyMessage="You are not enrolled in any course yet. Browse the catalog to enroll."
      >
        {(courses) => (
          <ul className="card-list">
            {courses.map((course) => (
              <li key={course.id}>
                <EnrolledCourse course={course} />
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
    </section>
  )
}
