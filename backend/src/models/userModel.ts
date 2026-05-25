import pool from '../config/db.js';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password_hash'>;

export const userModel = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role?: string;
  }): Promise<User> {
    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.email, data.password_hash, data.first_name, data.last_name, data.role ?? 'MEMBER']
    );
    return result.rows[0]!;
  },

  async update(id: number, data: {
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
    if (data.password_hash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(data.password_hash); }
    if (data.first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(data.first_name); }
    if (data.last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(data.last_name); }
    if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role); }

    if (fields.length === 0) return userModel.findById(id);

    values.push(id);
    const result = await pool.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async findAll(filters: { role?: string; active?: boolean }): Promise<SafeUser[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.role !== undefined) {
      conditions.push(`role = $${idx++}`);
      values.push(filters.role);
    }
    if (filters.active !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      values.push(filters.active);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<SafeUser>(
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
       FROM users ${where} ORDER BY created_at DESC`,
      values
    );
    return result.rows;
  },

  async setStatus(id: number, isActive: boolean): Promise<SafeUser | null> {
    const result = await pool.query<SafeUser>(
      `UPDATE users SET is_active = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      [isActive, id]
    );
    return result.rows[0] ?? null;
  },
};
