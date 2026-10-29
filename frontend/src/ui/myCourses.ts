// The API has no "my courses" route for instructors: GET /courses lists published courses only,
// so drafts and archived courses cannot be discovered. As a local workaround this remembers the
// ids of courses an instructor created in this browser. A backend route would replace it.

const storageKey = (userId: number) => `learnlab.courses.${userId}`

export function rememberedCourseIds(storage: Pick<Storage, 'getItem'>, userId: number): number[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(storageKey(userId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : []
  } catch {
    return []
  }
}

export function rememberCourse(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  userId: number,
  courseId: number,
): void {
  const ids = rememberedCourseIds(storage, userId)
  if (!ids.includes(courseId)) storage.setItem(storageKey(userId), JSON.stringify([...ids, courseId]))
}
