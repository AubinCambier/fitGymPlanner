import pool from '../config/db.js';

export interface Pricing {
  id: number;
  label: string;
  payment_mode: 'MONTHLY' | 'PAY_PER_SESSION';
  price: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export const pricingModel = {
  async findAllActive(): Promise<Pricing[]> {
    const result = await pool.query<Pricing>(
      'SELECT * FROM pricing WHERE is_active = TRUE ORDER BY price ASC'
    );
    return result.rows;
  },

  async findAll(): Promise<Pricing[]> {
    const result = await pool.query<Pricing>(
      'SELECT * FROM pricing ORDER BY created_at DESC'
    );
    return result.rows;
  },

  async findById(id: number): Promise<Pricing | null> {
    const result = await pool.query<Pricing>(
      'SELECT * FROM pricing WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: {
    label: string;
    payment_mode: string;
    price: number;
    currency?: string;
  }): Promise<Pricing> {
    const result = await pool.query<Pricing>(
      `INSERT INTO pricing (label, payment_mode, price, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.label, data.payment_mode, data.price, data.currency ?? 'EUR']
    );
    return result.rows[0]!;
  },

  async update(id: number, data: {
    label?: string;
    payment_mode?: string;
    price?: number;
    currency?: string;
  }): Promise<Pricing | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.label !== undefined) { fields.push(`label = $${idx++}`); values.push(data.label); }
    if (data.payment_mode !== undefined) { fields.push(`payment_mode = $${idx++}`); values.push(data.payment_mode); }
    if (data.price !== undefined) { fields.push(`price = $${idx++}`); values.push(data.price); }
    if (data.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(data.currency); }

    if (fields.length === 0) return pricingModel.findById(id);

    values.push(id);
    const result = await pool.query<Pricing>(
      `UPDATE pricing SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async setStatus(id: number, isActive: boolean): Promise<Pricing | null> {
    const result = await pool.query<Pricing>(
      'UPDATE pricing SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    return result.rows[0] ?? null;
  },
};
