import type { Completion, Progress, ProgressSummary } from '../types/models'
import type { Http } from './http'

export function progressApi(http: Http) {
  return {
    completeLesson: (lessonId: number) => http.post<Completion>(`/lessons/${lessonId}/completion`),
    course: (courseId: number) => http.get<Progress>(`/courses/${courseId}/progress`),
    summary: (courseId: number) =>
      http.get<ProgressSummary>(`/courses/${courseId}/progress-summary`),
  }
}

export type ProgressApi = ReturnType<typeof progressApi>
