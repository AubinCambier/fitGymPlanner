import { authHeaders } from './auth'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Sanction {
  id: number
  user_id: number
  issued_by: number
  sanction_type: 'WARNING' | 'SUSPENSION' | 'BAN'
  reason: string
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export async function apiAdminGetSanctions(): Promise<Sanction[]> {
  const res = await fetch(`${BASE}/admin/sanctions`, { headers: authHeaders() })
  return handleResponse<Sanction[]>(res)
}

export async function apiAdminCreateSanction(data: {
  user_id: number
  sanction_type: 'WARNING' | 'SUSPENSION' | 'BAN'
  reason: string
  end_date?: string
}): Promise<Sanction> {
  const res = await fetch(`${BASE}/admin/sanctions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Sanction>(res)
}

export async function apiAdminUpdateSanction(id: number, data: { reason?: string; end_date?: string | null; is_active?: boolean }): Promise<Sanction> {
  const res = await fetch(`${BASE}/admin/sanctions/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Sanction>(res)
}
