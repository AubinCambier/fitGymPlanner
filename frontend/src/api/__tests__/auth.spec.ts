import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiLogin, apiRegister, apiGetMe, apiUpdateProfile } from '../auth'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  mockFetch.mockReset()
  localStorageMock.clear()
})

describe('apiLogin', () => {
  it('retourne token et user en cas de succès', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { token: 'jwt-token', user: { id: 1, email: 'test@fitgym.com', role: 'MEMBER', first_name: 'Test', last_name: 'User', is_active: true } }
      })
    })
    const result = await apiLogin('test@fitgym.com', 'password123')
    expect(result.token).toBe('jwt-token')
    expect(result.user.email).toBe('test@fitgym.com')
  })

  it('envoie bien email et password dans le body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { token: 'x', user: {} } })
    })
    await apiLogin('test@fitgym.com', 'password123')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.email).toBe('test@fitgym.com')
    expect(body.password).toBe('password123')
  })

  it('lève une erreur si les identifiants sont mauvais', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 'error', message: 'Identifiants incorrects' })
    })
    await expect(apiLogin('bad@email.com', 'wrong')).rejects.toThrow('Identifiants incorrects')
  })
})

describe('apiRegister', () => {
  it('retourne le user créé en cas de succès', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { id: 2, email: 'new@fitgym.com', role: 'MEMBER', first_name: 'New', last_name: 'User', is_active: true }
      })
    })
    const user = await apiRegister('New', 'User', 'new@fitgym.com', 'password123')
    expect(user.email).toBe('new@fitgym.com')
    expect(user.first_name).toBe('New')
  })
})

describe('apiGetMe', () => {
  it('envoie le header Authorization avec le token', async () => {
    localStorageMock.setItem('token', 'my-token')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { id: 1, email: 'test@fitgym.com' } })
    })
    await apiGetMe()
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer my-token')
  })

  it('n\'envoie pas Authorization si pas de token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: {} })
    })
    await apiGetMe()
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBeUndefined()
  })
})

describe('apiUpdateProfile', () => {
  it('envoie les données en PUT avec Authorization', async () => {
    localStorageMock.setItem('token', 'my-token')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { id: 1, first_name: 'Jean' } })
    })
    await apiUpdateProfile({ first_name: 'Jean' })
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.first_name).toBe('Jean')
  })
})
