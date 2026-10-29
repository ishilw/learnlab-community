import { screen } from '@testing-library/react'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { InstructorCoursePage } from '../InstructorCoursePage'

const summary = {
  course_id: 1,
  total_lessons: 0,
  enrolled_learners: 0,
  average_percent: 0,
  learners: [],
}

function courseApi(course = makeCourse({ status: 'draft' })) {
  return makeApi({
    courses: { get: vi.fn().mockResolvedValue(course) },
    content: { listModules: vi.fn().mockResolvedValue([]) },
    progress: { summary: vi.fn().mockResolvedValue(summary) },
  })
}

describe('InstructorCoursePage', () => {
  it('shows the course with its editing, status, content, and progress sections', async () => {
    renderWithApp(<InstructorCoursePage courseId={1} />, { role: 'instructor', api: courseApi() })
    expect(await screen.findByRole('heading', { level: 1, name: 'Intro to Python' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit course' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Course status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Content' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Learner progress' })).toBeInTheDocument()
  })

  it('prefills the edit form and offers the publish action', async () => {
    renderWithApp(<InstructorCoursePage courseId={1} />, { role: 'instructor', api: courseApi() })
    expect(await screen.findByLabelText('Title')).toHaveValue('Intro to Python')
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
  })

  it('treats an archived course as read-only', async () => {
    const api = courseApi(makeCourse({ status: 'archived' }))
    renderWithApp(<InstructorCoursePage courseId={1} />, { role: 'instructor', api })
    expect(await screen.findByLabelText('Title')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Add module' })).not.toBeInTheDocument()
  })

  it('shows the server error when the course cannot be loaded', async () => {
    const api = makeApi({ courses: { get: vi.fn().mockRejectedValue(new ApiError(404, 'course 1 not found')) } })
    renderWithApp(<InstructorCoursePage courseId={1} />, { role: 'instructor', api })
    expect(await screen.findByRole('alert')).toHaveTextContent('course 1 not found')
  })
})
