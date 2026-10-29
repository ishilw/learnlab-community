import { buildMcqInput } from '../mcqInput'

describe('buildMcqInput', () => {
  it('builds the request body and maps the correct choice', () => {
    const result = buildMcqInput('Capital?', ['Rome', 'Paris', '', ''], 1)
    expect(result).toEqual({ input: { prompt: 'Capital?', choices: ['Rome', 'Paris'], correct_index: 1 } })
  })

  it('skips blank choices when computing the correct index', () => {
    const result = buildMcqInput('Q', ['a', '', 'c', ''], 2)
    expect(result).toEqual({ input: { prompt: 'Q', choices: ['a', 'c'], correct_index: 1 } })
  })

  it('trims text', () => {
    const result = buildMcqInput('  Q  ', [' a ', ' b '], 0)
    expect(result).toEqual({ input: { prompt: 'Q', choices: ['a', 'b'], correct_index: 0 } })
  })

  it('requires a question', () => {
    expect(buildMcqInput('  ', ['a', 'b'], 0)).toEqual({ error: 'Enter the question text.' })
  })

  it('requires at least two choices', () => {
    expect(buildMcqInput('Q', ['a', '', '', ''], 0)).toEqual({ error: 'Enter at least two choices.' })
  })

  it('requires the correct choice to be filled in', () => {
    expect(buildMcqInput('Q', ['a', 'b', '', ''], 2)).toEqual({
      error: 'The correct choice must not be blank.',
    })
  })
})
