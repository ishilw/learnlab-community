import { useMemo, useRef, type ReactNode } from 'react'
import { createApi } from '../api/client'
import { createHttp } from '../api/http'
import { apiBaseUrl } from '../config/env'
import { ApiProvider } from './apiContext'
import { SessionProvider, useSession } from './session'

function ApiFromSession({ children }: { children: ReactNode }) {
  const { session } = useSession()
  // The client reads the user id at request time, so signing in or out needs no new client.
  const userId = useRef<number | null>(null)
  userId.current = session?.userId ?? null
  const api = useMemo(() => createApi(createHttp(apiBaseUrl(), () => userId.current)), [])
  return <ApiProvider api={api}>{children}</ApiProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ApiFromSession>{children}</ApiFromSession>
    </SessionProvider>
  )
}
