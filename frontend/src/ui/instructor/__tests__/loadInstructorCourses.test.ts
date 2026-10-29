import { makeApi } from '../../__tests__/renderWithApp'
import { makeCourse } from '../../__tests__/fixtures'
import { rememberCourse } from '../../myCourses'
import { loadInstructorCourses } from '../loadInstructorCourses'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as unknown as Storage
}

const mine = makeCourse({ id: 1, owner_id: 7 })
const theirs = makeCourse({ id: 2, owner_id: 8 })

describe('loadInstructorCourses', () => {
  it('keeps only the published courses the instructor owns', async () => {
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([mine, theirs]) } })
    const result = await loadInstructorCourses(api, 7, 'instructor', memoryStorage())
    expect(result.map((c) => c.id)).toEqual([1])
  })

  it('gives administrators every published course', async () => {
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([mine, theirs]) } })
    const result = await loadInstructorCourses(api, 7, 'admin', memoryStorage())
    expect(result.map((c) => c.id)).toEqual([1, 2])
  })

  it('adds remembered drafts and sorts by id', async () => {
    const storage = memoryStorage()
    rememberCourse(storage, 7, 5)
    const draft = makeCourse({ id: 5, status: 'draft', owner_id: 7 })
    const api = makeApi({
      courses: { list: vi.fn().mockResolvedValue([mine]), get: vi.fn().mockResolvedValue(draft) },
    })
    const result = await loadInstructorCourses(api, 7, 'instructor', storage)
    expect(result.map((c) => c.id)).toEqual([1, 5])
  })

  it('does not fetch or duplicate a remembered course that is already listed', async () => {
    const storage = memoryStorage()
    rememberCourse(storage, 7, 1)
    const get = vi.fn()
    const api = makeApi({ courses: { list: vi.fn().mockResolvedValue([mine]), get } })
    const result = await loadInstructorCourses(api, 7, 'instructor', storage)
    expect(result).toHaveLength(1)
    expect(get).not.toHaveBeenCalled()
  })

  it('ignores remembered courses that can no longer be loaded', async () => {
    const storage = memoryStorage()
    rememberCourse(storage, 7, 5)
    const api = makeApi({
      courses: { list: vi.fn().mockResolvedValue([mine]), get: vi.fn().mockRejectedValue(new Error('gone')) },
    })
    const result = await loadInstructorCourses(api, 7, 'instructor', storage)
    expect(result.map((c) => c.id)).toEqual([1])
  })
})
