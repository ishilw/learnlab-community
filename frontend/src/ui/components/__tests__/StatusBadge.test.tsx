import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['draft', 'Draft'],
    ['published', 'Published'],
    ['unpublished', 'Unpublished'],
    ['archived', 'Archived'],
  ] as const)('labels %s as %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
