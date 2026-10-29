export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface Http {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>

/** The server's `detail` text, which FastAPI returns as a string or a list of validation errors. */
export function detailMessage(payload: unknown, fallback: string): string {
  const detail = (payload as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => (item as { msg?: string }).msg ?? '').filter(Boolean)
    return messages.join('; ') || fallback
  }
  return fallback
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Builds the HTTP client. The X-User-Id header is the backend's local-development identity
 * stub (requirement CC-01 is not specified yet). It is not authentication.
 */
export function createHttp(
  baseUrl: string,
  getUserId: () => number | null,
  fetcher: Fetcher = (input, init) => fetch(input, init),
): Http {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {}
    const userId = getUserId()
    if (userId !== null) headers['X-User-Id'] = String(userId)
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const init = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }
    const response = await fetcher(`${baseUrl}${path}`, init)
    const payload = await readJson(response)
    if (!response.ok) {
      const fallback = response.statusText || `Request failed (${response.status})`
      throw new ApiError(response.status, detailMessage(payload, fallback))
    }
    return payload as T
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  }
}
