import { useState, type FormEvent } from 'react'
import type { Lesson, Module, Quiz } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { StatusMessage } from '../components/StatusMessage'
import { TextField } from '../components/TextField'
import { useAction } from '../hooks/useAction'
import { useAsync, type AsyncResult } from '../hooks/useAsync'
import { Link } from '../router'

function AddModuleForm({ courseId, onAdded }: { courseId: number; onAdded: () => void }) {
  const api = useApi()
  const [title, setTitle] = useState('')
  const { message, busy, run, fail } = useAction()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return fail('Enter a module title.')
    const created = await run(() => api.content.createModule(courseId, title.trim()))
    if (created) {
      setTitle('')
      onAdded()
    }
  }

  return (
    <form onSubmit={submit}>
      <TextField id="module-title" label="Module title" value={title} onChange={setTitle} />
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Add module
      </button>
    </form>
  )
}

function AddLessonForm({ moduleId, onAdded }: { moduleId: number; onAdded: () => void }) {
  const api = useApi()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const { message, busy, run, fail } = useAction()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return fail('Enter a lesson title.')
    const created = await run(() => api.content.createLesson(moduleId, { title: title.trim(), content }))
    if (created) onAdded()
  }

  return (
    <form onSubmit={submit}>
      <TextField id={`lesson-title-${moduleId}`} label="Lesson title" value={title} onChange={setTitle} />
      <TextField id={`lesson-content-${moduleId}`} label="Lesson content" value={content} onChange={setContent} multiline />
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Add lesson
      </button>
    </form>
  )
}

function QuizLinks({ lessonId, listing }: { lessonId: number; listing: AsyncResult<Quiz[]> }) {
  return (
    <AsyncView result={listing} isEmpty={(items) => items.length === 0} emptyMessage="No quizzes yet.">
      {(items) => (
        <ul aria-label={`Quizzes for lesson ${lessonId}`}>
          {items.map((quiz) => (
            <li key={quiz.id}>
              {quiz.title} <Link to={`/instructor/quizzes/${quiz.id}`}>{`Author quiz ${quiz.id}`}</Link>
            </li>
          ))}
        </ul>
      )}
    </AsyncView>
  )
}

function CreateQuizForm({ lessonId }: { lessonId: number }) {
  const api = useApi()
  const [title, setTitle] = useState('')
  const listing = useAsync(() => api.quizzes.listByLesson(lessonId), [api, lessonId])
  const { message, busy, run, fail } = useAction()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return fail('Enter a quiz title.')
    const quiz = await run(() => api.quizzes.create(lessonId, title.trim()))
    if (quiz) {
      setTitle('')
      listing.reload()
    }
  }

  return (
    <form onSubmit={submit}>
      <TextField id={`quiz-title-${lessonId}`} label="Quiz title" value={title} onChange={setTitle} />
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Create quiz
      </button>
      <QuizLinks lessonId={lessonId} listing={listing} />
    </form>
  )
}

function LessonRow({ lesson, readOnly }: { lesson: Lesson; readOnly: boolean }) {
  return (
    <li>
      <strong>{lesson.title}</strong>
      {!readOnly && <CreateQuizForm lessonId={lesson.id} />}
    </li>
  )
}

interface ModuleSectionProps {
  module: Module
  readOnly: boolean
  onChanged: () => void
}

function ModuleSection({ module, readOnly, onChanged }: ModuleSectionProps) {
  return (
    <section className="module">
      <h3>{module.title}</h3>
      <ul>
        {module.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} readOnly={readOnly} />
        ))}
      </ul>
      {!readOnly && <AddLessonForm moduleId={module.id} onAdded={onChanged} />}
    </section>
  )
}

export function ContentManager({ courseId, archived }: { courseId: number; archived: boolean }) {
  const api = useApi()
  const modules = useAsync(() => api.content.listModules(courseId), [api, courseId])
  return (
    <div>
      {archived && <p className="notice">Archived courses are read-only.</p>}
      <AsyncView result={modules} isEmpty={(items) => items.length === 0} emptyMessage="This course has no modules yet.">
        {(items) => (
          <>
            {items.map((module) => (
              <ModuleSection key={module.id} module={module} readOnly={archived} onChanged={modules.reload} />
            ))}
          </>
        )}
      </AsyncView>
      {!archived && <AddModuleForm courseId={courseId} onAdded={modules.reload} />}
    </div>
  )
}
