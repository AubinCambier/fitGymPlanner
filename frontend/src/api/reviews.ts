import { authHeaders } from './auth'

import { BASE } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data.data as T
}

export interface Review {
  id: number
  booking_id: number
  member_id: number
  coach_id: number
  rating: number
  comment: string | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface ReviewDisplay {
  id: number
  rating: number
  comment: string | null
  display_name: string
  is_anonymous: boolean
  created_at: string
}

export interface CoachReviewsData {
  coach: { id: number; first_name: string; last_name: string }
  stats: {
    average: number
    total: number
    breakdown: Record<string, number>
  }
  reviews: ReviewDisplay[]
}

export async function apiCreateReview(data: {
  booking_id: number
  rating: number
  comment?: string
  is_anonymous?: boolean
}): Promise<Review> {
  const res = await fetch(`${BASE}/reviews`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Review>(res)
}

export async function apiUpdateReview(
  id: number,
  data: { rating?: number; comment?: string | null; is_anonymous?: boolean }
): Promise<Review> {
  const res = await fetch(`${BASE}/reviews/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Review>(res)
}

export async function apiGetCoachReviews(coachId: number): Promise<CoachReviewsData> {
  const res = await fetch(`${BASE}/reviews/coach/${coachId}`)
  return handleResponse<CoachReviewsData>(res)
}

export async function apiGetMyReviews(): Promise<Review[]> {
  const res = await fetch(`${BASE}/reviews/mine`, { headers: authHeaders() })
  return handleResponse<Review[]>(res)
}
