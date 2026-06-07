import pool from '../config/db.js';

export interface Session {
  id: number;
  title: string;
  description: string | null;
  session_type_id: number;
  coach_id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

export interface SessionWithCount extends Session {
  registered_count: number;
  coach_first_name: string;
  coach_last_name: string;
}

export interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  booked_at: string;
}

export const sessionModel = {
  async findAll(filters: { type?: number; date?: string; coach_id?: number }): Promise<SessionWithCount[]> {
    const conditions: string[] = ['s.start_time > NOW()'];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.type !== undefined) {
      conditions.push(`s.session_type_id = $${idx++}`);
      values.push(filters.type);
    }
    if (filters.date !== undefined) {
      conditions.push(`s.start_time::date = $${idx++}`);
      values.push(filters.date);
    }
    if (filters.coach_id !== undefined) {
      conditions.push(`s.coach_id = $${idx++}`);
      values.push(filters.coach_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query<SessionWithCount>(
      `SELECT s.*, COUNT(b.id)::int AS registered_count,
              u.first_name AS coach_first_name, u.last_name AS coach_last_name
       FROM sessions s
       LEFT JOIN bookings b ON b.session_id = s.id AND b.status = 'CONFIRMED'
       JOIN users u ON u.id = s.coach_id
       ${where}
       GROUP BY s.id, u.first_name, u.last_name
       ORDER BY s.start_time ASC`,
      values
    );
    return result.rows;
  },

  async findById(id: number): Promise<SessionWithCount | null> {
    const result = await pool.query<SessionWithCount>(
      `SELECT s.*, COUNT(b.id)::int AS registered_count,
              u.first_name AS coach_first_name, u.last_name AS coach_last_name
       FROM sessions s
       LEFT JOIN bookings b ON b.session_id = s.id AND b.status = 'CONFIRMED'
       JOIN users u ON u.id = s.coach_id
       WHERE s.id = $1
       GROUP BY s.id, u.first_name, u.last_name`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: {
    title: string;
    description?: string;
    session_type_id: number;
    coach_id: number;
    start_time: string;
    end_time: string;
    capacity: number;
    intensity?: string;
  }): Promise<Session> {
    const result = await pool.query<Session>(
      `INSERT INTO sessions (title, description, session_type_id, coach_id, start_time, end_time, capacity, intensity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.title,
        data.description ?? null,
        data.session_type_id,
        data.coach_id,
        data.start_time,
        data.end_time,
        data.capacity,
        data.intensity ?? 'MEDIUM',
      ]
    );
    return result.rows[0]!;
  },

  async update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      session_type_id: number;
      coach_id: number;
      start_time: string;
      end_time: string;
      capacity: number;
      intensity: string;
      status: string;
    }>
  ): Promise<Session | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowed = ['title', 'description', 'session_type_id', 'coach_id', 'start_time', 'end_time', 'capacity', 'intensity', 'status'] as const;
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return sessionModel.findById(id);

    values.push(id);
    const result = await pool.query<Session>(
      `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async findParticipants(sessionId: number): Promise<Participant[]> {
    const result = await pool.query<Participant>(
      `SELECT u.id, u.first_name, u.last_name, u.email, b.booked_at
       FROM bookings b
       JOIN users u ON u.id = b.member_id
       WHERE b.session_id = $1 AND b.status = 'CONFIRMED'
       ORDER BY b.booked_at ASC`,
      [sessionId]
    );
    return result.rows;
  },
};
