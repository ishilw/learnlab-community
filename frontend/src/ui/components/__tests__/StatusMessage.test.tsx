import { render, screen } from '@testing-library/react'
import { StatusMessage } from '../StatusMessage'

describe('StatusMessage', () => {
  it('announces errors as alerts', () => {
    render(<StatusMessage message={{ kind: 'error', text: 'Nope' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Nope')
  })

  it('announces success as a polite status', () => {
    render(<StatusMessage message={{ kind: 'ok', text: 'Saved' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
  })

  it('renders nothing without a message', () => {
    const { container } = render(<StatusMessage message={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
