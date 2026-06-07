import { authHeaders } from './auth'
import type { Session } from './sessions'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Participant {
  id: number
  first_name: string
  last_name: string
  email: string
  booked_at: string
}

export async function apiGetMySessions(): Promise<Session[]> {
  const res = await fetch(`${BASE}/coach/sessions`, { headers: authHeaders() })
  return handleResponse<Session[]>(res)
}

export async function apiGetSessionParticipants(sessionId: number): Promise<Participant[]> {
  const res = await fetch(`${BASE}/coach/sessions/${sessionId}/participants`, { headers: authHeaders() })
  return handleResponse<Participant[]>(res)
}
