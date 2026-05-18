import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiCreatePayment, apiGetMyPayments } from '../payments'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success', data }) })
}
function mockError(message: string, status = 400) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: async () => ({ status: 'error', message }) })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('apiCreatePayment', () => {
  it('posts amount and description, returns created payment', async () => {
    const payment = { id: 1, user_id: 10, amount: '8.00', currency: 'EUR', description: 'Session booking: Yoga', status: 'SUCCESS', created_at: '2026-05-18T10:00:00Z' }
    mockOk(payment)
    const result = await apiCreatePayment({ amount: 8, description: 'Session booking: Yoga' })
    expect(result).toEqual(payment)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/payments')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ amount: 8, description: 'Session booking: Yoga' })
  })

  it('sends Authorization header when token is set', async () => {
    localStorageMock.setItem('token', 'tok-abc')
    mockOk({})
    await apiCreatePayment({ amount: 5, description: 'Test' })
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer tok-abc')
  })

  it('throws on error response', async () => {
    mockError('Forbidden', 403)
    await expect(apiCreatePayment({ amount: 8, description: 'Test' })).rejects.toThrow('Forbidden')
  })
})

describe('apiGetMyPayments', () => {
  it('returns the list of payments', async () => {
    const payments = [
      { id: 1, user_id: 10, amount: '8.00', currency: 'EUR', description: 'Session booking: Yoga', status: 'SUCCESS', created_at: '2026-05-18T10:00:00Z' },
    ]
    mockOk(payments)
    const result = await apiGetMyPayments()
    expect(result).toEqual(payments)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/payments/me')
  })

  it('sends Authorization header', async () => {
    localStorageMock.setItem('token', 'tok-xyz')
    mockOk([])
    await apiGetMyPayments()
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer tok-xyz')
  })

  it('throws on error response', async () => {
    mockError('Unauthorized', 401)
    await expect(apiGetMyPayments()).rejects.toThrow('Unauthorized')
  })
})
