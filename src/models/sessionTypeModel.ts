import pool from '../config/db.js';

export interface SessionType {
  id: number;
  name: string;
  description: string | null;
}

export const sessionTypeModel = {
  async findAll(): Promise<SessionType[]> {
    const result = await pool.query<SessionType>(
      'SELECT * FROM session_types ORDER BY name ASC'
    );
    return result.rows;
  },

  async findById(id: number): Promise<SessionType | null> {
    const result = await pool.query<SessionType>(
      'SELECT * FROM session_types WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: { name: string; description?: string }): Promise<SessionType> {
    const result = await pool.query<SessionType>(
      'INSERT INTO session_types (name, description) VALUES ($1, $2) RETURNING *',
      [data.name, data.description ?? null]
    );
    return result.rows[0]!;
  },

  async update(id: number, data: { name?: string; description?: string }): Promise<SessionType | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }

    if (fields.length === 0) return sessionTypeModel.findById(id);

    values.push(id);
    const result = await pool.query<SessionType>(
      `UPDATE session_types SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM session_types WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
