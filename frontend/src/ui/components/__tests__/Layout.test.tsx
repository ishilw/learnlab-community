import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithApp } from '../../__tests__/renderWithApp'
import { Layout } from '../Layout'

describe('Layout', () => {
  it('renders the page inside a main landmark with a skip link', () => {
    renderWithApp(<Layout>Page body</Layout>)
    expect(screen.getByRole('main')).toHaveTextContent('Page body')
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument()
  })

  it('shows learner navigation', () => {
    renderWithApp(<Layout>x</Layout>, { role: 'learner' })
    const nav = screen.getByRole('navigation', { name: /main/i })
    expect(nav).toHaveTextContent('Catalog')
    expect(nav).toHaveTextContent('My courses')
    expect(nav).not.toHaveTextContent('Instructor')
  })

  it('shows instructor navigation', () => {
    renderWithApp(<Layout>x</Layout>, { role: 'instructor' })
    expect(screen.getByRole('link', { name: 'Instructor' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My courses' })).not.toBeInTheDocument()
  })

  it('signs out', async () => {
    const { sessionValue } = renderWithApp(<Layout>x</Layout>)
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(sessionValue.signOut).toHaveBeenCalled()
  })

  it('has no navigation when signed out', () => {
    renderWithApp(<Layout>x</Layout>, { userId: null })
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
