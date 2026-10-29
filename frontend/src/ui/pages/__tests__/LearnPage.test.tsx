import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeModule, makeProgress } from '../../__tests__/fixtures'
import { LearnPage } from '../LearnPage'

function learnerApi() {
  return makeApi({
    content: { listModules: vi.fn().mockResolvedValue([makeModule()]) },
    progress: {
      course: vi.fn().mockResolvedValue(makeProgress()),
      completeLesson: vi.fn().mockResolvedValue({ lesson_id: 11, completed: true }),
    },
  })
}

describe('LearnPage', () => {
  it('lists modules and lessons in order and shows progress', async () => {
    renderWithApp(<LearnPage courseId={1} />, { api: learnerApi() })
    expect(await screen.findByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Variables' })).toBeInTheDocument()
    expect(await screen.findByText('50% complete (1 of 2 lessons)')).toBeInTheDocument()
  })

  it('asks the learner to select a lesson first', async () => {
    renderWithApp(<LearnPage courseId={1} />, { api: learnerApi() })
    expect(await screen.findByText(/select a lesson/i)).toBeInTheDocument()
  })

  it('shows the content of the selected lesson', async () => {
    renderWithApp(<LearnPage courseId={1} />, { api: learnerApi() })
    await userEvent.click(await screen.findByRole('button', { name: 'Variables' }))
    expect(screen.getByText('A variable names a value.')).toBeInTheDocument()
  })

  it('marks a lesson complete and refreshes progress', async () => {
    const api = learnerApi()
    renderWithApp(<LearnPage courseId={1} />, { api })
    await userEvent.click(await screen.findByRole('button', { name: 'Variables' }))
    await userEvent.click(screen.getByRole('button', { name: /mark lesson complete/i }))
    expect(api.progress.completeLesson).toHaveBeenCalledWith(11)
    await waitFor(() => expect(api.progress.course).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Lesson marked complete.')).toBeInTheDocument()
  })

  it('shows a link to a quiz by its number', async () => {
    renderWithApp(<LearnPage courseId={1} />, { api: learnerApi() })
    await userEvent.type(await screen.findByLabelText('Quiz number'), '7')
    expect(screen.getByRole('link', { name: 'Open quiz 7' })).toHaveAttribute('href', '#/quizzes/7')
  })

  it('shows the server error when the learner is not enrolled', async () => {
    const api = makeApi({
      content: { listModules: vi.fn().mockRejectedValue(new ApiError(404, 'course 1 not found')) },
      progress: { course: vi.fn().mockResolvedValue(makeProgress()) },
    })
    renderWithApp(<LearnPage courseId={1} />, { api })
    expect(await screen.findByText('course 1 not found')).toBeInTheDocument()
  })
})
