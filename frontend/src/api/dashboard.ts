import { authHeaders } from './auth'

const BASE = 'http://localhost:3000/api/v1'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface TopSession {
  id: number
  title: string
  capacity: number
  registered_count: number
  fill_rate: number
  start_time: string
}

export interface DashboardStats {
  total_revenue: number
  revenue_this_month: number
  active_members: number
  active_memberships: number
  upcoming_sessions: number
  bookings_this_month: number
  top_sessions: TopSession[]
}

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE}/admin/dashboard`, { headers: authHeaders() })
  return handleResponse<DashboardStats>(res)
}
