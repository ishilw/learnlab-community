import { ApiError, createHttp, detailMessage } from '../http'

function jsonResponse(body: unknown, status = 200, statusText = '') {
  return new Response(JSON.stringify(body), { status, statusText })
}

describe('createHttp', () => {
  it('sends the X-User-Id header when a user is signed in', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse([]))
    await createHttp('/api', () => 7, fetcher).get('/courses')
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('/api/courses')
    expect(init.headers['X-User-Id']).toBe('7')
    expect(init.method).toBe('GET')
  })

  it('omits the header when nobody is signed in', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse([]))
    await createHttp('/api', () => null, fetcher).get('/courses')
    expect(fetcher.mock.calls[0][1].headers).not.toHaveProperty('X-User-Id')
  })

  it('sends JSON bodies with a content type', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }, 201))
    await createHttp('/api', () => 1, fetcher).post('/courses', { title: 'Intro' })
    const init = fetcher.mock.calls[0][1]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ title: 'Intro' }))
  })

  it('does not send a body or content type for a POST without one', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({}, 201))
    await createHttp('/api', () => 1, fetcher).post('/courses/1/enrollments')
    const init = fetcher.mock.calls[0][1]
    expect(init.body).toBeUndefined()
    expect(init.headers).not.toHaveProperty('Content-Type')
  })

  it('returns the parsed payload on success', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ id: 3, title: 'T' }))
    const result = await createHttp('/api', () => 1, fetcher).get('/courses/3')
    expect(result).toEqual({ id: 3, title: 'T' })
  })

  it('throws an ApiError carrying the status and the server detail', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ detail: 'only learners enroll' }, 403))
    const http = createHttp('/api', () => 1, fetcher)
    await expect(http.post('/courses/1/enrollments')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'only learners enroll',
    })
  })

  it('falls back to the status text when the body is not JSON', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('boom', { status: 500, statusText: 'Server Error' }))
    const http = createHttp('/api', () => 1, fetcher)
    await expect(http.get('/courses')).rejects.toBeInstanceOf(ApiError)
    await expect(http.get('/courses')).rejects.toMatchObject({ status: 500, message: 'Server Error' })
  })
})

describe('detailMessage', () => {
  it('joins FastAPI validation messages', () => {
    const payload = { detail: [{ msg: 'field required' }, { msg: 'too short' }] }
    expect(detailMessage(payload, 'fallback')).toBe('field required; too short')
  })

  it('uses the fallback when there is no detail', () => {
    expect(detailMessage(null, 'fallback')).toBe('fallback')
    expect(detailMessage({}, 'fallback')).toBe('fallback')
  })
})
