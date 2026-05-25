import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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

import { useAuthStore } from '../auth'

const mockUser = {
  id: 1,
  email: 'test@fitgym.com',
  role: 'MEMBER' as const,
  first_name: 'Test',
  last_name: 'User',
  is_active: true,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('starts unauthenticated when localStorage is empty', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
  })

  it('login() stores token and user in store and localStorage', () => {
    const auth = useAuthStore()
    auth.login('abc123', mockUser)
    expect(auth.token).toBe('abc123')
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorageMock.getItem('token')).toBe('abc123')
    expect(JSON.parse(localStorageMock.getItem('user')!)).toEqual(mockUser)
  })

  it('logout() clears store and localStorage', () => {
    const auth = useAuthStore()
    auth.login('abc123', mockUser)
    auth.logout()
    expect(auth.token).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorageMock.getItem('token')).toBeNull()
    expect(localStorageMock.getItem('user')).toBeNull()
  })

  it('hydrates from localStorage on init', () => {
    localStorageMock.setItem('token', 'persisted')
    localStorageMock.setItem('user', JSON.stringify(mockUser))
    const auth = useAuthStore()
    expect(auth.token).toBe('persisted')
    expect(auth.user).toEqual(mockUser)
    expect(auth.isAuthenticated).toBe(true)
  })
})
