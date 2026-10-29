import { render, screen } from '@testing-library/react'
import { AppProviders } from '../AppProviders'
import { useApi } from '../apiContext'
import { useSession } from '../session'

function Probe() {
  const api = useApi()
  const { session } = useSession()
  return (
    <p>
      {typeof api.courses.list} {session ? 'signed in' : 'signed out'}
    </p>
  )
}

describe('AppProviders', () => {
  beforeEach(() => window.localStorage.clear())

  it('provides the session and an api client', () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    )
    expect(screen.getByText('function signed out')).toBeInTheDocument()
  })

  it('restores a stored session', () => {
    window.localStorage.setItem('learnlab.session', JSON.stringify({ userId: 3, role: 'learner' }))
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    )
    expect(screen.getByText('function signed in')).toBeInTheDocument()
  })
})
