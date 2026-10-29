import type { ReactNode } from 'react'
import { errorText } from '../errors'
import type { AsyncResult } from '../hooks/useAsync'

interface AsyncViewProps<T> {
  result: AsyncResult<T>
  isEmpty?: (data: T) => boolean
  emptyMessage?: string
  children: (data: T) => ReactNode
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="error-state">
      <p role="alert">{errorText(error)}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

/** Renders the loading, error, empty, and success states of an async result. */
export function AsyncView<T>({
  result,
  isEmpty,
  emptyMessage = 'Nothing to show yet.',
  children,
}: AsyncViewProps<T>) {
  if (result.status === 'loading') return <p role="status">Loading…</p>
  if (result.status === 'error') return <ErrorState error={result.error} onRetry={result.reload} />
  if (isEmpty?.(result.data)) return <p role="status">{emptyMessage}</p>
  return <>{children(result.data)}</>
}
