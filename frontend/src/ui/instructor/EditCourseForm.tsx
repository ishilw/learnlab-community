import { useState, type FormEvent } from 'react'
import type { Course } from '../../types/models'
import { useApi } from '../apiContext'
import { StatusMessage } from '../components/StatusMessage'
import { TextField } from '../components/TextField'
import { useAction } from '../hooks/useAction'

interface EditCourseFormProps {
  course: Course
  onSaved: (course: Course) => void
}

export function EditCourseForm({ course, onSaved }: EditCourseFormProps) {
  const api = useApi()
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description)
  const { message, busy, run, fail } = useAction()
  const locked = course.status === 'archived'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return fail('Enter a title.')
    const input = { title: title.trim(), description }
    const saved = await run(() => api.courses.update(course.id, input), 'Course saved.')
    if (saved) onSaved(saved)
  }

  return (
    <form onSubmit={submit}>
      {locked && <p className="notice">Archived courses are read-only.</p>}
      <TextField id="edit-title" label="Title" value={title} onChange={setTitle} disabled={locked} />
      <TextField id="edit-description" label="Description" value={description} onChange={setDescription} disabled={locked} multiline />
      <StatusMessage message={message} />
      <button type="submit" disabled={busy || locked}>
        Save changes
      </button>
    </form>
  )
}
