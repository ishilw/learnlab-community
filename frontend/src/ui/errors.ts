const FALLBACK = 'Something went wrong. Please try again.'

/** A user-facing message for any thrown value. API errors already carry the server's detail. */
export function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : FALLBACK
}
