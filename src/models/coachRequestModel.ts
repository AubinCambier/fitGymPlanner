import pool from '../config/db.js';

export interface CoachRequest {
  id: number;
  coach_id: number;
  session_id: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_id: number | null;
  admin_comment: string | null;
  decided_at: string | null;
  created_at: string;
}

export const coachRequestModel = {
  async findByCoach(coachId: number): Promise<CoachRequest[]> {
    const result = await pool.query<CoachRequest>(
      'SELECT * FROM coach_requests WHERE coach_id = $1 ORDER BY created_at DESC',
      [coachId]
    );
    return result.rows;
  },

  async findAll(filters: { status?: string }): Promise<CoachRequest[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.status !== undefined) {
      conditions.push(`status = $1`);
      values.push(filters.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<CoachRequest>(
      `SELECT * FROM coach_requests ${where} ORDER BY created_at DESC`,
      values
    );
    return result.rows;
  },

  async findById(id: number): Promise<CoachRequest | null> {
    const result = await pool.query<CoachRequest>(
      'SELECT * FROM coach_requests WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: { coach_id: number; session_id: number; reason: string }): Promise<CoachRequest> {
    const result = await pool.query<CoachRequest>(
      `INSERT INTO coach_requests (coach_id, session_id, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.coach_id, data.session_id, data.reason]
    );
    return result.rows[0]!;
  },

  async decide(id: number, data: {
    status: string;
    admin_id: number;
    admin_comment?: string;
  }): Promise<CoachRequest | null> {
    const result = await pool.query<CoachRequest>(
      `UPDATE coach_requests
       SET status = $1, admin_id = $2, admin_comment = $3, decided_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [data.status, data.admin_id, data.admin_comment ?? null, id]
    );
    return result.rows[0] ?? null;
  },
};
