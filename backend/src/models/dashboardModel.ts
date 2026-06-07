import pool from '../config/db.js'

export interface TopSession {
  id: number
  title: string
  capacity: number
  registered_count: number
  fill_rate: number
  start_time: string
}

export interface DashboardStats {
  total_revenue: number
  revenue_this_month: number
  active_members: number
  active_memberships: number
  upcoming_sessions: number
  bookings_this_month: number
  top_sessions: TopSession[]
}

export const dashboardModel = {
  async getStats(): Promise<DashboardStats> {
    const [revenue, revenueMonth, members, memberships, sessions, bookingsMonth, topSessions] =
      await Promise.all([
        pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'SUCCESS'"),
        pool.query(
          "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'SUCCESS' AND date_trunc('month', created_at) = date_trunc('month', NOW())"
        ),
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'MEMBER' AND is_active = TRUE"),
        pool.query("SELECT COUNT(*) FROM memberships WHERE status = 'ACTIVE'"),
        pool.query("SELECT COUNT(*) FROM sessions WHERE status = 'SCHEDULED' AND start_time > NOW()"),
        pool.query(
          "SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED' AND date_trunc('month', booked_at) = date_trunc('month', NOW())"
        ),
        pool.query(`
          SELECT s.id, s.title, s.capacity, s.start_time,
                 COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED') AS registered_count,
                 ROUND(
                   COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED')::numeric / s.capacity * 100
                 ) AS fill_rate
          FROM sessions s
          LEFT JOIN bookings b ON b.session_id = s.id
          WHERE s.status = 'SCHEDULED' AND s.start_time > NOW()
          GROUP BY s.id
          ORDER BY registered_count DESC, fill_rate DESC
          LIMIT 5
        `),
      ])

    return {
      total_revenue: parseFloat(revenue.rows[0].total),
      revenue_this_month: parseFloat(revenueMonth.rows[0].total),
      active_members: parseInt(members.rows[0].count),
      active_memberships: parseInt(memberships.rows[0].count),
      upcoming_sessions: parseInt(sessions.rows[0].count),
      bookings_this_month: parseInt(bookingsMonth.rows[0].count),
      top_sessions: topSessions.rows.map(r => ({
        id: r.id,
        title: r.title,
        capacity: r.capacity,
        registered_count: parseInt(r.registered_count),
        fill_rate: parseInt(r.fill_rate),
        start_time: r.start_time,
      })),
    }
  },
}
