import { authHeaders } from './auth'

const BASE = 'http://localhost:3000/api/v1'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Session {
  id: number
  title: string
  description: string | null
  session_type_name?: string
  coach_id: number
  coach_first_name: string
  coach_last_name: string
  start_time: string
  end_time: string
  capacity: number
  registered_count: number
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'SCHEDULED' | 'CANCELLED'
}

export async function apiGetSessions(params?: { type?: string; date?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString()
  const res = await fetch(`${BASE}/sessions${query ? '?' + query : ''}`, { headers: authHeaders() })
  return handleResponse<Session[]>(res)
}

export async function apiGetSession(id: number) {
  const res = await fetch(`${BASE}/sessions/${id}`, { headers: authHeaders() })
  return handleResponse<Session>(res)
}

export async function apiCreateSession(data: {
  title: string
  description?: string
  session_type_id: number
  start_time: string
  end_time: string
  capacity: number
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
}): Promise<Session> {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Session>(res)
}
