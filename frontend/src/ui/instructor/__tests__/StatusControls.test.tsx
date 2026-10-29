import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/http'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { StatusControls } from '../StatusControls'

afterEach(() => vi.restoreAllMocks())

describe('StatusControls', () => {
  it('offers publish and archive for a draft', () => {
    renderWithApp(<StatusControls course={makeCourse({ status: 'draft' })} onChanged={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archive course' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Unpublish' })).not.toBeInTheDocument()
  })

  it('offers unpublish for a published course', () => {
    renderWithApp(<StatusControls course={makeCourse({ status: 'published' })} onChanged={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
  })

  it('offers publish again for an unpublished course', () => {
    renderWithApp(<StatusControls course={makeCourse({ status: 'unpublished' })} onChanged={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
  })

  it('offers nothing for an archived course', () => {
    renderWithApp(<StatusControls course={makeCourse({ status: 'archived' })} onChanged={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/archived courses cannot change state/i)).toBeInTheDocument()
  })

  it('requests the transition and reports the new state', async () => {
    const updated = makeCourse({ status: 'published' })
    const transition = vi.fn().mockResolvedValue(updated)
    const onChanged = vi.fn()
    renderWithApp(<StatusControls course={makeCourse({ status: 'draft' })} onChanged={onChanged} />, {
      api: makeApi({ courses: { transition } }),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(transition).toHaveBeenCalledWith(1, 'published')
    expect(await screen.findByRole('status')).toHaveTextContent('Course is now Published.')
    expect(onChanged).toHaveBeenCalledWith(updated)
  })

  it('asks for confirmation before archiving and does nothing when declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const transition = vi.fn()
    renderWithApp(<StatusControls course={makeCourse({ status: 'published' })} onChanged={vi.fn()} />, {
      api: makeApi({ courses: { transition } }),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Archive course' }))
    expect(window.confirm).toHaveBeenCalled()
    expect(transition).not.toHaveBeenCalled()
  })

  it('archives after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const transition = vi.fn().mockResolvedValue(makeCourse({ status: 'archived' }))
    renderWithApp(<StatusControls course={makeCourse({ status: 'published' })} onChanged={vi.fn()} />, {
      api: makeApi({ courses: { transition } }),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Archive course' }))
    expect(transition).toHaveBeenCalledWith(1, 'archived')
  })

  it('shows the server message when the backend rejects the transition', async () => {
    const transition = vi.fn().mockRejectedValue(new ApiError(409, 'invalid course transition: published -> draft'))
    renderWithApp(<StatusControls course={makeCourse({ status: 'draft' })} onChanged={vi.fn()} />, {
      api: makeApi({ courses: { transition } }),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid course transition')
  })
})
