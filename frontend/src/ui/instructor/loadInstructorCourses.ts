import type { Api } from '../../api/client'
import type { Course, Role } from '../../types/models'
import { rememberedCourseIds } from '../myCourses'

/**
 * The courses an instructor can manage. GET /courses returns published courses only, so the
 * instructor's own published courses come from it, and drafts or archived courses come from
 * ids remembered in this browser (see myCourses.ts). Administrators see every published course.
 */
export async function loadInstructorCourses(
  api: Api,
  userId: number,
  role: Role,
  storage: Pick<Storage, 'getItem'>,
): Promise<Course[]> {
  const catalog = await api.courses.list()
  const own = role === 'admin' ? catalog : catalog.filter((course) => course.owner_id === userId)
  const listed = new Set(own.map((course) => course.id))
  const extraIds = rememberedCourseIds(storage, userId).filter((id) => !listed.has(id))
  const extras = await Promise.allSettled(extraIds.map((id) => api.courses.get(id)))
  const found = extras.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  return [...own, ...found].sort((a, b) => a.id - b.id)
}
