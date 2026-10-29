// Shapes of the LearnLab API, taken from the backend's OpenAPI document (backend/src/api/schemas.py).

export type Role = 'learner' | 'instructor' | 'admin'

export const COURSE_STATUSES = ['draft', 'published', 'unpublished', 'archived'] as const
export type CourseStatus = (typeof COURSE_STATUSES)[number]

export const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived',
}

/**
 * Which states a course can move to. Provisional (CL-01). This only decides which buttons
 * to show. The backend enforces the real rules and rejects invalid transitions with 409.
 */
export const TRANSITION_TARGETS: Record<CourseStatus, CourseStatus[]> = {
  draft: ['published', 'archived'],
  published: ['unpublished', 'archived'],
  unpublished: ['published', 'archived'],
  archived: [],
}

export type QuestionKind = 'mcq' | 'true_false'

export interface Course {
  id: number
  title: string
  description: string
  owner_id: number
  status: CourseStatus
}

export interface Enrollment {
  course_id: number
  learner_id: number
}

export interface Lesson {
  id: number
  module_id: number
  title: string
  content: string
  position: number
}

export interface Module {
  id: number
  course_id: number
  title: string
  position: number
  lessons: Lesson[]
}

/** An answer choice. The API never reveals which choice is correct. */
export interface Option {
  id: number
  position: number
  text: string
}

export interface Question {
  id: number
  position: number
  kind: QuestionKind
  prompt: string
  options: Option[]
}

export interface Quiz {
  id: number
  lesson_id: number
  title: string
  questions: Question[]
}

export interface Attempt {
  id: number
  quiz_id: number
  learner_id: number
  score: number
  correct_count: number
  total_questions: number
  submitted_at: string
}

export interface BestScore {
  quiz_id: number
  best_score: number | null
  attempts: number
}

export interface Completion {
  lesson_id: number
  completed: boolean
}

export interface Progress {
  course_id: number
  completed_lessons: number
  total_lessons: number
  percent: number
}

export interface LearnerProgress {
  learner_id: number
  completed_lessons: number
  percent: number
}

export interface ProgressSummary {
  course_id: number
  total_lessons: number
  enrolled_learners: number
  average_percent: number
  learners: LearnerProgress[]
}

export interface McqQuestionInput {
  prompt: string
  choices: string[]
  correct_index: number
}

export interface TrueFalseQuestionInput {
  prompt: string
  correct: boolean
}
