import { render, screen } from '@testing-library/react'
import { ApiProvider, useApi } from '../apiContext'
import { makeApi } from './renderWithApp'

function Probe() {
  const api = useApi()
  return <p>{typeof api.courses.list}</p>
}

describe('ApiProvider', () => {
  it('gives components the api it was created with', () => {
    render(
      <ApiProvider api={makeApi()}>
        <Probe />
      </ApiProvider>,
    )
    expect(screen.getByText('function')).toBeInTheDocument()
  })

  it('throws a clear error when the provider is missing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Probe />)).toThrow(/ApiProvider/)
    spy.mockRestore()
  })
})
