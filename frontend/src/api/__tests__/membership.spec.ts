import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGetMyMembership, apiCreateMembership, apiCancelMembership } from '../membership'
import { apiGetPricing } from '../pricing'

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

describe('apiGetMyMembership', () => {
  it('returns the active membership', async () => {
    const membership = { id: 1, pricing_id: 2, payment_mode: 'MONTHLY', status: 'ACTIVE', start_date: '2026-05-01', end_date: null }
    mockOk(membership)
    const result = await apiGetMyMembership()
    expect(result).toEqual(membership)
    expect(mockFetch.mock.calls[0][0]).toContain('/memberships/me')
  })

  it('returns null when no active membership (404)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ status: 'error', message: 'Not found' }) })
    const result = await apiGetMyMembership()
    expect(result).toBeNull()
  })

  it('sends Authorization header', async () => {
    localStorageMock.setItem('token', 'tok123')
    mockOk(null)
    await apiGetMyMembership()
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer tok123')
  })
})

describe('apiCreateMembership', () => {
  it('posts pricing_id and payment_mode', async () => {
    const membership = { id: 3, pricing_id: 1, payment_mode: 'MONTHLY', status: 'ACTIVE', start_date: '2026-05-13', end_date: null }
    mockOk(membership)
    const result = await apiCreateMembership(1, 'MONTHLY')
    expect(result).toEqual(membership)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/memberships')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ pricing_id: 1, payment_mode: 'MONTHLY' })
  })

  it('throws on error', async () => {
    mockError('Already has an active membership')
    await expect(apiCreateMembership(1, 'MONTHLY')).rejects.toThrow('Already has an active membership')
  })
})

describe('apiCancelMembership', () => {
  it('sends PATCH to /memberships/me/cancel', async () => {
    const membership = { id: 1, pricing_id: 2, payment_mode: 'MONTHLY', status: 'CANCELLED', start_date: '2026-05-01', end_date: '2026-05-13' }
    mockOk(membership)
    const result = await apiCancelMembership()
    expect(result).toEqual(membership)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/memberships/me/cancel')
    expect(opts.method).toBe('PATCH')
  })
})

describe('apiGetPricing', () => {
  it('returns list of active pricing plans', async () => {
    const plans = [
      { id: 1, label: 'Monthly', payment_mode: 'MONTHLY', price: '29.99', currency: 'EUR', is_active: true },
    ]
    mockOk(plans)
    const result = await apiGetPricing()
    expect(result).toEqual(plans)
    expect(mockFetch.mock.calls[0][0]).toContain('/pricing')
  })
})
