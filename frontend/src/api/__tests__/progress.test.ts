import { progressApi } from '../progress'
import { fakeHttp } from './fakeHttp'

describe('progressApi', () => {
  it('completes a lesson with a POST and no body', async () => {
    const http = fakeHttp({})
    await progressApi(http).completeLesson(8)
    expect(http.post).toHaveBeenCalledWith('/lessons/8/completion')
  })

  it('reads course progress and the instructor summary', async () => {
    const http = fakeHttp({})
    const api = progressApi(http)
    await api.course(2)
    await api.summary(2)
    expect(http.get).toHaveBeenCalledWith('/courses/2/progress')
    expect(http.get).toHaveBeenCalledWith('/courses/2/progress-summary')
  })
})
