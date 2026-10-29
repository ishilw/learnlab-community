import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeApi, renderWithApp } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { rememberCourse, rememberedCourseIds } from '../../myCourses'
import { InstructorHomePage } from '../InstructorHomePage'

const options = { role: 'instructor', userId: 1 } as const

beforeEach(() => window.localStorage.clear())

describe('InstructorHomePage', () => {
  it('lists the instructor’s own courses and links to their editors', async () => {
    const list = vi.fn().mockResolvedValue([
      makeCourse({ id: 1, title: 'Mine', owner_id: 1 }),
      makeCourse({ id: 2, title: 'Other', owner_id: 99 }),
    ])
    renderWithApp(<InstructorHomePage />, { ...options, api: makeApi({ courses: { list } }) })
    const link = await screen.findByRole('link', { name: 'Mine' })
    expect(link).toHaveAttribute('href', '#/instructor/courses/1')
    expect(screen.queryByRole('link', { name: 'Other' })).not.toBeInTheDocument()
  })

  it('includes drafts the instructor created in this browser', async () => {
    rememberCourse(window.localStorage, 1, 5)
    const draft = makeCourse({ id: 5, title: 'My draft', status: 'draft', owner_id: 1 })
    const api = makeApi({
      courses: { list: vi.fn().mockResolvedValue([]), get: vi.fn().mockResolvedValue(draft) },
    })
    renderWithApp(<InstructorHomePage />, { ...options, api })
    expect(await screen.findByRole('link', { name: 'My draft' })).toBeInTheDocument()
  })

  it('creates a course, remembers it, and opens its editor', async () => {
    const create = vi.fn().mockResolvedValue(makeCourse({ id: 9, status: 'draft' }))
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([]), create } })
    renderWithApp(<InstructorHomePage />, { ...options, api })
    await userEvent.type(await screen.findByLabelText('Title'), 'New course')
    await userEvent.type(screen.getByLabelText('Description'), 'About it')
    await userEvent.click(screen.getByRole('button', { name: 'Create course' }))
    expect(create).toHaveBeenCalledWith({ title: 'New course', description: 'About it' })
    await waitFor(() => expect(window.location.hash).toBe('#/instructor/courses/9'))
    expect(rememberedCourseIds(window.localStorage, 1)).toEqual([9])
  })

  it('requires a title', async () => {
    const create = vi.fn()
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([]), create } })
    renderWithApp(<InstructorHomePage />, { ...options, api })
    await userEvent.click(await screen.findByRole('button', { name: 'Create course' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title.')
    expect(create).not.toHaveBeenCalled()
  })

  it('shows the server error when creation is refused', async () => {
    const create = vi.fn().mockRejectedValue(new Error('only instructors and administrators create courses'))
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([]), create } })
    renderWithApp(<InstructorHomePage />, { ...options, api })
    await userEvent.type(await screen.findByLabelText('Title'), 'X')
    await userEvent.click(screen.getByRole('button', { name: 'Create course' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('only instructors')
  })
})
