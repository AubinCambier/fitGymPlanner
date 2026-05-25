import { authHeaders } from './auth'

const BASE = 'http://localhost:3000/api/v1'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Membership {
  id: number
  member_id: number
  pricing_id: number
  payment_mode: 'MONTHLY' | 'PAY_PER_SESSION'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export async function apiGetMyMembership(): Promise<Membership | null> {
  const res = await fetch(`${BASE}/memberships/me`, { headers: authHeaders() })
  if (res.status === 404) return null
  return handleResponse<Membership>(res)
}

export async function apiCreateMembership(pricing_id: number, payment_mode: string): Promise<Membership> {
  const res = await fetch(`${BASE}/memberships`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pricing_id, payment_mode }),
  })
  return handleResponse<Membership>(res)
}

export async function apiCancelMembership(): Promise<Membership> {
  const res = await fetch(`${BASE}/memberships/me/cancel`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  return handleResponse<Membership>(res)
}
