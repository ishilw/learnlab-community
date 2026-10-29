import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { EditCourseForm } from '../EditCourseForm'

describe('EditCourseForm', () => {
  it('starts with the current title and description', () => {
    renderWithApp(<EditCourseForm course={makeCourse()} onSaved={vi.fn()} />)
    expect(screen.getByLabelText('Title')).toHaveValue('Intro to Python')
    expect(screen.getByLabelText('Description')).toHaveValue('Learn the basics.')
  })

  it('saves the changes and tells the parent', async () => {
    const saved = makeCourse({ title: 'Renamed' })
    const update = vi.fn().mockResolvedValue(saved)
    const onSaved = vi.fn()
    renderWithApp(<EditCourseForm course={makeCourse()} onSaved={onSaved} />, {
      api: makeApi({ courses: { update } }),
    })
    const title = screen.getByLabelText('Title')
    await userEvent.clear(title)
    await userEvent.type(title, 'Renamed')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(update).toHaveBeenCalledWith(1, { title: 'Renamed', description: 'Learn the basics.' })
    expect(await screen.findByRole('status')).toHaveTextContent('Course saved.')
    expect(onSaved).toHaveBeenCalledWith(saved)
  })

  it('does not save a blank title', async () => {
    const update = vi.fn()
    renderWithApp(<EditCourseForm course={makeCourse()} onSaved={vi.fn()} />, {
      api: makeApi({ courses: { update } }),
    })
    await userEvent.clear(screen.getByLabelText('Title'))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title.')
    expect(update).not.toHaveBeenCalled()
  })

  it('is read-only for archived courses', () => {
    renderWithApp(<EditCourseForm course={makeCourse({ status: 'archived' })} onSaved={vi.fn()} />)
    expect(screen.getByLabelText('Title')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.getByText(/archived courses are read-only/i)).toBeInTheDocument()
  })

  it('shows the server error', async () => {
    const update = vi.fn().mockRejectedValue(new ApiError(403, 'only the course owner or an administrator may update it'))
    renderWithApp(<EditCourseForm course={makeCourse()} onSaved={vi.fn()} />, {
      api: makeApi({ courses: { update } }),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('only the course owner')
  })
})
