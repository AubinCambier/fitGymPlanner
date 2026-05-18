import pool from '../config/db.js';

export interface Review {
  id: number;
  booking_id: number;
  member_id: number;
  coach_id: number;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithDisplay extends Review {
  display_name: string;
}

export interface CoachReviewStats {
  average: number;
  total: number;
  breakdown: Record<string, number>;
}

function computeDisplayName(review: {
  id: number;
  is_anonymous: boolean;
  first_name: string;
  last_name: string;
}): string {
  if (review.is_anonymous) return `Anonymous #${review.id % 10000}`;
  return `${review.first_name} ${review.last_name[0]}.`;
}

export const reviewModel = {
  async create(data: {
    booking_id: number;
    member_id: number;
    coach_id: number;
    rating: number;
    comment?: string;
    is_anonymous?: boolean;
  }): Promise<Review> {
    const result = await pool.query<Review>(
      `INSERT INTO reviews (booking_id, member_id, coach_id, rating, comment, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.booking_id,
        data.member_id,
        data.coach_id,
        data.rating,
        data.comment ?? null,
        data.is_anonymous ?? false,
      ]
    );
    return result.rows[0]!;
  },

  async findById(id: number): Promise<Review | null> {
    const result = await pool.query<Review>(
      'SELECT * FROM reviews WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async update(
    id: number,
    data: { rating?: number; comment?: string | null; is_anonymous?: boolean }
  ): Promise<Review | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.rating !== undefined) { sets.push(`rating = $${idx++}`); values.push(data.rating); }
    if (data.comment !== undefined) { sets.push(`comment = $${idx++}`); values.push(data.comment); }
    if (data.is_anonymous !== undefined) { sets.push(`is_anonymous = $${idx++}`); values.push(data.is_anonymous); }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query<Review>(
      `UPDATE reviews SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async findByCoach(coachId: number): Promise<{
    coach: { id: number; first_name: string; last_name: string };
    stats: CoachReviewStats;
    reviews: (ReviewWithDisplay & { created_at: string })[];
  }> {
    const coachResult = await pool.query<{ id: number; first_name: string; last_name: string }>(
      'SELECT id, first_name, last_name FROM users WHERE id = $1',
      [coachId]
    );
    const coach = coachResult.rows[0];

    const reviewsResult = await pool.query<
      Review & { first_name: string; last_name: string }
    >(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON u.id = r.member_id
       WHERE r.coach_id = $1
       ORDER BY r.created_at DESC`,
      [coachId]
    );

    const rows = reviewsResult.rows;
    const total = rows.length;
    const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    let sum = 0;

    for (const r of rows) {
      sum += r.rating;
      breakdown[String(r.rating)] = (breakdown[String(r.rating)] ?? 0) + 1;
    }

    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    const reviews = rows.map((r) => ({
      ...r,
      display_name: computeDisplayName(r),
    }));

    return {
      coach: coach ?? { id: coachId, first_name: '', last_name: '' },
      stats: { average, total, breakdown },
      reviews,
    };
  },

  async findByMember(memberId: number): Promise<Review[]> {
    const result = await pool.query<Review>(
      'SELECT * FROM reviews WHERE member_id = $1 ORDER BY created_at DESC',
      [memberId]
    );
    return result.rows;
  },
};
