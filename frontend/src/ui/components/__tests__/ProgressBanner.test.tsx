import { render, screen } from '@testing-library/react'
import { makeProgress } from '../../__tests__/fixtures'
import { ProgressBanner } from '../ProgressBanner'

const reload = vi.fn()

describe('ProgressBanner', () => {
  it('shows a loading status', () => {
    render(<ProgressBanner result={{ status: 'loading', reload }} />)
    expect(screen.getByRole('status')).toHaveTextContent(/loading progress/i)
  })

  it('shows the error', () => {
    render(<ProgressBanner result={{ status: 'error', error: new Error('no access'), reload }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('no access')
  })

  it('shows the integer percentage and the lesson counts', () => {
    render(<ProgressBanner result={{ status: 'success', data: makeProgress(), reload }} />)
    expect(screen.getByText('50% complete (1 of 2 lessons)')).toBeInTheDocument()
    expect(screen.getByLabelText('Course progress')).toHaveAttribute('value', '50')
  })
})
