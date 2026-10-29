import type { Course } from '../../types/models'
import { Link } from '../router'
import { StatusBadge } from './StatusBadge'

interface CourseListProps {
  courses: Course[]
  linkFor: (course: Course) => string
}

export function CourseList({ courses, linkFor }: CourseListProps) {
  return (
    <ul className="card-list">
      {courses.map((course) => (
        <li key={course.id}>
          <article className="card">
            <h2>
              <Link to={linkFor(course)}>{course.title}</Link>
            </h2>
            <StatusBadge status={course.status} />
            <p>{course.description || 'No description.'}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}
