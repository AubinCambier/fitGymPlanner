import { authHeaders } from './auth'
import type { CoachRequest } from './coachRequests'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export async function apiAdminGetRequests(status?: string): Promise<CoachRequest[]> {
  const qs = status ? `?status=${status}` : ''
  const res = await fetch(`${BASE}/admin/requests${qs}`, { headers: authHeaders() })
  return handleResponse<CoachRequest[]>(res)
}

export async function apiAdminDecideRequest(id: number, status: 'APPROVED' | 'REJECTED', admin_comment?: string): Promise<CoachRequest> {
  const res = await fetch(`${BASE}/admin/requests/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status, admin_comment }),
  })
  return handleResponse<CoachRequest>(res)
}
