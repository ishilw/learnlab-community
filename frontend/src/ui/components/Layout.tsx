import type { MouseEvent, ReactNode } from 'react'
import type { Role } from '../../types/models'
import { Link } from '../router'
import { useSession } from '../session'

function focusMain(event: MouseEvent<HTMLAnchorElement>) {
  // The hash is the router's state, so the skip link focuses the element instead of navigating.
  event.preventDefault()
  document.getElementById('main')?.focus()
}

function MainNav({ role, onSignOut }: { role: Role; onSignOut: () => void }) {
  return (
    <nav aria-label="Main">
      <Link to="/catalog">Catalog</Link>
      {role === 'learner' && <Link to="/my-courses">My courses</Link>}
      {role !== 'learner' && <Link to="/instructor">Instructor</Link>}
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useSession()
  return (
    <>
      <a className="skip-link" href="#main" onClick={focusMain}>
        Skip to main content
      </a>
      <header className="app-header">
        <span className="brand">LearnLab</span>
        {session && <MainNav role={session.role} onSignOut={signOut} />}
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </>
  )
}
