import { authHeaders } from './auth'

const BASE = 'http://localhost:3000/api/v1'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Pricing {
  id: number
  label: string
  payment_mode: 'MONTHLY' | 'PAY_PER_SESSION'
  price: string
  currency: string
  is_active: boolean
  created_at: string
}

export async function apiGetPricing(): Promise<Pricing[]> {
  const res = await fetch(`${BASE}/pricing`, { headers: authHeaders() })
  return handleResponse<Pricing[]>(res)
}

export async function apiAdminCreatePricing(data: { label: string; payment_mode: string; price: number; currency?: string }): Promise<Pricing> {
  const res = await fetch(`${BASE}/admin/pricing`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Pricing>(res)
}

export async function apiAdminUpdatePricing(id: number, data: { label?: string; payment_mode?: string; price?: number; currency?: string }): Promise<Pricing> {
  const res = await fetch(`${BASE}/admin/pricing/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Pricing>(res)
}

export async function apiAdminTogglePricingStatus(id: number, is_active: boolean): Promise<Pricing> {
  const res = await fetch(`${BASE}/admin/pricing/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ is_active }),
  })
  return handleResponse<Pricing>(res)
}
