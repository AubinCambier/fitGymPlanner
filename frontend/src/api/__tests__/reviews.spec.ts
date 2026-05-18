import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiCreateReview, apiUpdateReview, apiGetCoachReviews, apiGetMyReviews } from '../reviews'

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

const sampleReview = {
  id: 1, booking_id: 5, member_id: 3, coach_id: 2,
  rating: 4, comment: 'Great session!', is_anonymous: false,
  created_at: '2026-05-18T10:00:00Z', updated_at: '2026-05-18T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('apiCreateReview', () => {
  it('posts review data and returns created review', async () => {
    mockOk(sampleReview)
    const result = await apiCreateReview({ booking_id: 5, rating: 4, comment: 'Great session!' })
    expect(result).toEqual(sampleReview)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/reviews')
    expect(opts.method).toBe('POST')
    const body = JSON.parse(opts.body)
    expect(body.booking_id).toBe(5)
    expect(body.rating).toBe(4)
  })

  it('sends Authorization header when token is set', async () => {
    localStorageMock.setItem('token', 'tok-abc')
    mockOk(sampleReview)
    await apiCreateReview({ booking_id: 5, rating: 4 })
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer tok-abc')
  })

  it('throws on error response', async () => {
    mockError('Booking not found', 404)
    await expect(apiCreateReview({ booking_id: 999, rating: 3 })).rejects.toThrow('Booking not found')
  })
})

describe('apiUpdateReview', () => {
  it('sends PUT with updated fields', async () => {
    const updated = { ...sampleReview, rating: 5, comment: 'Even better!' }
    mockOk(updated)
    const result = await apiUpdateReview(1, { rating: 5, comment: 'Even better!' })
    expect(result.rating).toBe(5)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/reviews/1')
    expect(opts.method).toBe('PUT')
  })

  it('throws on error response', async () => {
    mockError('Access denied', 403)
    await expect(apiUpdateReview(1, { rating: 2 })).rejects.toThrow('Access denied')
  })
})

describe('apiGetCoachReviews', () => {
  it('fetches coach reviews without auth header', async () => {
    const coachData = {
      coach: { id: 2, first_name: 'Marc', last_name: 'Dupont' },
      stats: { average: 4.2, total: 2, breakdown: { '5': 1, '4': 1, '3': 0, '2': 0, '1': 0 } },
      reviews: [
        { id: 1, rating: 5, comment: 'Great', display_name: 'Aubin C.', is_anonymous: false, created_at: '2026-05-14T10:00:00Z' },
      ],
    }
    mockOk(coachData)
    const result = await apiGetCoachReviews(2)
    expect(result.coach.id).toBe(2)
    expect(result.stats.total).toBe(2)
    expect(result.reviews).toHaveLength(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/reviews/coach/2')
    expect(opts).toBeUndefined()
  })

  it('throws on error response', async () => {
    mockError('Server error', 500)
    await expect(apiGetCoachReviews(2)).rejects.toThrow('Server error')
  })
})

describe('apiGetMyReviews', () => {
  it('returns list of own reviews', async () => {
    mockOk([sampleReview])
    const result = await apiGetMyReviews()
    expect(result).toHaveLength(1)
    expect(result[0]!.booking_id).toBe(5)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/reviews/mine')
  })

  it('sends Authorization header', async () => {
    localStorageMock.setItem('token', 'tok-xyz')
    mockOk([])
    await apiGetMyReviews()
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer tok-xyz')
  })

  it('throws on error response', async () => {
    mockError('Unauthorized', 401)
    await expect(apiGetMyReviews()).rejects.toThrow('Unauthorized')
  })
})
