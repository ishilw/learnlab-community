import { act, render, screen, waitFor } from '@testing-library/react'
import { Link, navigate, parseHash, routeId, useHashRoute } from '../router'

describe('parseHash', () => {
  it.each([
    ['', 'home'],
    ['#/', 'home'],
    ['#/login', 'login'],
    ['#/catalog', 'catalog'],
    ['#/my-courses', 'my-courses'],
    ['#/instructor', 'instructor'],
  ])('maps %s to %s', (hash, name) => {
    expect(parseHash(hash).name).toBe(name)
  })

  it('extracts ids from parameterised routes', () => {
    expect(parseHash('#/courses/12')).toEqual({ name: 'course', params: { courseId: '12' } })
    expect(parseHash('#/courses/12/learn')).toEqual({ name: 'learn', params: { courseId: '12' } })
    expect(parseHash('#/quizzes/5')).toEqual({ name: 'quiz', params: { quizId: '5' } })
    expect(parseHash('#/instructor/courses/3').name).toBe('instructor-course')
    expect(parseHash('#/instructor/quizzes/8').params).toEqual({ quizId: '8' })
  })

  it('reports unknown paths as not-found', () => {
    expect(parseHash('#/nope').name).toBe('not-found')
    expect(parseHash('#/courses/abc').name).toBe('not-found')
  })
})

describe('routeId', () => {
  it('reads a numeric id from the route', () => {
    expect(routeId(parseHash('#/courses/12'), 'courseId')).toBe(12)
  })
})

describe('Link', () => {
  it('renders an anchor to the hash route', () => {
    render(<Link to="/catalog">Catalog</Link>)
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('href', '#/catalog')
  })
})

describe('useHashRoute', () => {
  function Probe() {
    return <p>{useHashRoute().name}</p>
  }

  it('follows hash changes', async () => {
    window.location.hash = '#/catalog'
    render(<Probe />)
    expect(screen.getByText('catalog')).toBeInTheDocument()
    act(() => navigate('/my-courses'))
    await waitFor(() => expect(screen.getByText('my-courses')).toBeInTheDocument())
  })
})
