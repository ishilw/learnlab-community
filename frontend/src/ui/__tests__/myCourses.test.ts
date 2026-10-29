import { rememberCourse, rememberedCourseIds } from '../myCourses'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as unknown as Storage
}

describe('remembered courses', () => {
  it('starts empty', () => {
    expect(rememberedCourseIds(memoryStorage(), 1)).toEqual([])
  })

  it('remembers course ids per user without duplicates', () => {
    const storage = memoryStorage()
    rememberCourse(storage, 1, 10)
    rememberCourse(storage, 1, 11)
    rememberCourse(storage, 1, 10)
    rememberCourse(storage, 2, 99)
    expect(rememberedCourseIds(storage, 1)).toEqual([10, 11])
    expect(rememberedCourseIds(storage, 2)).toEqual([99])
  })

  it('ignores corrupted storage', () => {
    const storage = memoryStorage()
    storage.setItem('learnlab.courses.1', '{not json')
    expect(rememberedCourseIds(storage, 1)).toEqual([])
  })
})
