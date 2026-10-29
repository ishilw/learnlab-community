import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readSession, SessionProvider, useSession } from '../session'

function memoryStorage(initial?: string) {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set('learnlab.session', initial)
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  } as unknown as Storage
}

describe('readSession', () => {
  it('reads a stored session', () => {
    const stored = JSON.stringify({ userId: 4, role: 'instructor' })
    expect(readSession(memoryStorage(stored))).toEqual({ userId: 4, role: 'instructor' })
  })

  it.each([
    ['nothing stored', undefined],
    ['invalid JSON', '{nope'],
    ['an unknown role', JSON.stringify({ userId: 1, role: 'root' })],
    ['a non-positive id', JSON.stringify({ userId: 0, role: 'learner' })],
    ['a fractional id', JSON.stringify({ userId: 1.5, role: 'learner' })],
  ])('returns null for %s', (_label, raw) => {
    expect(readSession(memoryStorage(raw))).toBeNull()
  })
})

describe('SessionProvider', () => {
  function Probe() {
    const { session, signIn, signOut } = useSession()
    return (
      <div>
        <p>{session ? `${session.role}:${session.userId}` : 'signed out'}</p>
        <button onClick={() => signIn(9, 'admin')}>in</button>
        <button onClick={signOut}>out</button>
      </div>
    )
  }

  it('signs in, persists the session, and signs out', async () => {
    const storage = memoryStorage()
    render(
      <SessionProvider storage={storage}>
        <Probe />
      </SessionProvider>,
    )
    expect(screen.getByText('signed out')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'in' }))
    expect(screen.getByText('admin:9')).toBeInTheDocument()
    expect(readSession(storage)).toEqual({ userId: 9, role: 'admin' })
    await userEvent.click(screen.getByRole('button', { name: 'out' }))
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(readSession(storage)).toBeNull()
  })

  it('restores a stored session', () => {
    const storage = memoryStorage(JSON.stringify({ userId: 2, role: 'learner' }))
    render(
      <SessionProvider storage={storage}>
        <Probe />
      </SessionProvider>,
    )
    expect(screen.getByText('learner:2')).toBeInTheDocument()
  })

  it('throws when useSession is used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Probe />)).toThrow()
    spy.mockRestore()
  })
})
