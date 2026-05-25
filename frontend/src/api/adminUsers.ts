import { authHeaders } from './auth'

const BASE = 'http://localhost:3000/api/v1'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface AdminUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'ADMIN' | 'COACH' | 'MEMBER'
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function apiAdminGetUsers(params?: { role?: string; active?: boolean }): Promise<AdminUser[]> {
  const query = new URLSearchParams()
  if (params?.role) query.set('role', params.role)
  if (params?.active !== undefined) query.set('active', String(params.active))
  const qs = query.toString()
  const res = await fetch(`${BASE}/admin/users${qs ? '?' + qs : ''}`, { headers: authHeaders() })
  return handleResponse<AdminUser[]>(res)
}

export async function apiAdminGetUser(id: number): Promise<AdminUser> {
  const res = await fetch(`${BASE}/admin/users/${id}`, { headers: authHeaders() })
  return handleResponse<AdminUser>(res)
}

export async function apiAdminCreateUser(data: {
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
}): Promise<AdminUser> {
  const res = await fetch(`${BASE}/admin/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<AdminUser>(res)
}

export async function apiAdminUpdateUser(id: number, data: Partial<{ email: string; first_name: string; last_name: string; role: string; password: string }>): Promise<AdminUser> {
  const res = await fetch(`${BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<AdminUser>(res)
}

export async function apiAdminToggleStatus(id: number, is_active: boolean): Promise<AdminUser> {
  const res = await fetch(`${BASE}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ is_active }),
  })
  return handleResponse<AdminUser>(res)
}
