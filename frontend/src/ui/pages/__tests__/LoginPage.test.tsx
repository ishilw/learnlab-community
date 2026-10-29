import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithApp } from '../../__tests__/renderWithApp'
import { LoginPage } from '../LoginPage'

describe('LoginPage', () => {
  it('signs in with a valid id and the chosen role', async () => {
    const { sessionValue } = renderWithApp(<LoginPage />, { userId: null })
    await userEvent.type(screen.getByLabelText('User id'), '3')
    await userEvent.selectOptions(screen.getByLabelText('View as'), 'instructor')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(sessionValue.signIn).toHaveBeenCalledWith(3, 'instructor')
  })

  it('rejects an invalid id without signing in', async () => {
    const { sessionValue } = renderWithApp(<LoginPage />, { userId: null })
    await userEvent.type(screen.getByLabelText('User id'), '0')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/positive whole number/i)
    expect(sessionValue.signIn).not.toHaveBeenCalled()
  })

  it('says this is a development identity and not authentication', () => {
    renderWithApp(<LoginPage />, { userId: null })
    expect(screen.getByText(/not authentication/i)).toBeInTheDocument()
  })
})
