import { contentApi } from '../content'
import { fakeHttp } from './fakeHttp'

describe('contentApi', () => {
  it('lists modules with their lessons', async () => {
    const http = fakeHttp([])
    await contentApi(http).listModules(2)
    expect(http.get).toHaveBeenCalledWith('/courses/2/modules')
  })

  it('creates a module', async () => {
    const http = fakeHttp({})
    await contentApi(http).createModule(2, 'Basics')
    expect(http.post).toHaveBeenCalledWith('/courses/2/modules', { title: 'Basics' })
  })

  it('creates a lesson in a module', async () => {
    const http = fakeHttp({})
    await contentApi(http).createLesson(5, { title: 'L1', content: 'text' })
    expect(http.post).toHaveBeenCalledWith('/modules/5/lessons', { title: 'L1', content: 'text' })
  })
})
