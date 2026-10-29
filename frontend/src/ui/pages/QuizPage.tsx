import { useState, type FormEvent } from 'react'
import type { Attempt, Question, Quiz } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { StatusMessage, type Message } from '../components/StatusMessage'
import { errorText } from '../errors'
import { useAsync } from '../hooks/useAsync'

type Answers = Record<number, number>

interface FieldsetProps {
  question: Question
  selected: number | undefined
  onSelect: (optionId: number) => void
}

function QuestionFieldset({ question, selected, onSelect }: FieldsetProps) {
  return (
    <fieldset>
      <legend>{question.prompt}</legend>
      {question.options.map((option) => (
        <label key={option.id} className="choice">
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={selected === option.id}
            onChange={() => onSelect(option.id)}
          />
          {option.text}
        </label>
      ))}
    </fieldset>
  )
}

interface QuestionListProps {
  questions: Question[]
  answers: Answers
  onAnswer: (questionId: number, optionId: number) => void
}

function QuestionList({ questions, answers, onAnswer }: QuestionListProps) {
  return (
    <>
      {questions.map((question) => (
        <QuestionFieldset
          key={question.id}
          question={question}
          selected={answers[question.id]}
          onSelect={(optionId) => onAnswer(question.id, optionId)}
        />
      ))}
    </>
  )
}

function useSubmission(quizId: number, onSubmitted: (attempt: Attempt) => void) {
  const api = useApi()
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(answers: Answers) {
    setBusy(true)
    setMessage(null)
    try {
      onSubmitted(await api.quizzes.submit(quizId, answers))
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
      setBusy(false)
    }
  }

  return { message, busy, submit }
}

function QuizForm({ quiz, onSubmitted }: { quiz: Quiz; onSubmitted: (attempt: Attempt) => void }) {
  const [answers, setAnswers] = useState<Answers>({})
  const { message, busy, submit } = useSubmission(quiz.id, onSubmitted)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submit(answers)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{quiz.title}</h1>
      <QuestionList
        questions={quiz.questions}
        answers={answers}
        onAnswer={(questionId, optionId) => setAnswers((current) => ({ ...current, [questionId]: optionId }))}
      />
      <p className="hint">Unanswered questions count as incorrect.</p>
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Submit answers
      </button>
    </form>
  )
}

function BestScoreLine({ quizId, attemptId }: { quizId: number; attemptId: number }) {
  const api = useApi()
  const result = useAsync(() => api.quizzes.bestScore(quizId), [api, quizId, attemptId])
  return (
    <AsyncView result={result}>
      {(best) => {
        const noun = best.attempts === 1 ? 'attempt' : 'attempts'
        return <p>{`Best score: ${best.best_score ?? 0}% after ${best.attempts} ${noun}`}</p>
      }}
    </AsyncView>
  )
}

function AttemptHistory({ quizId, attemptId }: { quizId: number; attemptId: number }) {
  const api = useApi()
  const result = useAsync(() => api.quizzes.attempts(quizId), [api, quizId, attemptId])
  return (
    <AsyncView result={result} isEmpty={(attempts) => attempts.length === 0}>
      {(attempts) => (
        <ol aria-label="Your attempts">
          {attempts.map((attempt, index) => (
            <li key={attempt.id}>
              {`Attempt ${index + 1}: ${attempt.score}% on ${new Date(attempt.submitted_at).toLocaleString()}`}
            </li>
          ))}
        </ol>
      )}
    </AsyncView>
  )
}

interface ResultPanelProps {
  quiz: Quiz
  attempt: Attempt
  onRetry: () => void
}

function ResultPanel({ quiz, attempt, onRetry }: ResultPanelProps) {
  return (
    <section aria-labelledby="result-title">
      <h1 id="result-title">{`${quiz.title}: results`}</h1>
      <p className="score">{`Your score: ${attempt.score}%`}</p>
      <p>{`${attempt.correct_count} of ${attempt.total_questions} answers correct.`}</p>
      <BestScoreLine quizId={quiz.id} attemptId={attempt.id} />
      <AttemptHistory quizId={quiz.id} attemptId={attempt.id} />
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </section>
  )
}

function QuizTaker({ quiz }: { quiz: Quiz }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  if (attempt) return <ResultPanel quiz={quiz} attempt={attempt} onRetry={() => setAttempt(null)} />
  return <QuizForm quiz={quiz} onSubmitted={setAttempt} />
}

export function QuizPage({ quizId }: { quizId: number }) {
  const api = useApi()
  const quiz = useAsync(() => api.quizzes.get(quizId), [api, quizId])
  return (
    <section>
      <AsyncView
        result={quiz}
        isEmpty={(loaded) => loaded.questions.length === 0}
        emptyMessage="This quiz has no questions yet."
      >
        {(loaded) => <QuizTaker quiz={loaded} />}
      </AsyncView>
    </section>
  )
}
