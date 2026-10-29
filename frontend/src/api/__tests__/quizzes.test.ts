import { quizzesApi } from '../quizzes'
import { fakeHttp } from './fakeHttp'

describe('quizzesApi', () => {
  it('creates a quiz for a lesson', async () => {
    const http = fakeHttp({})
    await quizzesApi(http).create(9, 'Quiz')
    expect(http.post).toHaveBeenCalledWith('/lessons/9/quizzes', { title: 'Quiz' })
  })

  it('renames and reads a quiz', async () => {
    const http = fakeHttp({})
    const api = quizzesApi(http)
    await api.rename(3, 'Final')
    await api.get(3)
    expect(http.patch).toHaveBeenCalledWith('/quizzes/3', { title: 'Final' })
    expect(http.get).toHaveBeenCalledWith('/quizzes/3')
  })

  it('adds an MCQ question', async () => {
    const http = fakeHttp({})
    const body = { prompt: 'Q', choices: ['a', 'b'], correct_index: 1 }
    await quizzesApi(http).addMcq(3, body)
    expect(http.post).toHaveBeenCalledWith('/quizzes/3/questions/mcq', body)
  })

  it('adds a True/False question', async () => {
    const http = fakeHttp({})
    await quizzesApi(http).addTrueFalse(3, { prompt: 'Q', correct: true })
    expect(http.post).toHaveBeenCalledWith('/quizzes/3/questions/true-false', {
      prompt: 'Q',
      correct: true,
    })
  })

  it('submits answers keyed by question id', async () => {
    const http = fakeHttp({})
    await quizzesApi(http).submit(3, { 1: 10, 2: 20 })
    expect(http.post).toHaveBeenCalledWith('/quizzes/3/attempts', { answers: { 1: 10, 2: 20 } })
  })

  it('reads attempts and the best score', async () => {
    const http = fakeHttp([])
    const api = quizzesApi(http)
    await api.attempts(3)
    await api.bestScore(3)
    expect(http.get).toHaveBeenCalledWith('/quizzes/3/attempts')
    expect(http.get).toHaveBeenCalledWith('/quizzes/3/best-score')
  })

  it('lists the quizzes of a lesson', async () => {
    const http = fakeHttp([])
    await quizzesApi(http).listByLesson(9)
    expect(http.get).toHaveBeenCalledWith('/lessons/9/quizzes')
  })
})
