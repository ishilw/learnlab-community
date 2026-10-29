
import { useState } from 'react'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { CourseList } from '../components/CourseList'
import { useAsync } from '../hooks/useAsync'

export function CatalogPage() {
  const api = useApi()
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')

  const result = useAsync(
    () => api.courses.list(search),
    [api, search]
  )

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearch(input.trim())
  }

  return (
    <section>
      <h1>Course catalog</h1>

      <form onSubmit={handleSearch}>
        <label htmlFor="course-search">Search courses</label>
        <div style={{ display: 'flex', gap: '8px', margin: '12px 0 20px' }}>
          <input
            id="course-search"
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search by title or description"
            style={{ flex: 1, padding: '10px' }}
          />
          <button type="submit">Search</button>
          <button
            type="button"
            onClick={() => {
              setInput('')
              setSearch('')
            }}
          >
            Clear
          </button>
        </div>
      </form>

      <AsyncView
        result={result}
        isEmpty={(courses) => courses.length === 0}
        emptyMessage={
          search
            ? `No courses found for "${search}".`
            : 'No published courses yet.'
        }
      >
        {(courses) => (
          <CourseList
            courses={courses}
            linkFor={(course) => `/courses/${course.id}`}
          />
        )}
      </AsyncView>
    </section>
  )
}
