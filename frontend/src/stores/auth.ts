import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  email: string
  role: 'ADMIN' | 'COACH' | 'MEMBER'
  first_name: string
  last_name: string
  is_active: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  function parseStoredUser(): User | null {
    try { return JSON.parse(localStorage.getItem('user') ?? 'null') }
    catch { localStorage.removeItem('user'); return null }
  }
  const user = ref<User | null>(parseStoredUser())
  const isAuthenticated = computed(() => !!token.value)

  function login(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, login, logout }
})
