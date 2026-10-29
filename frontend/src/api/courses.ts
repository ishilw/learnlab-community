
import type { Course, CourseStatus, Enrollment } from '../types/models'
import type { Http } from './http'

export interface CourseInput {
  title: string
  description?: string
}

export function coursesApi(http: Http) {
  return {
    list: (search?: string) =>
      http.get<Course[]>(
        search?.trim()
          ? `/courses?search=${encodeURIComponent(search.trim())}`
          : '/courses'
      ),
    get: (id: number) => http.get<Course>(`/courses/${id}`),
    create: (input: CourseInput) => http.post<Course>('/courses', input),
    update: (id: number, input: Partial<CourseInput>) =>
      http.patch<Course>(`/courses/${id}`, input),
    transition: (id: number, target: CourseStatus) =>
      http.post<Course>(`/courses/${id}/transitions`, { target }),
    enroll: (id: number) => http.post<Enrollment>(`/courses/${id}/enrollments`),
    enrollments: () => http.get<Course[]>('/enrollments'),
  }
}

export type CoursesApi = ReturnType<typeof coursesApi>
