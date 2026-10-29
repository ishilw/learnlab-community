const mocks = vi.hoisted(() => {
  const render = vi.fn()
  const createRoot = vi.fn(() => ({ render }))
  return { render, createRoot }
})

vi.mock('react-dom/client', () => ({
  createRoot: mocks.createRoot,
  default: { createRoot: mocks.createRoot },
}))

describe('main entry point', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.render.mockClear()
    mocks.createRoot.mockClear()
  })

  it('mounts the app into #root', async () => {
    document.body.innerHTML = '<div id="root"></div>'
    await import('../main')
    expect(mocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'))
    expect(mocks.render).toHaveBeenCalledTimes(1)
  })

  it('fails loudly when #root is missing', async () => {
    document.body.innerHTML = ''
    await expect(import('../main')).rejects.toThrow(/#root/)
  })
})
