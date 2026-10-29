import { screen, within } from '@testing-library/react'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { ProgressReport } from '../ProgressReport'

const summary = {
  course_id: 1,
  total_lessons: 2,
  enrolled_learners: 2,
  average_percent: 25,
  learners: [
    { learner_id: 3, completed_lessons: 1, percent: 50 },
    { learner_id: 4, completed_lessons: 0, percent: 0 },
  ],
}

describe('ProgressReport', () => {
  it('shows the aggregate numbers and one row per learner', async () => {
    const api = makeApi({ progress: { summary: vi.fn().mockResolvedValue(summary) } })
    renderWithApp(<ProgressReport courseId={1} />, { role: 'instructor', api })
    expect(await screen.findByText('Enrolled learners: 2')).toBeInTheDocument()
    expect(screen.getByText('Average progress: 25%')).toBeInTheDocument()
    expect(screen.getByText('Lessons in course: 2')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /learner progress/i })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByText('50%')).toBeInTheDocument()
  })

  it('says when nobody is enrolled', async () => {
    const empty = { ...summary, enrolled_learners: 0, average_percent: 0, learners: [] }
    const api = makeApi({ progress: { summary: vi.fn().mockResolvedValue(empty) } })
    renderWithApp(<ProgressReport courseId={1} />, { role: 'instructor', api })
    expect(await screen.findByText(/no learners are enrolled yet/i)).toBeInTheDocument()
  })

  it('shows the server error', async () => {
    const summaryStub = vi.fn().mockRejectedValue(new ApiError(403, 'only the course owner or an administrator may read progress'))
    renderWithApp(<ProgressReport courseId={1} />, {
      role: 'instructor',
      api: makeApi({ progress: { summary: summaryStub } }),
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('may read progress')
  })
})
