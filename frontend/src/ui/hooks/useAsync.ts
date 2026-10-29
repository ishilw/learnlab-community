import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T }

export type AsyncResult<T> = AsyncState<T> & { reload: () => void }

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/** Runs `load` on mount and whenever `deps` change, and again on `reload()`. */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    load().then(
      (data) => {
        if (active) setState({ status: 'success', data })
      },
      (error: unknown) => {
        if (active) setState({ status: 'error', error: toError(error) })
      },
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, reload }
}
