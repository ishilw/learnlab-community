import { COURSE_STATUSES, STATUS_LABELS, TRANSITION_TARGETS } from '../models'

describe('course statuses', () => {
  it('lists the four lifecycle states', () => {
    expect([...COURSE_STATUSES]).toEqual(['draft', 'published', 'unpublished', 'archived'])
  })

  it('labels every state', () => {
    for (const status of COURSE_STATUSES) {
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0)
    }
  })
})

describe('transition targets (presentation hint, the backend enforces them)', () => {
  it('offers publish and archive from draft', () => {
    expect(TRANSITION_TARGETS.draft).toEqual(['published', 'archived'])
  })

  it('offers unpublish and archive from published', () => {
    expect(TRANSITION_TARGETS.published).toEqual(['unpublished', 'archived'])
  })

  it('offers publish and archive from unpublished', () => {
    expect(TRANSITION_TARGETS.unpublished).toEqual(['published', 'archived'])
  })

  it('offers nothing from archived', () => {
    expect(TRANSITION_TARGETS.archived).toEqual([])
  })
})
