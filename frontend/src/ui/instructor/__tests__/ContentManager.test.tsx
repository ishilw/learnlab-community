import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeLesson, makeModule } from '../../__tests__/fixtures'
import { ContentManager } from '../ContentManager'

function managerApi(overrides: Parameters<typeof makeApi>[0] = {}) {
  const listModules = vi.fn().mockResolvedValue([makeModule()])
  return makeApi({ ...overrides, content: { listModules, ...overrides.content } })
}

describe('ContentManager', () => {
  it('lists modules and their lessons', async () => {
    renderWithApp(<ContentManager courseId={1} archived={false} />, { role: 'instructor', api: managerApi() })
    expect(await screen.findByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
    expect(screen.getByText('Variables')).toBeInTheDocument()
  })

  it('adds a module and reloads the list', async () => {
    const createModule = vi.fn().mockResolvedValue(makeModule({ id: 6, title: 'Basics' }))
    const api = managerApi({ content: { createModule } })
    renderWithApp(<ContentManager courseId={1} archived={false} />, { role: 'instructor', api })
    await userEvent.type(await screen.findByLabelText('Module title'), 'Basics')
    await userEvent.click(screen.getByRole('button', { name: 'Add module' }))
    expect(createModule).toHaveBeenCalledWith(1, 'Basics')
    await waitFor(() => expect(api.content.listModules).toHaveBeenCalledTimes(2))
  })

  it('adds a lesson to a module', async () => {
    const createLesson = vi.fn().mockResolvedValue(makeLesson({ id: 12 }))
    const api = managerApi({ content: { createLesson } })
    renderWithApp(<ContentManager courseId={1} archived={false} />, { role: 'instructor', api })
    await userEvent.type(await screen.findByLabelText('Lesson title'), 'Loops')
    await userEvent.type(screen.getByLabelText('Lesson content'), 'for and while')
    await userEvent.click(screen.getByRole('button', { name: 'Add lesson' }))
    expect(createLesson).toHaveBeenCalledWith(5, { title: 'Loops', content: 'for and while' })
  })

  it('creates a quiz for a lesson and links to its editor', async () => {
    const quiz = { id: 7, lesson_id: 11, title: 'Quiz 1', questions: [] }
    const create = vi.fn().mockResolvedValue(quiz)
    const listByLesson = vi.fn().mockResolvedValueOnce([]).mockResolvedValue([quiz])
    const api = managerApi({ quizzes: { create, listByLesson } })
    renderWithApp(<ContentManager courseId={1} archived={false} />, { role: 'instructor', api })
    await userEvent.type(await screen.findByLabelText('Quiz title'), 'Quiz 1')
    await userEvent.click(screen.getByRole('button', { name: 'Create quiz' }))
    expect(create).toHaveBeenCalledWith(11, 'Quiz 1')
    const link = await screen.findByRole('link', { name: 'Author quiz 7' })
    expect(link).toHaveAttribute('href', '#/instructor/quizzes/7')
  })

  it('lists existing quizzes as authoring links after a remount', async () => {
    const listByLesson = vi.fn().mockResolvedValue([
      { id: 7, lesson_id: 11, title: 'Week 1', questions: [] },
      { id: 9, lesson_id: 11, title: 'Week 2', questions: [] },
    ])
    const api = managerApi({ quizzes: { listByLesson } })
    const first = renderWithApp(<ContentManager courseId={1} archived={false} />, { role: 'instructor', api })
    expect(await screen.findByRole('link', { name: 'Author quiz 7' })).toHaveAttribute('href', '#/instructor/quizzes/7')
    first.unmount()
    renderWithApp(<ContentManager courseId={1} archived={false} />, { role: 'instructor', api })
    expect(await screen.findByRole('link', { name: 'Author quiz 7' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Author quiz 9' })).toHaveAttribute('href', '#/instructor/quizzes/9')
    expect(screen.getByText('Week 2')).toBeInTheDocument()
    expect(listByLesson).toHaveBeenCalledWith(11)
  })

  it('refreshes the quiz list from the server after creating a quiz', async () => {
    const created = { id: 8, lesson_id: 11, title: 'New', questions: [] }
    const listByLesson = vi.fn().mockResolvedValueOnce([]).mockResolvedValue([created])
    const create = vi.fn().mockResolvedValue(created)
    renderWithApp(<ContentManager courseId={1} archived={false} />, {
      role: 'instructor',
      api: managerApi({ quizzes: { listByLesson, create } }),
    })
    await userEvent.type(await screen.findByLabelText('Quiz title'), 'New')
    await userEvent.click(screen.getByRole('button', { name: 'Create quiz' }))
    expect(await screen.findByRole('link', { name: 'Author quiz 8' })).toBeInTheDocument()
    expect(listByLesson).toHaveBeenCalledTimes(2)
  })

  it('shows the server error when quizzes cannot be listed and retries', async () => {
    const listByLesson = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(403, 'only the course owner may manage this'))
      .mockResolvedValue([{ id: 7, lesson_id: 11, title: 'Week 1', questions: [] }])
    renderWithApp(<ContentManager courseId={1} archived={false} />, {
      role: 'instructor',
      api: managerApi({ quizzes: { listByLesson } }),
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('only the course owner may manage this')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Author quiz 7' })).toBeInTheDocument()
  })

  it('requires titles', async () => {
    const createModule = vi.fn()
    renderWithApp(<ContentManager courseId={1} archived={false} />, {
      role: 'instructor',
      api: managerApi({ content: { createModule } }),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Add module' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a module title.')
    expect(createModule).not.toHaveBeenCalled()
  })

  it('shows the server error from a refused change', async () => {
    const createModule = vi.fn().mockRejectedValue(new ApiError(409, 'archived courses cannot be changed'))
    renderWithApp(<ContentManager courseId={1} archived={false} />, {
      role: 'instructor',
      api: managerApi({ content: { createModule } }),
    })
    await userEvent.type(await screen.findByLabelText('Module title'), 'X')
    await userEvent.click(screen.getByRole('button', { name: 'Add module' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('cannot be changed')
  })

  it('is read-only for an archived course', async () => {
    renderWithApp(<ContentManager courseId={1} archived />, { role: 'instructor', api: managerApi() })
    expect(await screen.findByText(/archived courses are read-only/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add module' })).not.toBeInTheDocument()
  })
})
