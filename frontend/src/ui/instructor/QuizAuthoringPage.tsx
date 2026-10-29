import { useState, type FormEvent } from 'react'
import type { Question } from '../../types/models'
import { useApi } from '../apiContext'
import { AsyncView } from '../components/AsyncView'
import { StatusMessage } from '../components/StatusMessage'
import { TextField } from '../components/TextField'
import { useAction } from '../hooks/useAction'
import { useAsync } from '../hooks/useAsync'
import { buildMcqInput } from './mcqInput'

const CHOICE_NUMBERS = [1, 2, 3, 4]

function QuestionSummary({ questions }: { questions: Question[] }) {
  if (questions.length === 0) return <p>This quiz has no questions yet.</p>
  return (
    <ol>
      {questions.map((question) => (
        <li key={question.id}>
          <p>{question.prompt}</p>
          <ul>
            {question.options.map((option) => (
              <li key={option.id}>{option.text}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

interface ChoiceFieldsProps {
  choices: string[]
  correct: string
  onChoice: (index: number, value: string) => void
  onCorrect: (value: string) => void
}

function ChoiceFields({ choices, correct, onChoice, onCorrect }: ChoiceFieldsProps) {
  return (
    <>
      {CHOICE_NUMBERS.map((n) => (
        <TextField key={n} id={`mcq-choice-${n}`} label={`Choice ${n}`} value={choices[n - 1]} onChange={(v) => onChoice(n - 1, v)} />
      ))}
      <label htmlFor="mcq-correct">Correct choice</label>
      <select id="mcq-correct" value={correct} onChange={(e) => onCorrect(e.target.value)}>
        {CHOICE_NUMBERS.map((n) => (
          <option key={n} value={String(n)}>{`Choice ${n}`}</option>
        ))}
      </select>
    </>
  )
}

function McqForm({ quizId, onAdded }: { quizId: number; onAdded: () => void }) {
  const api = useApi()
  const [prompt, setPrompt] = useState('')
  const [choices, setChoices] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState('1')
  const { message, busy, run, fail } = useAction()

  async function submit(event: FormEvent) {
    event.preventDefault()
    const built = buildMcqInput(prompt, choices, Number(correct) - 1)
    if ('error' in built) return fail(built.error)
    const added = await run(() => api.quizzes.addMcq(quizId, built.input))
    if (added) onAdded()
  }

  const setChoice = (index: number, value: string) =>
    setChoices((current) => current.map((choice, i) => (i === index ? value : choice)))

  return (
    <form onSubmit={submit}>
      <h3>Multiple choice</h3>
      <TextField id="mcq-prompt" label="Question text" value={prompt} onChange={setPrompt} />
      <ChoiceFields choices={choices} correct={correct} onChoice={setChoice} onCorrect={setCorrect} />
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Add multiple-choice question
      </button>
    </form>
  )
}

function TrueFalseForm({ quizId, onAdded }: { quizId: number; onAdded: () => void }) {
  const api = useApi()
  const [prompt, setPrompt] = useState('')
  const [correct, setCorrect] = useState('true')
  const { message, busy, run, fail } = useAction()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!prompt.trim()) return fail('Enter the statement.')
    const input = { prompt: prompt.trim(), correct: correct === 'true' }
    const added = await run(() => api.quizzes.addTrueFalse(quizId, input))
    if (added) onAdded()
  }

  return (
    <form onSubmit={submit}>
      <h3>True or false</h3>
      <TextField id="tf-prompt" label="Statement" value={prompt} onChange={setPrompt} />
      <label htmlFor="tf-correct">Correct answer</label>
      <select id="tf-correct" value={correct} onChange={(e) => setCorrect(e.target.value)}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
      <StatusMessage message={message} />
      <button type="submit" disabled={busy}>
        Add true/false question
      </button>
    </form>
  )
}

/**
 * Quiz authoring. The correct answer is sent to the server when a question is added and is never
 * returned by the API, so it is not shown here. Questions are fixed after the first attempt.
 */
export function QuizAuthoringPage({ quizId }: { quizId: number }) {
  const api = useApi()
  const result = useAsync(() => api.quizzes.get(quizId), [api, quizId])
  return (
    <AsyncView result={result}>
      {(quiz) => (
        <article>
          <h1>{quiz.title}</h1>
          <QuestionSummary questions={quiz.questions} />
          <section>
            <h2>Add a question</h2>
            <McqForm quizId={quizId} onAdded={result.reload} />
            <TrueFalseForm quizId={quizId} onAdded={result.reload} />
          </section>
        </article>
      )}
    </AsyncView>
  )
}
