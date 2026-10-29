import { createApi } from '../client'
import { fakeHttp } from './fakeHttp'

describe('createApi', () => {
  it('groups the endpoint modules', () => {
    const api = createApi(fakeHttp())
    expect(Object.keys(api).sort()).toEqual(['content', 'courses', 'progress', 'quizzes'])
  })

  it('routes every group through the same Http instance', async () => {
    const http = fakeHttp({})
    const api = createApi(http)
    await api.courses.get(1)
    await api.progress.course(1)
    expect(http.get).toHaveBeenCalledTimes(2)
  })
})
