import { coursesApi } from '../courses'
import { fakeHttp } from './fakeHttp'

describe('coursesApi', () => {
  it('lists the catalog', async () => {
    const http = fakeHttp([])
    await coursesApi(http).list()
    expect(http.get).toHaveBeenCalledWith('/courses')
  })

  it('gets one course', async () => {
    const http = fakeHttp({})
    await coursesApi(http).get(4)
    expect(http.get).toHaveBeenCalledWith('/courses/4')
  })

  it('creates a course', async () => {
    const http = fakeHttp({})
    await coursesApi(http).create({ title: 'Intro', description: 'd' })
    expect(http.post).toHaveBeenCalledWith('/courses', { title: 'Intro', description: 'd' })
  })

  it('updates a course with PATCH', async () => {
    const http = fakeHttp({})
    await coursesApi(http).update(4, { title: 'New' })
    expect(http.patch).toHaveBeenCalledWith('/courses/4', { title: 'New' })
  })

  it('requests a lifecycle transition', async () => {
    const http = fakeHttp({})
    await coursesApi(http).transition(4, 'published')
    expect(http.post).toHaveBeenCalledWith('/courses/4/transitions', { target: 'published' })
  })

  it('enrolls and lists enrollments', async () => {
    const http = fakeHttp({})
    const api = coursesApi(http)
    await api.enroll(4)
    await api.enrollments()
    expect(http.post).toHaveBeenCalledWith('/courses/4/enrollments')
    expect(http.get).toHaveBeenCalledWith('/enrollments')
  })
})
