import { screen } from '@testing-library/react'
import { makeApi, renderWithApp } from './renderWithApp'
import { makeCourse, makeProgress } from './fixtures'
import { App } from '../App'

const catalogApi = () =>
  makeApi({ courses: { list: vi.fn().mockResolvedValue([makeCourse()]) } })

describe('App', () => {
  it('shows the sign-in screen when nobody is signed in', () => {
    renderWithApp(<App />, { userId: null, hash: '#/catalog' })
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows the catalog route to a signed-in learner', async () => {
    renderWithApp(<App />, { hash: '#/catalog', api: catalogApi() })
    expect(await screen.findByRole('heading', { name: 'Course catalog' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /main/i })).toBeInTheDocument()
  })

  it('shows the course detail route', async () => {
    const api = makeApi({ courses: { get: vi.fn().mockResolvedValue(makeCourse()) } })
    renderWithApp(<App />, { hash: '#/courses/1', api })
    expect(await screen.findByRole('heading', { name: 'Intro to Python' })).toBeInTheDocument()
  })

  it('shows the learner’s courses route', async () => {
    const api = makeApi({
      courses: { enrollments: vi.fn().mockResolvedValue([makeCourse()]) },
      progress: { course: vi.fn().mockResolvedValue(makeProgress()) },
    })
    renderWithApp(<App />, { hash: '#/my-courses', api })
    expect(await screen.findByRole('heading', { name: 'My courses', level: 1 })).toBeInTheDocument()
  })

  it('shows the instructor route to an instructor', async () => {
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([]) } })
    renderWithApp(<App />, { role: 'instructor', hash: '#/instructor', api })
    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument()
  })

  it('reports an unknown route', () => {
    renderWithApp(<App />, { hash: '#/nowhere' })
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('sends the home route to the role’s landing page', async () => {
    renderWithApp(<App />, { hash: '#/', api: catalogApi() })
    expect(await screen.findByRole('heading', { name: 'Course catalog' })).toBeInTheDocument()
  })
})
