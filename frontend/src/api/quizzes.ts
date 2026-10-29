import type {
  Attempt,
  BestScore,
  McqQuestionInput,
  Question,
  Quiz,
  TrueFalseQuestionInput,
} from '../types/models'
import type { Http } from './http'

export function quizzesApi(http: Http) {
  return {
    create: (lessonId: number, title: string) =>
      http.post<Quiz>(`/lessons/${lessonId}/quizzes`, { title }),
    rename: (quizId: number, title: string) => http.patch<Quiz>(`/quizzes/${quizId}`, { title }),
    listByLesson: (lessonId: number) => http.get<Quiz[]>(`/lessons/${lessonId}/quizzes`),
    get: (quizId: number) => http.get<Quiz>(`/quizzes/${quizId}`),
    addMcq: (quizId: number, input: McqQuestionInput) =>
      http.post<Question>(`/quizzes/${quizId}/questions/mcq`, input),
    addTrueFalse: (quizId: number, input: TrueFalseQuestionInput) =>
      http.post<Question>(`/quizzes/${quizId}/questions/true-false`, input),
    submit: (quizId: number, answers: Record<number, number>) =>
      http.post<Attempt>(`/quizzes/${quizId}/attempts`, { answers }),
    attempts: (quizId: number) => http.get<Attempt[]>(`/quizzes/${quizId}/attempts`),
    bestScore: (quizId: number) => http.get<BestScore>(`/quizzes/${quizId}/best-score`),
  }
}

export type QuizzesApi = ReturnType<typeof quizzesApi>
