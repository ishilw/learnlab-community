import { act, renderHook, waitFor } from '@testing-library/react'
import { useAsync } from '../useAsync'

describe('useAsync', () => {
  it('starts loading and then resolves with data', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(5), []))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current).toMatchObject({ status: 'success', data: 5 })
  })

  it('reports a rejected promise as an error state', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(new Error('boom')), []))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({ status: 'error' })
    expect((result.current as { error: Error }).error.message).toBe('boom')
  })

  it('wraps a non-error rejection in an Error', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject('plain'), []))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect((result.current as { error: Error }).error).toBeInstanceOf(Error)
  })

  it('loads again when reload is called', async () => {
    const load = vi.fn().mockResolvedValue('x')
    const { result } = renderHook(() => useAsync(load, []))
    await waitFor(() => expect(result.current.status).toBe('success'))
    act(() => result.current.reload())
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })

  it('loads again when a dependency changes', async () => {
    const load = vi.fn().mockResolvedValue('x')
    const { result, rerender } = renderHook(({ id }) => useAsync(load, [id]), {
      initialProps: { id: 1 },
    })
    await waitFor(() => expect(result.current.status).toBe('success'))
    rerender({ id: 2 })
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })
})
