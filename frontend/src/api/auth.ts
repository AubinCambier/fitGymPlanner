import type { User } from '@/stores/auth'

import { BASE } from './config'

export function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return handleResponse<{ token: string; user: User }>(res)
}

export async function apiRegister(first_name: string, last_name: string, email: string, password: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name, last_name, email, password })
  })
  return handleResponse<User>(res)
}

export async function apiGetMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() })
  return handleResponse<User>(res)
}

export async function apiUpdateProfile(data: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>> & { password?: string }) {
  const res = await fetch(`${BASE}/auth/me`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse<User>(res)
}
