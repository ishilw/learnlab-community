import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextField } from '../TextField'

describe('TextField', () => {
  it('associates the label with a text input', () => {
    render(<TextField id="t" label="Title" value="abc" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Title')).toHaveValue('abc')
    expect(screen.getByLabelText('Title').tagName).toBe('INPUT')
  })

  it('reports typed text', async () => {
    const onChange = vi.fn()
    render(<TextField id="t" label="Title" value="" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Title'), 'x')
    expect(onChange).toHaveBeenCalledWith('x')
  })

  it('renders a textarea when multiline', () => {
    render(<TextField id="d" label="Description" value="" onChange={vi.fn()} multiline />)
    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA')
  })

  it('can be disabled', () => {
    render(<TextField id="t" label="Title" value="" onChange={vi.fn()} disabled />)
    expect(screen.getByLabelText('Title')).toBeDisabled()
  })
})
