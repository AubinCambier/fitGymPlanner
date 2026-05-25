import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGetMySessions, apiGetSessionParticipants } from '../coach'
import { apiGetMyRequests, apiCreateRequest } from '../coachRequests'

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

describe('apiGetMySessions', () => {
  it('fetches coach sessions from /coach/sessions', async () => {
    const sessions = [{ id: 1, title: 'Yoga', coach_id: 5, start_time: '', end_time: '', capacity: 10, registered_count: 3, intensity: 'LOW', status: 'SCHEDULED' }]
    mockOk(sessions)
    const result = await apiGetMySessions()
    expect(result).toEqual(sessions)
    expect(mockFetch.mock.calls[0][0]).toContain('/coach/sessions')
  })

  it('sends Authorization header', async () => {
    localStorageMock.setItem('token', 'coach-token')
    mockOk([])
    await apiGetMySessions()
    expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer coach-token')
  })
})

describe('apiGetSessionParticipants', () => {
  it('fetches participants from /coach/sessions/:id/participants', async () => {
    const participants = [{ id: 10, first_name: 'Alice', last_name: 'Doe', email: 'alice@test.com', booked_at: '' }]
    mockOk(participants)
    const result = await apiGetSessionParticipants(42)
    expect(result).toEqual(participants)
    expect(mockFetch.mock.calls[0][0]).toContain('/coach/sessions/42/participants')
  })

  it('throws when session not found', async () => {
    mockError('Session introuvable', 404)
    await expect(apiGetSessionParticipants(999)).rejects.toThrow('Session introuvable')
  })
})

describe('apiGetMyRequests', () => {
  it('fetches requests from /coach/requests', async () => {
    const requests = [{ id: 1, session_id: 5, reason: 'injury', status: 'PENDING', created_at: '' }]
    mockOk(requests)
    const result = await apiGetMyRequests()
    expect(result).toEqual(requests)
    expect(mockFetch.mock.calls[0][0]).toContain('/coach/requests')
  })
})

describe('apiCreateRequest', () => {
  it('posts session_id and reason', async () => {
    const request = { id: 3, session_id: 5, reason: 'injury', status: 'PENDING', created_at: '' }
    mockOk(request)
    const result = await apiCreateRequest(5, 'injury')
    expect(result).toEqual(request)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/coach/requests')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ session_id: 5, reason: 'injury' })
  })

  it('throws when request already exists', async () => {
    mockError('Une demande existe déjà pour cette session', 409)
    await expect(apiCreateRequest(5, 'injury')).rejects.toThrow('Une demande existe déjà pour cette session')
  })
})
