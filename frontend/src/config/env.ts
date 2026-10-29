export const DEFAULT_API_BASE_URL = '/api'

interface ApiEnv {
  VITE_API_BASE_URL?: string
}

/** The base URL for API calls, from VITE_API_BASE_URL, without a trailing slash. */
export function apiBaseUrl(env: ApiEnv = import.meta.env): string {
  const raw = env.VITE_API_BASE_URL?.trim()
  return raw ? raw.replace(/\/+$/, '') : DEFAULT_API_BASE_URL
}
