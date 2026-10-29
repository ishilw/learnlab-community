import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { vi } from 'vitest'
import type { Api } from '../../api/client'
import type { Role } from '../../types/models'
import { ApiProvider } from '../apiContext'
import { SessionContext, type SessionValue } from '../session'

const unstubbed = () => vi.fn().mockRejectedValue(new Error('endpoint not stubbed in this test'))

function coursesStub(): Api['courses'] {
  return {
    list: unstubbed(),
    get: unstubbed(),
    create: unstubbed(),
    update: unstubbed(),
    transition: unstubbed(),
    enroll: unstubbed(),
    enrollments: unstubbed(),
  }
}

function contentStub(): Api['content'] {
  return { listModules: unstubbed(), createModule: unstubbed(), createLesson: unstubbed() }
}

function quizzesStub(): Api['quizzes'] {
  return {
    create: unstubbed(),
    rename: unstubbed(),
    get: unstubbed(),
    listByLesson: vi.fn().mockResolvedValue([]),
    addMcq: unstubbed(),
    addTrueFalse: unstubbed(),
    submit: unstubbed(),
    attempts: unstubbed(),
    bestScore: unstubbed(),
  }
}

function progressStub(): Api['progress'] {
  return { completeLesson: unstubbed(), course: unstubbed(), summary: unstubbed() }
}

interface ApiOverrides {
  courses?: Partial<Api['courses']>
  content?: Partial<Api['content']>
  quizzes?: Partial<Api['quizzes']>
  progress?: Partial<Api['progress']>
}

/** An Api whose every endpoint rejects unless a test stubs it. */
export function makeApi(overrides: ApiOverrides = {}): Api {
  return {
    courses: { ...coursesStub(), ...overrides.courses },
    content: { ...contentStub(), ...overrides.content },
    quizzes: { ...quizzesStub(), ...overrides.quizzes },
    progress: { ...progressStub(), ...overrides.progress },
  }
}

interface RenderOptions {
  api?: Api
  role?: Role
  /** Pass null to render a signed-out session. */
  userId?: number | null
  hash?: string
}

export function renderWithApp(ui: ReactElement, options: RenderOptions = {}) {
  const api = options.api ?? makeApi()
  const session =
    options.userId === null ? null : { userId: options.userId ?? 1, role: options.role ?? 'learner' }
  const value: SessionValue = { session, signIn: vi.fn(), signOut: vi.fn() }
  window.location.hash = options.hash ?? '#/'
  const result = render(
    <SessionContext.Provider value={value}>
      <ApiProvider api={api}>{ui}</ApiProvider>
    </SessionContext.Provider>,
  )
  return { ...result, api, sessionValue: value }
}
