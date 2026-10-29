import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeQuiz } from '../../__tests__/fixtures'
import { QuizAuthoringPage } from '../QuizAuthoringPage'

const question = { id: 3, position: 3, kind: 'mcq', prompt: 'New', options: [] }

function authoringApi(overrides: Parameters<typeof makeApi>[0] = {}) {
  const get = vi.fn().mockResolvedValue(makeQuiz())
  return makeApi({ ...overrides, quizzes: { get, ...overrides.quizzes } })
}

const options = { role: 'instructor' } as const

async function fillMcq(prompt: string, choices: string[], correct: string) {
  await userEvent.type(await screen.findByLabelText('Question text'), prompt)
  for (const [index, text] of choices.entries()) {
    if (text) await userEvent.type(screen.getByLabelText(`Choice ${index + 1}`), text)
  }
  await userEvent.selectOptions(screen.getByLabelText('Correct choice'), correct)
}

describe('QuizAuthoringPage', () => {
  it('lists the questions and their choices without any answer key', async () => {
    renderWithApp(<QuizAuthoringPage quizId={7} />, { ...options, api: authoringApi() })
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument()
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.queryByText(/\(correct\)|is correct|✓/i)).not.toBeInTheDocument()
  })

  it('adds a multiple-choice question and reloads the quiz', async () => {
    const addMcq = vi.fn().mockResolvedValue(question)
    const api = authoringApi({ quizzes: { addMcq } })
    renderWithApp(<QuizAuthoringPage quizId={7} />, { ...options, api })
    await fillMcq('Pick one', ['a', 'b', '', ''], '2')
    await userEvent.click(screen.getByRole('button', { name: 'Add multiple-choice question' }))
    expect(addMcq).toHaveBeenCalledWith(7, { prompt: 'Pick one', choices: ['a', 'b'], correct_index: 1 })
    await waitFor(() => expect(api.quizzes.get).toHaveBeenCalledTimes(2))
  })

  it('rejects a multiple-choice question with one choice', async () => {
    const addMcq = vi.fn()
    renderWithApp(<QuizAuthoringPage quizId={7} />, { ...options, api: authoringApi({ quizzes: { addMcq } }) })
    await fillMcq('Pick one', ['a', '', '', ''], '1')
    await userEvent.click(screen.getByRole('button', { name: 'Add multiple-choice question' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('at least two choices')
    expect(addMcq).not.toHaveBeenCalled()
  })

  it('adds a true/false question', async () => {
    const addTrueFalse = vi.fn().mockResolvedValue({ ...question, kind: 'true_false' })
    renderWithApp(<QuizAuthoringPage quizId={7} />, { ...options, api: authoringApi({ quizzes: { addTrueFalse } }) })
    await userEvent.type(await screen.findByLabelText('Statement'), 'Water is wet')
    await userEvent.selectOptions(screen.getByLabelText('Correct answer'), 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Add true/false question' }))
    expect(addTrueFalse).toHaveBeenCalledWith(7, { prompt: 'Water is wet', correct: false })
  })

  it('shows the lock message once an attempt exists', async () => {
    const addTrueFalse = vi.fn().mockRejectedValue(new ApiError(409, 'questions cannot change after the first attempt'))
    renderWithApp(<QuizAuthoringPage quizId={7} />, { ...options, api: authoringApi({ quizzes: { addTrueFalse } }) })
    await userEvent.type(await screen.findByLabelText('Statement'), 'Late')
    await userEvent.click(screen.getByRole('button', { name: 'Add true/false question' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('after the first attempt')
  })

  it('shows the server error when the quiz cannot be loaded', async () => {
    const api = makeApi({ quizzes: { get: vi.fn().mockRejectedValue(new ApiError(404, 'quiz 7 not found')) } })
    renderWithApp(<QuizAuthoringPage quizId={7} />, { ...options, api })
    expect(await screen.findByRole('alert')).toHaveTextContent('quiz 7 not found')
  })
})
