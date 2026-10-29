import { apiBaseUrl, DEFAULT_API_BASE_URL } from '../env'

describe('apiBaseUrl', () => {
  it('defaults to the development proxy path', () => {
    expect(apiBaseUrl({})).toBe(DEFAULT_API_BASE_URL)
    expect(DEFAULT_API_BASE_URL).toBe('/api')
  })

  it('uses VITE_API_BASE_URL when it is set', () => {
    expect(apiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.test' })).toBe(
      'https://api.example.test',
    )
  })

  it('removes trailing slashes', () => {
    expect(apiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.test//' })).toBe(
      'https://api.example.test',
    )
  })

  it('ignores a blank value', () => {
    expect(apiBaseUrl({ VITE_API_BASE_URL: '   ' })).toBe(DEFAULT_API_BASE_URL)
  })
})
