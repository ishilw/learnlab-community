import { ApiError } from '../../api/http'
import { errorText } from '../errors'

describe('errorText', () => {
  it('uses the message of an API error', () => {
    expect(errorText(new ApiError(409, 'learner is already enrolled'))).toBe(
      'learner is already enrolled',
    )
  })

  it('uses the message of an ordinary error', () => {
    expect(errorText(new Error('network down'))).toBe('network down')
  })

  it('falls back for anything else', () => {
    expect(errorText('weird')).toBe('Something went wrong. Please try again.')
  })
})
