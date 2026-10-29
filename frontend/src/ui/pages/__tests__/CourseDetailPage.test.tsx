import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { CourseDetailPage } from '../CourseDetailPage'

const get = () => vi.fn().mockResolvedValue(makeCourse())

describe('CourseDetailPage', () => {
  it('shows the course and an enroll button to learners', async () => {
    renderWithApp(<CourseDetailPage courseId={1} />, { api: makeApi({ courses: { get: get() } }) })
    expect(await screen.findByRole('heading', { name: 'Intro to Python' })).toBeInTheDocument()
    expect(screen.getByText('Learn the basics.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enroll' })).toBeInTheDocument()
  })

  it('enrolls and confirms', async () => {
    const enroll = vi.fn().mockResolvedValue({ course_id: 1, learner_id: 1 })
    renderWithApp(<CourseDetailPage courseId={1} />, { api: makeApi({ courses: { get: get(), enroll } }) })
    await userEvent.click(await screen.findByRole('button', { name: 'Enroll' }))
    expect(enroll).toHaveBeenCalledWith(1)
    expect(await screen.findByRole('status')).toHaveTextContent('You are enrolled.')
  })

  it('shows the server message for a duplicate enrollment', async () => {
    const enroll = vi.fn().mockRejectedValue(new ApiError(409, 'learner is already enrolled in this course'))
    renderWithApp(<CourseDetailPage courseId={1} />, { api: makeApi({ courses: { get: get(), enroll } }) })
    await userEvent.click(await screen.findByRole('button', { name: 'Enroll' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already enrolled')
  })

  it('links learners to the course content', async () => {
    renderWithApp(<CourseDetailPage courseId={1} />, { api: makeApi({ courses: { get: get() } }) })
    const link = await screen.findByRole('link', { name: /course content/i })
    expect(link).toHaveAttribute('href', '#/courses/1/learn')
  })

  it('offers instructors a management link instead of enrollment', async () => {
    renderWithApp(<CourseDetailPage courseId={1} />, {
      role: 'instructor',
      api: makeApi({ courses: { get: get() } }),
    })
    const link = await screen.findByRole('link', { name: /manage this course/i })
    expect(link).toHaveAttribute('href', '#/instructor/courses/1')
    expect(screen.queryByRole('button', { name: 'Enroll' })).not.toBeInTheDocument()
  })

  it('shows a not-found error', async () => {
    const getMissing = vi.fn().mockRejectedValue(new ApiError(404, 'course 9 not found'))
    renderWithApp(<CourseDetailPage courseId={9} />, { api: makeApi({ courses: { get: getMissing } }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('not found')
  })
})
