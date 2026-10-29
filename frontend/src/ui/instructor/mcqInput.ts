import type { McqQuestionInput } from '../../types/models'

export type McqResult = { input: McqQuestionInput } | { error: string }

/**
 * Turns the form fields into the API request body. Blank choices are dropped, and the correct
 * choice (a zero-based position among all fields) is re-based onto the remaining choices.
 */
export function buildMcqInput(prompt: string, choices: string[], correctChoice: number): McqResult {
  const text = prompt.trim()
  if (!text) return { error: 'Enter the question text.' }
  const filled = choices.map((choice) => choice.trim()).filter(Boolean)
  if (filled.length < 2) return { error: 'Enter at least two choices.' }
  if (!choices[correctChoice]?.trim()) return { error: 'The correct choice must not be blank.' }
  const correctIndex = choices.slice(0, correctChoice).filter((choice) => choice.trim()).length
  return { input: { prompt: text, choices: filled, correct_index: correctIndex } }
}
