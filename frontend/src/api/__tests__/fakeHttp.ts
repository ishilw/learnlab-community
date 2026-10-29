import { vi } from 'vitest'
import type { Http } from '../http'

/** An Http double that records calls and resolves every request with `result`. */
export function fakeHttp(result: unknown = {}) {
  const http = {
    get: vi.fn().mockResolvedValue(result),
    post: vi.fn().mockResolvedValue(result),
    patch: vi.fn().mockResolvedValue(result),
  }
  return http as unknown as Http & typeof http
}
