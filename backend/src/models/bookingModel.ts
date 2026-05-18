import pool from '../config/db.js';

export interface Booking {
  id: number;
  member_id: number;
  session_id: number;
  status: 'CONFIRMED' | 'CANCELLED';
  booked_at: string;
  cancelled_at: string | null;
}

export interface BookingWithSession extends Booking {
  session_title: string;
  session_start_time: string;
  session_end_time: string;
  session_status: string;
  coach_id: number;
  coach_first_name: string;
  coach_last_name: string;
}

export const bookingModel = {
  async findByMember(memberId: number): Promise<BookingWithSession[]> {
    const result = await pool.query<BookingWithSession>(
      `SELECT b.*, s.title AS session_title, s.start_time AS session_start_time,
              s.end_time AS session_end_time, s.status AS session_status,
              s.coach_id, u.first_name AS coach_first_name, u.last_name AS coach_last_name
       FROM bookings b
       JOIN sessions s ON s.id = b.session_id
       JOIN users u ON u.id = s.coach_id
       WHERE b.member_id = $1
       ORDER BY b.booked_at DESC`,
      [memberId]
    );
    return result.rows;
  },

  async findById(id: number): Promise<Booking | null> {
    const result = await pool.query<Booking>(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(memberId: number, sessionId: number): Promise<Booking> {
    const result = await pool.query<Booking>(
      `INSERT INTO bookings (member_id, session_id) VALUES ($1, $2) RETURNING *`,
      [memberId, sessionId]
    );
    return result.rows[0]!;
  },

  async cancel(id: number): Promise<Booking | null> {
    const result = await pool.query<Booking>(
      `UPDATE bookings SET status = 'CANCELLED', cancelled_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  },
};
