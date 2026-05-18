import pool from '../config/db.js';

export interface Payment {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  description: string;
  status: string;
  created_at: string;
}

export const paymentModel = {
  async create(data: { user_id: number; amount: number; description: string }): Promise<Payment> {
    const result = await pool.query<Payment>(
      `INSERT INTO payments (user_id, amount, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.user_id, data.amount, data.description]
    );
    return result.rows[0]!;
  },

  async findByUser(userId: number): Promise<Payment[]> {
    const result = await pool.query<Payment>(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },
};
