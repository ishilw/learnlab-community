import { useState } from 'react'
import type { Message } from '../components/StatusMessage'
import { errorText } from '../errors'

/**
 * Runs a user action (a form submit or a button press) and tracks its busy flag and the
 * message to show. A failure shows the server's own message and returns undefined.
 */
export function useAction() {
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)

  async function run<T>(action: () => Promise<T>, successText?: string): Promise<T | undefined> {
    setBusy(true)
    setMessage(null)
    try {
      const result = await action()
      if (successText) setMessage({ kind: 'ok', text: successText })
      return result
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
      return undefined
    } finally {
      setBusy(false)
    }
  }

  const fail = (text: string) => setMessage({ kind: 'error', text })

  return { message, busy, run, fail }
}
