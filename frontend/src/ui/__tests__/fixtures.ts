import type { Attempt, Course, Lesson, Module, Progress, Quiz } from '../../types/models'

export const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 1,
  title: 'Intro to Python',
  description: 'Learn the basics.',
  owner_id: 2,
  status: 'published',
  ...overrides,
})

export const makeLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 11,
  module_id: 5,
  title: 'Variables',
  content: 'A variable names a value.',
  position: 1,
  ...overrides,
})

export const makeModule = (overrides: Partial<Module> = {}): Module => ({
  id: 5,
  course_id: 1,
  title: 'Getting started',
  position: 1,
  lessons: [makeLesson()],
  ...overrides,
})

export const makeProgress = (overrides: Partial<Progress> = {}): Progress => ({
  course_id: 1,
  completed_lessons: 1,
  total_lessons: 2,
  percent: 50,
  ...overrides,
})

export const makeAttempt = (overrides: Partial<Attempt> = {}): Attempt => ({
  id: 1,
  quiz_id: 7,
  learner_id: 1,
  score: 50,
  correct_count: 1,
  total_questions: 2,
  submitted_at: '2026-01-01T10:00:00+00:00',
  ...overrides,
})

export const makeQuiz = (overrides: Partial<Quiz> = {}): Quiz => ({
  id: 7,
  lesson_id: 11,
  title: 'Basics quiz',
  questions: [
    {
      id: 1,
      position: 1,
      kind: 'mcq',
      prompt: 'Capital of France?',
      options: [
        { id: 11, position: 1, text: 'Paris' },
        { id: 12, position: 2, text: 'Rome' },
      ],
    },
    {
      id: 2,
      position: 2,
      kind: 'true_false',
      prompt: 'The sky is blue.',
      options: [
        { id: 21, position: 1, text: 'True' },
        { id: 22, position: 2, text: 'False' },
      ],
    },
  ],
  ...overrides,
})
