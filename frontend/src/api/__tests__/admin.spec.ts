import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiAdminGetUsers, apiAdminToggleStatus, apiAdminCreateUser } from '../adminUsers'
import { apiAdminGetSanctions, apiAdminCreateSanction, apiAdminUpdateSanction } from '../adminSanctions'
import { apiAdminGetRequests, apiAdminDecideRequest } from '../adminRequests'

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

beforeEach(() => { vi.clearAllMocks(); localStorageMock.clear() })

// ── Admin Users ──────────────────────────────────────────────────────────────

describe('apiAdminGetUsers', () => {
  it('fetches from /admin/users', async () => {
    mockOk([{ id: 1, email: 'a@b.com', role: 'MEMBER', is_active: true }])
    const result = await apiAdminGetUsers()
    expect(result[0].email).toBe('a@b.com')
    expect(mockFetch.mock.calls[0][0]).toContain('/admin/users')
  })

  it('passes role filter as query param', async () => {
    mockOk([])
    await apiAdminGetUsers({ role: 'COACH' })
    expect(mockFetch.mock.calls[0][0]).toContain('role=COACH')
  })
})

describe('apiAdminToggleStatus', () => {
  it('sends PATCH to /admin/users/:id/status with is_active', async () => {
    mockOk({ id: 2, is_active: false })
    await apiAdminToggleStatus(2, false)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/admin/users/2/status')
    expect(opts.method).toBe('PATCH')
    expect(JSON.parse(opts.body)).toEqual({ is_active: false })
  })
})

describe('apiAdminCreateUser', () => {
  it('posts new user data', async () => {
    mockOk({ id: 9, email: 'new@test.com', role: 'COACH' })
    const result = await apiAdminCreateUser({ email: 'new@test.com', password: 'abc123', first_name: 'New', last_name: 'Coach', role: 'COACH' })
    expect(result.role).toBe('COACH')
    expect(mockFetch.mock.calls[0][1].method).toBe('POST')
  })

  it('throws on duplicate email', async () => {
    mockError('Email déjà utilisé', 409)
    await expect(apiAdminCreateUser({ email: 'x@y.com', password: 'p', first_name: 'A', last_name: 'B', role: 'MEMBER' })).rejects.toThrow('Email déjà utilisé')
  })
})

// ── Admin Sanctions ──────────────────────────────────────────────────────────

describe('apiAdminGetSanctions', () => {
  it('fetches from /admin/sanctions', async () => {
    mockOk([{ id: 1, user_id: 3, sanction_type: 'WARNING', reason: 'late', is_active: true }])
    const result = await apiAdminGetSanctions()
    expect(result[0].sanction_type).toBe('WARNING')
    expect(mockFetch.mock.calls[0][0]).toContain('/admin/sanctions')
  })
})

describe('apiAdminCreateSanction', () => {
  it('posts sanction data', async () => {
    mockOk({ id: 5, user_id: 3, sanction_type: 'BAN', reason: 'cheating', is_active: true })
    const result = await apiAdminCreateSanction({ user_id: 3, sanction_type: 'BAN', reason: 'cheating' })
    expect(result.sanction_type).toBe('BAN')
    expect(mockFetch.mock.calls[0][1].method).toBe('POST')
  })
})

describe('apiAdminUpdateSanction', () => {
  it('sends PATCH to /admin/sanctions/:id', async () => {
    mockOk({ id: 5, is_active: false })
    await apiAdminUpdateSanction(5, { is_active: false })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/admin/sanctions/5')
    expect(opts.method).toBe('PATCH')
  })
})

// ── Admin Requests ───────────────────────────────────────────────────────────

describe('apiAdminGetRequests', () => {
  it('fetches from /admin/requests', async () => {
    mockOk([{ id: 1, session_id: 10, status: 'PENDING' }])
    const result = await apiAdminGetRequests()
    expect(result[0].status).toBe('PENDING')
    expect(mockFetch.mock.calls[0][0]).toContain('/admin/requests')
  })

  it('passes status filter', async () => {
    mockOk([])
    await apiAdminGetRequests('PENDING')
    expect(mockFetch.mock.calls[0][0]).toContain('status=PENDING')
  })
})

describe('apiAdminDecideRequest', () => {
  it('sends PATCH to /admin/requests/:id with status and comment', async () => {
    mockOk({ id: 1, status: 'APPROVED' })
    await apiAdminDecideRequest(1, 'APPROVED', 'Looks good')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/admin/requests/1')
    expect(opts.method).toBe('PATCH')
    expect(JSON.parse(opts.body)).toEqual({ status: 'APPROVED', admin_comment: 'Looks good' })
  })
})
