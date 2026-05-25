import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGetBookings, apiCreateBooking, apiCancelBooking } from '../bookings'

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
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'success', data }),
  })
}

function mockError(message: string, status = 400) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ status: 'error', message }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('apiGetBookings', () => {
  it('returns the list of bookings', async () => {
    const bookings = [
      { id: 1, session_id: 10, session_title: 'Yoga', session_start_time: '2026-05-14T09:00:00Z', session_end_time: '2026-05-14T10:00:00Z', status: 'CONFIRMED' },
    ]
    mockOk(bookings)
    const result = await apiGetBookings()
    expect(result).toEqual(bookings)
  })

  it('sends Authorization header when token is set', async () => {
    localStorageMock.setItem('token', 'my-token')
    mockOk([])
    await apiGetBookings()
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer my-token')
  })

  it('throws on error response', async () => {
    mockError('Unauthorized', 401)
    await expect(apiGetBookings()).rejects.toThrow('Unauthorized')
  })
})

describe('apiCreateBooking', () => {
  it('posts session_id and returns created booking', async () => {
    const booking = { id: 5, session_id: 10, session_title: 'Yoga', session_start_time: '2026-05-14T09:00:00Z', session_end_time: '2026-05-14T10:00:00Z', status: 'CONFIRMED' }
    mockOk(booking)
    const result = await apiCreateBooking(10)
    expect(result).toEqual(booking)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/bookings')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ session_id: 10 })
  })

  it('throws when session is full', async () => {
    mockError('Session is full')
    await expect(apiCreateBooking(10)).rejects.toThrow('Session is full')
  })
})

describe('apiCancelBooking', () => {
  it('sends PATCH to /bookings/:id/cancel', async () => {
    const booking = { id: 5, session_id: 10, session_title: 'Yoga', session_start_time: '2026-05-14T09:00:00Z', session_end_time: '2026-05-14T10:00:00Z', status: 'CANCELLED' }
    mockOk(booking)
    const result = await apiCancelBooking(5)
    expect(result).toEqual(booking)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/bookings/5/cancel')
    expect(opts.method).toBe('PATCH')
  })

  it('throws on error', async () => {
    mockError('Booking not found', 404)
    await expect(apiCancelBooking(99)).rejects.toThrow('Booking not found')
  })
})
