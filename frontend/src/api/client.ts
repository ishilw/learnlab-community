import { contentApi } from './content'
import { coursesApi } from './courses'
import type { Http } from './http'
import { progressApi } from './progress'
import { quizzesApi } from './quizzes'

/** Every backend call the frontend makes. Each method maps to a route in the FastAPI app. */
export function createApi(http: Http) {
  return {
    courses: coursesApi(http),
    content: contentApi(http),
    quizzes: quizzesApi(http),
    progress: progressApi(http),
  }
}

export type Api = ReturnType<typeof createApi>
