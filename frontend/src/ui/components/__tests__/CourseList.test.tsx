import { render, screen } from '@testing-library/react'
import { makeCourse } from '../../__tests__/fixtures'
import { CourseList } from '../CourseList'

describe('CourseList', () => {
  it('links each course using the supplied link builder', () => {
    render(<CourseList courses={[makeCourse({ id: 4 })]} linkFor={(c) => `/x/${c.id}`} />)
    expect(screen.getByRole('link', { name: 'Intro to Python' })).toHaveAttribute('href', '#/x/4')
  })

  it('shows the status and falls back when there is no description', () => {
    render(<CourseList courses={[makeCourse({ description: '', status: 'draft' })]} linkFor={() => '/'} />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('No description.')).toBeInTheDocument()
  })
})
