import { useState, type FormEvent } from 'react'
import type { Role } from '../../types/models'
import { navigate } from '../router'
import { useSession } from '../session'

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'learner', label: 'Learner' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'admin', label: 'Administrator' },
]

function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <>
      <label htmlFor="view-as">View as</label>
      <select id="view-as" value={value} onChange={(event) => onChange(event.target.value as Role)}>
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  )
}

interface LoginFormProps {
  onSubmit: (userId: string, role: Role) => void
  error: string | null
}

function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<Role>('learner')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(userId, role)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="user-id">User id</label>
      <input id="user-id" inputMode="numeric" value={userId} onChange={(e) => setUserId(e.target.value)} />
      <RoleSelect value={role} onChange={setRole} />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  )
}

export function LoginPage() {
  const { signIn } = useSession()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(userId: string, role: Role) {
    const id = Number(userId)
    if (!Number.isInteger(id) || id < 1) {
      setError('Enter a positive whole number.')
      return
    }
    signIn(id, role)
    navigate(role === 'learner' ? '/catalog' : '/instructor')
  }

  return (
    <section>
      <h1>Sign in</h1>
      <p className="notice">
        This is a local development identity. The backend trusts the user id you enter, so this is
        not authentication. The role only changes which screens you see. The backend decides what
        you may do.
      </p>
      <LoginForm onSubmit={handleSubmit} error={error} />
    </section>
  )
}
