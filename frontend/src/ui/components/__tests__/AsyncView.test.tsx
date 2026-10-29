import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AsyncResult } from '../../hooks/useAsync'
import { AsyncView } from '../AsyncView'

const reload = vi.fn()

const isEmpty = (items: string[]) => items.length === 0

function renderItems(items: string[]) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function showResult(result: AsyncResult<string[]>) {
  return render(
    <AsyncView result={result} isEmpty={isEmpty} emptyMessage="Nothing here.">
      {renderItems}
    </AsyncView>,
  )
}

describe('AsyncView', () => {
  it('shows a loading status', () => {
    showResult({ status: 'loading', reload })
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  })

  it('shows the error and offers a retry', async () => {
    showResult({ status: 'error', error: new Error('boom'), reload })
    expect(screen.getByRole('alert')).toHaveTextContent('boom')
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('shows the empty message', () => {
    showResult({ status: 'success', data: [], reload })
    expect(screen.getByRole('status')).toHaveTextContent('Nothing here.')
  })

  it('renders the data', () => {
    showResult({ status: 'success', data: ['a', 'b'], reload })
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
