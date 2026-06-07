import { authHeaders } from './auth'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface CoachRequest {
  id: number
  coach_id: number
  session_id: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  admin_id: number | null
  admin_comment: string | null
  decided_at: string | null
  created_at: string
}

export async function apiGetMyRequests(): Promise<CoachRequest[]> {
  const res = await fetch(`${BASE}/coach/requests`, { headers: authHeaders() })
  return handleResponse<CoachRequest[]>(res)
}

export async function apiCreateRequest(session_id: number, reason: string): Promise<CoachRequest> {
  const res = await fetch(`${BASE}/coach/requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ session_id, reason }),
  })
  return handleResponse<CoachRequest>(res)
}
