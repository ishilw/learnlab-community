import { useState } from 'react'
import type { Lesson, Module } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { ProgressBanner } from '../components/ProgressBanner'
import { StatusMessage, type Message } from '../components/StatusMessage'
import { errorText } from '../errors'
import { useAsync } from '../hooks/useAsync'
import { Link } from '../router'

interface ModuleItemProps {
  module: Module
  selected: number | null
  onSelect: (lesson: Lesson) => void
}

function ModuleItem({ module, selected, onSelect }: ModuleItemProps) {
  return (
    <li>
      <h2>{module.title}</h2>
      <ul>
        {module.lessons.map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              aria-current={lesson.id === selected ? 'true' : undefined}
              onClick={() => onSelect(lesson)}
            >
              {lesson.title}
            </button>
          </li>
        ))}
      </ul>
    </li>
  )
}

function ModuleNav({ modules, selected, onSelect }: { modules: Module[] } & Omit<ModuleItemProps, 'module'>) {
  return (
    <nav aria-label="Course modules">
      <ol>
        {modules.map((module) => (
          <ModuleItem key={module.id} module={module} selected={selected} onSelect={onSelect} />
        ))}
      </ol>
    </nav>
  )
}

function CompleteButton({ lessonId, onCompleted }: { lessonId: number; onCompleted: () => void }) {
  const api = useApi()
  const [message, setMessage] = useState<Message | null>(null)

  async function complete() {
    try {
      await api.progress.completeLesson(lessonId)
      setMessage({ kind: 'ok', text: 'Lesson marked complete.' })
      onCompleted()
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
    }
  }

  return (
    <div className="actions">
      <button type="button" onClick={complete}>
        Mark lesson complete
      </button>
      <StatusMessage message={message} />
    </div>
  )
}

function LessonPanel({ lesson, onCompleted }: { lesson: Lesson | null; onCompleted: () => void }) {
  if (!lesson) return <p>Select a lesson to begin.</p>
  return (
    <article className="lesson">
      <h2>{lesson.title}</h2>
      <div className="lesson-content">{lesson.content}</div>
      <CompleteButton key={lesson.id} lessonId={lesson.id} onCompleted={onCompleted} />
    </article>
  )
}

/**
 * The API cannot list the quizzes of a lesson, so a learner opens a quiz by the number the
 * instructor gives them. A backend route for lesson quizzes would replace this.
 */
function QuizLauncher() {
  const [value, setValue] = useState('')
  const quizId = Number(value)
  const valid = Number.isInteger(quizId) && quizId > 0
  return (
    <div className="quiz-launcher">
      <label htmlFor="quiz-number">Quiz number</label>
      <input id="quiz-number" type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} />
      {valid && <Link to={`/quizzes/${quizId}`}>{`Open quiz ${quizId}`}</Link>}
      <p className="hint">Your instructor gives you the number of each quiz.</p>
    </div>
  )
}

export function LearnPage({ courseId }: { courseId: number }) {
  const api = useApi()
  const modules = useAsync(() => api.content.listModules(courseId), [api, courseId])
  const progress = useAsync(() => api.progress.course(courseId), [api, courseId])
  const [lesson, setLesson] = useState<Lesson | null>(null)
  return (
    <section>
      <h1>Course content</h1>
      <ProgressBanner result={progress} />
      <AsyncView
        result={modules}
        isEmpty={(items) => items.length === 0}
        emptyMessage="This course has no content yet."
      >
        {(items) => (
          <div className="learn-layout">
            <ModuleNav modules={items} selected={lesson?.id ?? null} onSelect={setLesson} />
            <LessonPanel lesson={lesson} onCompleted={progress.reload} />
          </div>
        )}
      </AsyncView>
      <QuizLauncher />
    </section>
  )
}
