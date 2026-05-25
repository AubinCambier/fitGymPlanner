import pool from '../config/db.js';

export interface Sanction {
  id: number;
  user_id: number;
  issued_by: number;
  sanction_type: 'WARNING' | 'SUSPENSION' | 'BAN';
  reason: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export const sanctionModel = {
  async findAll(): Promise<Sanction[]> {
    const result = await pool.query<Sanction>(
      `SELECT * FROM sanctions ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async findById(id: number): Promise<Sanction | null> {
    const result = await pool.query<Sanction>(
      'SELECT * FROM sanctions WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: {
    user_id: number;
    issued_by: number;
    sanction_type: string;
    reason: string;
    end_date?: string;
  }): Promise<Sanction> {
    const result = await pool.query<Sanction>(
      `INSERT INTO sanctions (user_id, issued_by, sanction_type, reason, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.user_id, data.issued_by, data.sanction_type, data.reason, data.end_date ?? null]
    );
    return result.rows[0]!;
  },

  async update(id: number, data: {
    reason?: string;
    end_date?: string;
    is_active?: boolean;
  }): Promise<Sanction | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.reason !== undefined) { fields.push(`reason = $${idx++}`); values.push(data.reason); }
    if (data.end_date !== undefined) { fields.push(`end_date = $${idx++}`); values.push(data.end_date); }
    if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }

    if (fields.length === 0) return sanctionModel.findById(id);

    values.push(id);
    const result = await pool.query<Sanction>(
      `UPDATE sanctions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async hasActiveHardSanction(userId: number): Promise<boolean> {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM sanctions
       WHERE user_id = $1 AND is_active = TRUE AND sanction_type IN ('BAN', 'SUSPENSION')`,
      [userId]
    );
    return parseInt(result.rows[0]!.count, 10) > 0;
  },
};
