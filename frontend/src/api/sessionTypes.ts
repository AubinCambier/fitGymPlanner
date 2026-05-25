import { authHeaders } from './auth'

const BASE = 'http://localhost:3000/api/v1'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface SessionType {
  id: number
  name: string
  description: string | null
}

export async function apiGetSessionTypes(): Promise<SessionType[]> {
  const res = await fetch(`${BASE}/session-types`, { headers: authHeaders() })
  return handleResponse<SessionType[]>(res)
}

export async function apiAdminCreateSessionType(data: { name: string; description?: string }): Promise<SessionType> {
  const res = await fetch(`${BASE}/admin/session-types`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<SessionType>(res)
}

export async function apiAdminUpdateSessionType(id: number, data: { name?: string; description?: string }): Promise<SessionType> {
  const res = await fetch(`${BASE}/admin/session-types/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<SessionType>(res)
}

export async function apiAdminDeleteSessionType(id: number): Promise<void> {
  const res = await fetch(`${BASE}/admin/session-types/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message ?? 'Request failed')
  }
}
