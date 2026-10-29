import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeAttempt, makeQuiz } from '../../__tests__/fixtures'
import { QuizPage } from '../QuizPage'

function quizApi(submit = vi.fn().mockResolvedValue(makeAttempt({ score: 100, correct_count: 2, total_questions: 2 }))) {
  return makeApi({
    quizzes: {
      get: vi.fn().mockResolvedValue(makeQuiz()),
      submit,
      bestScore: vi.fn().mockResolvedValue({ quiz_id: 7, best_score: 100, attempts: 2 }),
      attempts: vi.fn().mockResolvedValue([makeAttempt(), makeAttempt({ id: 2, score: 100 })]),
    },
  })
}

async function answerAndSubmit() {
  await userEvent.click(await screen.findByRole('radio', { name: 'Paris' }))
  await userEvent.click(screen.getByRole('radio', { name: 'True' }))
  await userEvent.click(screen.getByRole('button', { name: /submit answers/i }))
}

describe('QuizPage', () => {
  it('shows each question with its choices as radio buttons', async () => {
    renderWithApp(<QuizPage quizId={7} />, { api: quizApi() })
    expect(await screen.findByRole('group', { name: 'Capital of France?' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('submits the chosen option for each question', async () => {
    const api = quizApi()
    renderWithApp(<QuizPage quizId={7} />, { api })
    await answerAndSubmit()
    expect(api.quizzes.submit).toHaveBeenCalledWith(7, { 1: 11, 2: 21 })
  })

  it('shows the score, the best score, and every attempt', async () => {
    renderWithApp(<QuizPage quizId={7} />, { api: quizApi() })
    await answerAndSubmit()
    expect(await screen.findByText('Your score: 100%')).toBeInTheDocument()
    expect(await screen.findByText('Best score: 100% after 2 attempts')).toBeInTheDocument()
    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
  })

  it('lets the learner try again', async () => {
    renderWithApp(<QuizPage quizId={7} />, { api: quizApi() })
    await answerAndSubmit()
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('button', { name: /submit answers/i })).toBeInTheDocument()
  })

  it('never shows which answer is correct', async () => {
    renderWithApp(<QuizPage quizId={7} />, { api: quizApi() })
    await screen.findByRole('group', { name: 'Capital of France?' })
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument()
  })

  it('shows a submission error', async () => {
    const submit = vi.fn().mockRejectedValue(new ApiError(422, 'option 99 is not valid'))
    renderWithApp(<QuizPage quizId={7} />, { api: quizApi(submit) })
    await answerAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('not valid')
  })

  it('shows an empty message for a quiz without questions', async () => {
    const api = makeApi({ quizzes: { get: vi.fn().mockResolvedValue(makeQuiz({ questions: [] })) } })
    renderWithApp(<QuizPage quizId={7} />, { api })
    expect(await screen.findByText(/no questions yet/i)).toBeInTheDocument()
  })
})
