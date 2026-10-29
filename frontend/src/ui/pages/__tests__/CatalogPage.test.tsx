import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { CatalogPage } from '../CatalogPage'
import { fireEvent, screen, waitFor } from '@testing-library/react'

describe('CatalogPage', () => {
  it('shows a loading status first', () => {
    const list = vi.fn().mockReturnValue(new Promise(() => {}))
    renderWithApp(<CatalogPage />, { api: makeApi({ courses: { list } }) })
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  })

  it('lists published courses with links to their details', async () => {
    const list = vi.fn().mockResolvedValue([makeCourse(), makeCourse({ id: 2, title: 'Algebra' })])
    renderWithApp(<CatalogPage />, { api: makeApi({ courses: { list } }) })
    const link = await screen.findByRole('link', { name: 'Intro to Python' })
    expect(link).toHaveAttribute('href', '#/courses/1')
    expect(screen.getByRole('link', { name: 'Algebra' })).toBeInTheDocument()
  })

  it('shows an empty message', async () => {
    renderWithApp(<CatalogPage />, { api: makeApi({ courses: { list: vi.fn().mockResolvedValue([]) } }) })
    expect(await screen.findByText(/no published courses/i)).toBeInTheDocument()
  })

  it('shows the error from the server', async () => {
    const list = vi.fn().mockRejectedValue(new ApiError(401, 'unknown user'))
    renderWithApp(<CatalogPage />, { api: makeApi({ courses: { list } }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('unknown user')
  })
  
  it('searches courses by keyword', async () => {
    const list = vi.fn().mockResolvedValue([
      makeCourse({ title: 'Python Fundamentals' }),
    ])

    renderWithApp(<CatalogPage />, {
      api: makeApi({ courses: { list } }),
    })

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'python' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith('python')
    })
  })

  it('clears the course search', async () => {
    const list = vi.fn().mockResolvedValue([])

    renderWithApp(<CatalogPage />, {
      api: makeApi({ courses: { list } }),
    })

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'AWS' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith('AWS')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith('')
    })

    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

})
