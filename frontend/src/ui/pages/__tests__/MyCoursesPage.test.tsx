import { screen } from '@testing-library/react'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse, makeProgress } from '../../__tests__/fixtures'
import { MyCoursesPage } from '../MyCoursesPage'

describe('MyCoursesPage', () => {
  it('lists enrolled courses with their progress', async () => {
    const api = makeApi({
      courses: { enrollments: vi.fn().mockResolvedValue([makeCourse()]) },
      progress: { course: vi.fn().mockResolvedValue(makeProgress()) },
    })
    renderWithApp(<MyCoursesPage />, { api })
    const link = await screen.findByRole('link', { name: 'Intro to Python' })
    expect(link).toHaveAttribute('href', '#/courses/1/learn')
    expect(await screen.findByText('50% complete (1 of 2 lessons)')).toBeInTheDocument()
  })

  it('shows an empty message when the learner has no enrollments', async () => {
    const api = makeApi({ courses: { enrollments: vi.fn().mockResolvedValue([]) } })
    renderWithApp(<MyCoursesPage />, { api })
    expect(await screen.findByText(/not enrolled in any course/i)).toBeInTheDocument()
  })

  it('shows an error when enrollments cannot be loaded', async () => {
    const api = makeApi({ courses: { enrollments: vi.fn().mockRejectedValue(new Error('offline')) } })
    renderWithApp(<MyCoursesPage />, { api })
    expect(await screen.findByRole('alert')).toHaveTextContent('offline')
  })
})
