import type { LearnerProgress, ProgressSummary } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { useAsync } from '../hooks/useAsync'

function LearnerTable({ learners }: { learners: LearnerProgress[] }) {
  return (
    <table>
      <caption>Learner progress</caption>
      <thead>
        <tr>
          <th scope="col">Learner</th>
          <th scope="col">Lessons completed</th>
          <th scope="col">Progress</th>
        </tr>
      </thead>
      <tbody>
        {learners.map((learner) => (
          <tr key={learner.learner_id}>
            <td>{`Learner ${learner.learner_id}`}</td>
            <td>{learner.completed_lessons}</td>
            <td>{`${learner.percent}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SummaryView({ summary }: { summary: ProgressSummary }) {
  return (
    <div>
      <ul className="stats">
        <li>{`Enrolled learners: ${summary.enrolled_learners}`}</li>
        <li>{`Average progress: ${summary.average_percent}%`}</li>
        <li>{`Lessons in course: ${summary.total_lessons}`}</li>
      </ul>
      {summary.learners.length === 0 ? (
        <p>No learners are enrolled yet.</p>
      ) : (
        <LearnerTable learners={summary.learners} />
      )}
    </div>
  )
}

export function ProgressReport({ courseId }: { courseId: number }) {
  const api = useApi()
  const result = useAsync(() => api.progress.summary(courseId), [api, courseId])
  return <AsyncView result={result}>{(summary) => <SummaryView summary={summary} />}</AsyncView>
}
