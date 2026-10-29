import type { Lesson, Module } from '../types/models'
import type { Http } from './http'

export interface LessonInput {
  title: string
  content: string
}

export function contentApi(http: Http) {
  return {
    listModules: (courseId: number) => http.get<Module[]>(`/courses/${courseId}/modules`),
    createModule: (courseId: number, title: string) =>
      http.post<Module>(`/courses/${courseId}/modules`, { title }),
    createLesson: (moduleId: number, input: LessonInput) =>
      http.post<Lesson>(`/modules/${moduleId}/lessons`, input),
  }
}

export type ContentApi = ReturnType<typeof contentApi>
