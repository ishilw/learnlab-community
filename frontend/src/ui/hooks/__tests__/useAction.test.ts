import { act, renderHook } from '@testing-library/react'
import { ApiError } from '../../../api/http'
import { useAction } from '../useAction'

describe('useAction', () => {
  it('returns the result and reports success', async () => {
    const { result } = renderHook(() => useAction())
    let value: number | undefined
    await act(async () => {
      value = await result.current.run(() => Promise.resolve(4), 'Saved')
    })
    expect(value).toBe(4)
    expect(result.current.message).toEqual({ kind: 'ok', text: 'Saved' })
    expect(result.current.busy).toBe(false)
  })

  it('reports the server message and returns undefined on failure', async () => {
    const { result } = renderHook(() => useAction())
    let value: number | undefined = 1
    await act(async () => {
      value = await result.current.run(() => Promise.reject(new ApiError(403, 'forbidden')))
    })
    expect(value).toBeUndefined()
    expect(result.current.message).toEqual({ kind: 'error', text: 'forbidden' })
    expect(result.current.busy).toBe(false)
  })

  it('can set a message directly', () => {
    const { result } = renderHook(() => useAction())
    act(() => result.current.fail('Enter a title.'))
    expect(result.current.message).toEqual({ kind: 'error', text: 'Enter a title.' })
  })
})
