import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Role } from '../types/models'

/**
 * The signed-in identity for local development.
 *
 * The backend has no sign-in or "who am I" endpoint yet (requirement CC-01), so the user id
 * is sent as the X-User-Id header and the role is chosen on the sign-in screen. The role only
 * decides which screens and links are shown. The backend decides what is allowed.
 */
export interface Session {
  userId: number
  role: Role
}

export interface SessionValue {
  session: Session | null
  signIn: (userId: number, role: Role) => void
  signOut: () => void
}

const ROLES: readonly Role[] = ['learner', 'instructor', 'admin']
const STORAGE_KEY = 'learnlab.session'

export const SessionContext = createContext<SessionValue | null>(null)

export function readSession(storage: Pick<Storage, 'getItem'>): Session | null {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Partial<Session> | null
    if (!parsed || !Number.isInteger(parsed.userId) || (parsed.userId as number) < 1) return null
    return ROLES.includes(parsed.role as Role) ? (parsed as Session) : null
  } catch {
    return null
  }
}

interface SessionProviderProps {
  children: ReactNode
  storage?: Storage
}

export function SessionProvider({ children, storage = window.localStorage }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(() => readSession(storage))

  const signIn = useCallback(
    (userId: number, role: Role) => {
      const next = { userId, role }
      storage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
    },
    [storage],
  )

  const signOut = useCallback(() => {
    storage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [storage])

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('SessionProvider is missing from the component tree')
  return value
}
