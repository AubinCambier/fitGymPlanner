import { authHeaders } from './auth'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Payment {
  id: number
  user_id: number
  amount: string
  currency: string
  description: string
  status: string
  created_at: string
}

export async function apiCreatePayment(data: { amount: number; description: string }): Promise<Payment> {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Payment>(res)
}

export async function apiGetMyPayments(): Promise<Payment[]> {
  const res = await fetch(`${BASE}/payments/me`, { headers: authHeaders() })
  return handleResponse<Payment[]>(res)
}
