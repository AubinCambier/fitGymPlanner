import pool from '../config/db.js';

export interface Membership {
  id: number;
  member_id: number;
  pricing_id: number;
  payment_mode: 'MONTHLY' | 'PAY_PER_SESSION';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const membershipModel = {
  async findActiveByMember(memberId: number): Promise<Membership | null> {
    const result = await pool.query<Membership>(
      `SELECT * FROM memberships WHERE member_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [memberId]
    );
    return result.rows[0] ?? null;
  },

  async create(data: {
    member_id: number;
    pricing_id: number;
    payment_mode: string;
  }): Promise<Membership> {
    const result = await pool.query<Membership>(
      `INSERT INTO memberships (member_id, pricing_id, payment_mode)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.member_id, data.pricing_id, data.payment_mode]
    );
    return result.rows[0]!;
  },

  async cancel(memberId: number): Promise<Membership | null> {
    const result = await pool.query<Membership>(
      `UPDATE memberships SET status = 'CANCELLED'
       WHERE member_id = $1 AND status = 'ACTIVE'
       RETURNING *`,
      [memberId]
    );
    return result.rows[0] ?? null;
  },
};
