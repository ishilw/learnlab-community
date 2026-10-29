export interface Message {
  kind: 'ok' | 'error'
  text: string
}

/** Errors are announced as alerts and confirmations as polite status updates. */
export function StatusMessage({ message }: { message: Message | null }) {
  if (!message) return null
  const role = message.kind === 'error' ? 'alert' : 'status'
  return (
    <p role={role} className={`message message-${message.kind}`}>
      {message.text}
    </p>
  )
}
