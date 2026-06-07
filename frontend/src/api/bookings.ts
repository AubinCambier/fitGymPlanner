import { authHeaders } from './auth'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Booking {
  id: number
  session_id: number
  session_title: string
  session_start_time: string
  session_end_time: string
  session_type_name?: string
  status: 'CONFIRMED' | 'CANCELLED'
  coach_id: number
  coach_first_name: string
  coach_last_name: string
}

export async function apiGetBookings() {
  const res = await fetch(`${BASE}/bookings`, { headers: authHeaders() })
  return handleResponse<Booking[]>(res)
}

export async function apiCreateBooking(session_id: number) {
  const res = await fetch(`${BASE}/bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ session_id })
  })
  return handleResponse<Booking>(res)
}

export async function apiCancelBooking(id: number) {
  const res = await fetch(`${BASE}/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders()
  })
  return handleResponse<Booking>(res)
}
